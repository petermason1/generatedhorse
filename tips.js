console.log('tips.js loaded');

const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];
if (!races.length) {
  main.innerHTML = '<div class="container"><h2>No racecards loaded.</h2></div>';
  throw new Error('No racecards!');
}

// Hardcoded weights for tips.js specific scoring
// These weights are designed to find strong contenders based on handicapping factors.
const TIPS_WEIGHTS = {
    rprWeight: 1.8,   // High importance for overall ability based on RPR
    tsWeight: 1.0,    // Moderate importance for raw speed rating
    orWeight: 0.7,    // Moderate importance for official ranking
    winsWeight: 3.5,  // Very high importance for recent winning form
    placesWeight: 2.0, // High importance for consistent placing (2nd/3rd)
    lastRunPenaltyWeight: -0.3, // Penalty for long breaks from racing (e.g., > 50 days)
    lastRunBonusWeight: 0.15,   // Bonus for recent runs (e.g., within 30 days)
    trainerPercentWeight: 1.8,  // Strong importance for trainer's win percentage in recent form
    trainerWinsWeight: 1.5,     // Strong importance for trainer's number of winners in recent form
    trainerBonusValue: 0.8,     // Flat bonus if trainer's win percentage is high (e.g., >= 20%)
    layoffPenaltyValue: -3.0,   // Strong penalty if horse has no recent wins and a long layoff
    courseFormWeight: 1.0       // Value for proven course specialists (assuming 'course_form' exists)
};

// --- Score function for tips ---
function scoreRunner(r) {
    const rpr = Number.parseInt(r.rpr) || 0;
    const ts = Number.parseInt(r.ts) || 0;
    const or = Number.parseInt(r.ofr) || 0;
    const lastRun = Number.parseInt(r.last_run);
    const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99; // Default to high layoff if missing data

    let wins = 0, places = 0;
    if (typeof r.form === 'string') {
        wins = (r.form.match(/1/g) || []).length;
        places = (r.form.match(/[23]/g) || []).length;
    }

    const trainerPercent = Number.parseFloat(r.trainer_14_days?.percent) || 0;
    const trainerWins = Number.parseInt(r.trainer_14_days?.wins) || 0;

    // Assuming 'course_form' exists and is similar to 'form' string (e.g., '1-2-0').
    // If not, this value will be 0 and won't affect the score unless course_form data is added.
    const courseFormWins = (r.course_form?.match(/1/g) || []).length;

    let score = 0;
    score += TIPS_WEIGHTS.rprWeight * rpr;
    score += TIPS_WEIGHTS.tsWeight * ts;
    score += TIPS_WEIGHTS.orWeight * or;
    score += TIPS_WEIGHTS.winsWeight * wins;
    score += TIPS_WEIGHTS.placesWeight * places;

    // Apply last run penalty/bonus based on days since last run
    if (lastRunVal > 50) {
        score += (lastRunVal - 50) * TIPS_WEIGHTS.lastRunPenaltyWeight;
    } else if (lastRunVal <= 30) { // Reward horses that have run relatively recently (e.g., within 30 days)
        score += (30 - lastRunVal) * TIPS_WEIGHTS.lastRunBonusWeight;
    }

    score += TIPS_WEIGHTS.trainerPercentWeight * trainerPercent;
    score += TIPS_WEIGHTS.trainerWinsWeight * trainerWins;
    // Apply trainer bonus if their recent win percentage is high
    score += (trainerPercent >= 20 ? TIPS_WEIGHTS.trainerBonusValue : 0);
    // Apply layoff penalty if no wins AND a significant layoff
    score += (wins === 0 && lastRunVal > 50) ? TIPS_WEIGHTS.layoffPenaltyValue : 0;
    score += TIPS_WEIGHTS.courseFormWeight * courseFormWins; // Add course form contribution

    // Normalize score if it falls extremely low, to keep it somewhat positive for display
    if (score < -12) score = -12 + (score + 12) * 0.4;
    // Ensure score is a finite number, default to 0 if calculation results in NaN/Infinity
    if (!Number.isFinite(score)) score = 0;

    return Math.round(score * 100) / 100; // Keep 2 decimal places for better precision in sorting
}

