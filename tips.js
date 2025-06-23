console.log('tips.js loaded');

const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];
if (!races.length) {
  main.innerHTML = '<div class="container"><h2>No racecards loaded.</h2></div>'; // Added container
  throw new Error('No racecards!');
}

// --- Score function (same as your main) ---
function scoreRunner(r) {
  let score = 0;
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run) || 99;
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/[23]/g) || []).length;
  }
  let trainerPercent = r.trainer_14_days?.percent ? parseFloat(r.trainer_14_days.percent) : 0;
  let trainerWins = r.trainer_14_days?.wins ? parseInt(r.trainer_14_days.wins) : 0;

  score += rpr;
  score += 0.5 * ts;
  score += 0.3 * or;
  score += 3 * wins + 1 * places;
  if (lastRun > 60) score -= (lastRun - 60) * 0.4;
  score += Math.max(0, 60 - lastRun) * 0.1;
  score += 0.7 * trainerPercent;
  score += 1.1 * trainerWins;

  if (score === 0) score = 1;
  return Math.round(score * 10) / 10;
}

// --- Reason blurb ---
function explainPick(r) {
  let reasons = [];
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run) || 99;
  let oddsDec = r.odds?.[0]?.decimal ? parseFloat(r.odds[0].decimal) : 0;
  let oddsFrac = r.odds?.[0]?.fractional || '';
  let form = typeof r.form === 'string' ? r.form : '';
  let trainerP = r.trainer_14_days?.percent ? parseFloat(r.trainer_14_days.percent) : 0;
  let trainerW = r.trainer_14_days?.wins ? parseInt(r.trainer_14_days.wins) : 0;
  let wins = (form.match(/1/g) || []).length;
  let placed = (form.match(/[23]/g) || []).length;

  if (wins >= 2) reasons.push(`Multiple recent wins (${wins})`);
  else if (wins === 1) reasons.push(`Recent win`);
  if (placed > 0) reasons.push(`Consistent placer (${placed}x 2nd/3rd)`);
  if (rpr > 120) reasons.push(`High Racing Post Rating (${rpr})`);
  if (ts > 90) reasons.push(`Strong Topspeed (${ts})`);
  if (or > 110) reasons.push(`Top Official Rating (${or})`);
  if (lastRun <= 21) reasons.push(`Raced recently (${lastRun} days ago)`);
  if (trainerP > 20) reasons.push(`Trainer in hot form (${trainerP}% last 2wks)`);
  if (trainerW > 2) reasons.push(`Trainer has multiple winners last 2wks`);
  if (oddsDec >= 8 && r.score > 0) reasons.push(`Big price (${oddsFrac}) but ranks well on ratings`);
  if (!reasons.length && oddsDec) reasons.push(`Short price favourite (${oddsFrac})`);
  return reasons.length ? reasons.slice(0,2).join('. ') + '.' : 'Solid profile for this contest.';
}

// --- Attach scores ---
races.forEach(race => (race.runners || []).forEach(r => r.score = scoreRunner(r)));

const pickedKeys = new Set();
function runnerKey(r, race) {
  return `${race._id || race.race_id || ''}|${r.horse_id || r.horse}`;
}

// --- Tips arrays
const topPicks = [];
const valuePicks = [];
const outsiders = [];
const skippedTopLongshots = [];