// --- Reason blurb for each pick ---
function explainPick(r) {
    let reasons = [];
    const rpr = Number.parseInt(r.rpr) || 0;
    const ts = Number.parseInt(r.ts) || 0;
    const or = Number.parseInt(r.ofr) || 0;
    const lastRun = Number.parseInt(r.last_run) || 99;
    let oddsFrac = r.odds?.[0]?.fractional || '';
    let form = typeof r.form === 'string' ? r.form : '';
    let trainerP = r.trainer_14_days?.percent ? Number.parseFloat(r.trainer_14_days.percent) : 0;
    let trainerW = r.trainer_14_days?.wins ? Number.parseInt(r.trainer_14_days.wins) : 0;
    let wins = (form.match(/1/g) || []).length;
    let placed = (form.match(/[23]/g) || []).length;
    const courseFormWins = (r.course_form?.match(/1/g) || []).length;

    // Positive indicators (strengths)
    if (wins >= 2) reasons.push(`multiple recent wins (${wins})`);
    else if (wins === 1) reasons.push(`a recent win`);
    if (placed > 0) reasons.push(`consistent form with ${placed} places`);
    if (rpr > 120) reasons.push(`a high RPR (${rpr})`);
    if (ts > 90) reasons.push(`strong Topspeed (${ts})`);
    if (or > 110) reasons.push(`a top Official Rating (${or})`);
    if (lastRun <= 25) reasons.push(`raced recently (${lastRun} days ago)`);
    if (trainerP > 20) reasons.push(`trainer in hot form (${trainerP}% last 2wks)`);
    if (trainerW > 3) reasons.push(`trainer has multiple recent winners (${trainerW})`);
    if (courseFormWins >= 1) reasons.push(`proven course form (${courseFormWins} course win)`);

    // Negative indicators (considerations/weaknesses)
    let negativeReasons = [];
    if (lastRun > 90 && wins === 0) negativeReasons.push(`a long layoff without recent wins`);

    // Construct the main reason string, combining positive and negative
    let mainReason = reasons.length ? `Showing strengths such as ${reasons.slice(0, 3).join(', ')}.` : 'Solid profile for this contest.';

    if (negativeReasons.length) {
        mainReason += ` Key considerations include ${negativeReasons.join(', ')}.`;
    }

    if (oddsFrac) {
        mainReason += ` Current odds: ${oddsFrac}.`;
    }

    return mainReason.charAt(0).toUpperCase() + mainReason.slice(1); // Capitalize first letter
}

// --- Attach scores and decimal odds to all runners ---
races.forEach(race => {
    (race.runners || []).forEach(r => {
        r.score = scoreRunner(r);
        r.oddsDecimal = fractionToDecimalOdds(r.odds?.[0]?.fractional);
    });
});

// --- Tip categories limits ---
const MAX_TOP_PICKS = 3;
const MAX_VALUE_PICKS = 3;
const MAX_OUTSIDER_PICKS = 3;

// --- Tips arrays ---
const topPicks = [];
const valuePicks = [];
const outsiders = [];
const pickedKeys = new Set(); // To ensure a horse is picked only once across all categories

// Helper function to add a pick if space is available and not duplicated
function addPick(pick, categoryArray, maxLimit) {
    const key = runnerKey(pick, pick.race);
    if (categoryArray.length < maxLimit && !pickedKeys.has(key)) {
        categoryArray.push(pick);
        pickedKeys.add(key);
        return true;
    }
    return false;
}

// --- Main Tip Generation Logic ---
races.forEach(race => {
    if (!race.runners || !race.runners.length) return;

    // Sort runners by their calculated score (best to worst)
    const sortedByScore = [...race.runners].sort((a, b) => (b.score || 0) - (a.score || 0));
    const topScorerInRace = sortedByScore[0];

    if (!topScorerInRace || topScorerInRace.score <= 0) return; // Skip if no valid top scorer

    // --- Top Pick Logic ---
    // The highest-scoring horse, but only if its odds are relatively short (e.g., < 6/1 decimal)
    if (topScorerInRace.oddsDecimal && topScorerInRace.oddsDecimal <= 7.0) { // 7.0 includes 6/1
        addPick(topScorerInRace, topPicks, MAX_TOP_PICKS);
    }

    // --- Value Pick Logic ---
    // Look for runners with good scores (e.g., at least 75% of the top score) at mid-range odds
    for (const r of sortedByScore) {
        if (pickedKeys.has(runnerKey(r, race))) continue; // Skip if already picked

        const minOddsValue = 6.0; // Corresponds to 5/1
        const maxOddsValue = 17.0; // Corresponds to 16/1
        const minScoreRatioValue = 0.75; // Must have at least 75% of the top scorer's score

        if (r.oddsDecimal && r.oddsDecimal >= minOddsValue && r.oddsDecimal < maxOddsValue &&
            (r.score / topScorerInRace.score) >= minScoreRatioValue && r.score > 0) {
            addPick(r, valuePicks, MAX_VALUE_PICKS);
        }
    }

    // --- Outsider Pick Logic ---
    // Look for runners with decent scores (e.g., at least 50% of the top score) at long odds
    for (const r of sortedByScore) {
        if (pickedKeys.has(runnerKey(r, race))) continue; // Skip if already picked

        const minOddsOutsider = 17.0; // Corresponds to 16/1
        const minScoreRatioOutsider = 0.50; // Must have at least 50% of the top scorer's score

        if (r.oddsDecimal && r.oddsDecimal >= minOddsOutsider &&
            (r.score / topScorerInRace.score) >= minScoreRatioOutsider && r.score > 0) {
            addPick(r, outsiders, MAX_OUTSIDER_PICKS);
        }
    }
});

// Final sort each category by score for presentation (highest score first)
topPicks.sort((a, b) => (b.score || 0) - (a.score || 0));
valuePicks.sort((a, b) => (b.score || 0) - (a.score || 0));
outsiders.sort((a, b) => (b.score || 0) - (a.score || 0));

// --- Render helper for individual tip cards ---
function renderTipCard(r, i, badge) {
  return `
    <div class="tip-card">
      <span class="tip-num">${i+1}</span>
      <div class="tip-content">
        <div class="tip-header">
          <a href="racecard.html?race_id=${r.race._id}" class="tip-horse">${r.horse}</a>
          <span class="tip-odds">${r.odds?.[0]?.fractional || ''}</span>
          <span class="tip-score">(Score: ${r.score})</span>
        </div>
        <div class="tip-race-info">
          ${r.race.course} ${r.race.off_time} — <span class="tip-race-name">${r.race.race_name}</span>
        </div>
        <div class="tip-reason">${explainPick(r)}</div>
        ${badge ? `<span class="tip-badge ${badge.toLowerCase().replace(' ', '-')}">${badge}</span>` : ''}
      </div>
    </div>
  `;
}

// --- Render the main tips page content ---
main.innerHTML = `
  <div class="container">
    <h1 class="page-title">Today’s Horse Racing Tips</h1>
    <p class="tips-intro">Our advanced system analyzes key performance metrics for every horse and race to identify potential top picks, value bets, and promising outsiders for today's racing action. Remember to always gamble responsibly.</p>

    <section class="tips-section">
      <h2 class="section-title top-picks-title">Top Picks <span class="section-subtitle">(Highest Rated, Shorter Odds)</span></h2>
      ${topPicks.length ? topPicks.map((r, i) => renderTipCard(r, i, 'Top Pick')).join('') : '<div class="no-picks">No top picks today.</div>'}
    </section>

    <section class="tips-section">
      <h2 class="section-title value-picks-title">Value Bets <span class="section-subtitle">(Strong Score, Mid-Range Odds)</span></h2>
      ${valuePicks.length ? valuePicks.map((r, i) => renderTipCard(r, i, 'Value')).join('') : '<div class="no-picks">No value bets today.</div>'}
    </section>

    <section class="tips-section">
      <h2 class="section-title outsider-picks-title">Outside Chancers <span class="section-subtitle">(Potential at Longer Odds)</span></h2>
      ${outsiders.length ? outsiders.map((r, i) => renderTipCard(r, i, 'Outsider')).join('') : '<div class="no-picks">No outside chancers today.</div>'}
    </section>
  </div>
`;

console.log('tips.js finished.');


// --- Helper Functions (moved to bottom for clarity, or can be in a separate 'utils.js' if shared) ---

// Helper: Converts fractional odds string (e.g., "7/4") to a decimal number.
function fractionToDecimalOdds(fraction) {
    if (!fraction || typeof fraction !== 'string') return Infinity; // Return Infinity for non-numeric/missing odds
    const parts = fraction.split('/');
    if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (denominator !== 0 && Number.isFinite(numerator) && Number.isFinite(denominator)) {
            return (numerator / denominator) + 1; // Add 1 for decimal odds (e.g., 7/4 = 1.75 + 1 = 2.75)
        }
    }
    // Handle cases where odds might already be in decimal or just a single number
    const decimalValue = parseFloat(fraction);
    if (Number.isFinite(decimalValue)) {
        return decimalValue;
    }
    return Infinity; // Return Infinity for invalid odds string
}

// Helper function for unique runner keys for the Set
function runnerKey(r, race) {
  // Use race._id if available, otherwise race.race_id (from fetched data structure)
  // Use horse_id if available, otherwise horse name (less reliable but fallback)
  return `${race._id || race.race_id || 'no-race-id'}|${r.horse_id || r.horse || 'no-horse-id'}`;
}

// Truncate text utility (can be shared from global if needed)
function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + '...';
  }
  return text;
}