// --- Logic ---
races.forEach(race => {
  if (!race.runners || !race.runners.length) return;

  // Sort by your model score (best to worst)
  const sorted = [...race.runners].sort((a, b) => (b.score || 0) - (a.score || 0));
  const top = sorted[0];

  // Find top 3 in market (lowest odds)
  const sortedByOdds = [...race.runners]
    .filter(r => r.odds?.[0]?.decimal)
    .sort((a, b) => parseFloat(a.odds[0].decimal) - parseFloat(b.odds[0].decimal));
  const topMarketHorses = sortedByOdds.slice(0, 3).map(r => r.horse_id || r.horse);

  // --- Top pick: only if best scoring runner is in top 3 of market ---
  let topPick = null;
  const topIsInMarket = topMarketHorses.includes(top.horse_id || top.horse);
  const topOdds = top.odds?.[0]?.decimal ? parseFloat(top.odds[0].decimal) : 0;

  if (topIsInMarket && topOdds > 2.0) {
    // Main system pick
    topPick = top;
  } else if (!topIsInMarket && topOdds > 6.0) {
    // It's a rag, keep for outsiders later
    skippedTopLongshots.push({ ...top, race });
  }

  if (topPick && topPicks.length < 6) {
    topPicks.push({ ...topPick, race });
    pickedKeys.add(runnerKey(topPick, race));
  }

  // --- Value pick: odds ≥5/1, score ≥90% of top, not already picked ---
  let bestValue = null, bestValScore = -Infinity;
  for (const r of sorted) {
    const odds = r.odds?.[0]?.decimal ? parseFloat(r.odds[0].decimal) : 0;
    if (odds >= 5 && (r.score / top.score) >= 0.90 && !pickedKeys.has(runnerKey(r, race))) {
      if (r.score > bestValScore) {
        bestValue = r;
        bestValScore = r.score;
      }
    }
  }
  if (bestValue) {
    valuePicks.push({ ...bestValue, race });
    pickedKeys.add(runnerKey(bestValue, race));
  }

  // --- Outsider pick: odds ≥12/1, score ≥75% of top, not already picked ---
  let bestOutsider = null, bestOutScore = -Infinity;
  for (const r of sorted) {
    const odds = r.odds?.[0]?.decimal ? parseFloat(r.odds[0].decimal) : 0;
    if (odds >= 12 && (r.score / top.score) >= 0.75 && !pickedKeys.has(runnerKey(r, race))) {
      if (r.score > bestOutScore) {
        bestOutsider = r;
        bestOutScore = r.score;
      }
    }
  }
  if (bestOutsider) {
    outsiders.push({ ...bestOutsider, race });
    pickedKeys.add(runnerKey(bestOutsider, race));
  }
});

// --- Add any top longshots that weren't picked as top or value ---
// (so you don't lose the clever high-score rag as a tip)
for (const r of skippedTopLongshots) {
  if (!pickedKeys.has(runnerKey(r, r.race)) && outsiders.length < 4) {
    outsiders.push(r);
    pickedKeys.add(runnerKey(r, r.race));
  }
}

// --- Limit shown ---
const showValue = valuePicks.slice(0, 5);
const showOutsiders = outsiders.slice(0, 4);

// --- Render helper ---
function renderTipCard(r, i, badge) {
  return `
    <div class="tip-card">
      <span class="tip-num">${i+1}</span>
      <div class="tip-content">
        <div class="tip-header">
          <a href="racecard.html?race_id=${r.race._id}" class="tip-horse">${r.horse}</a>
          <span class="tip-odds">${r.odds?.[0]?.fractional || ''}</span>
          <span class="tip-score">(${r.score})</span>
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

// --- Render the page
main.innerHTML = `
  <div class="container"> <!-- Wrapped content in container for proper max-width and padding -->
    <h1 class="page-title">Today’s Horse Racing Tips</h1>
    <section class="tips-section">
      <h2 class="section-title top-picks-title">Top Picks</h2>
      ${topPicks.length ? topPicks.map((r, i) => renderTipCard(r, i, 'Top Pick')).join('') : '<div class="no-picks">No top picks today.</div>'}
    </section>
    <section class="tips-section">
      <h2 class="section-title value-picks-title">Value Picks</h2>
      ${showValue.length ? showValue.map((r, i) => renderTipCard(r, i, 'Value')).join('') : '<div class="no-picks">No value picks today.</div>'}
    </section>
    <section class="tips-section">
      <h2 class="section-title outsider-picks-title">Outside Chancers</h2>
      ${showOutsiders.length ? showOutsiders.map((r, i) => renderTipCard(r, i, 'Outsider')).join('') : '<div class="no-picks">No outsider picks today.</div>'}
    </section>
  </div>
`;

console.log('tips.js finished.');
