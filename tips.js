console.log('tips.js: Script started.');

(function() {
    const main = document.getElementById('main');
    if (!main) {
        console.error("tips.js: Main element with ID 'main' not found in the DOM.");
        alert("Error: Page structure incomplete. Missing 'main' element. Please check tips.html.");
        return;
    }

    let races = [];
    try {
        if (window.racecardsData && Array.isArray(window.racecardsData.racecards)) {
            races = window.racecardsData.racecards;
            console.log(`tips.js: Loaded ${races.length} races from data.js.`);
        } else {
            main.innerHTML = `<div class="container"><h1 class="page-title">Today’s Horse Racing Tips</h1><p class="tips-intro">Our advanced system analyzes key performance metrics for every horse and race to identify potential top picks, value bets, and promising outsiders for today's racing action. Remember to always gamble responsibly.</p><h2>No racecards loaded or data format is incorrect.</h2><p>Please ensure 'data.js' is correctly generated and contains valid racecard data.</p></div>`;
            return;
        }
    } catch (error) {
        console.error("tips.js: Error loading racecards data:", error);
        main.innerHTML = `<div class="container"><h1 class="page-title">Today’s Horse Racing Tips</h1><p class="tips-intro">Our advanced system analyzes key performance metrics for every horse and race to identify potential top picks, value bets, and promising outsiders for today's racing action. Remember to always gamble responsibly.</p><h2>Error loading race data.</h2><p>Please check your 'data.js' file for errors in the browser console.</p></div>`;
        return;
    }

    // Scoring
    const TIPS_WEIGHTS = {
        rprWeight: 1.8, tsWeight: 1.0, orWeight: 0.7, winsWeight: 3.5, placesWeight: 2.0,
        lastRunPenaltyWeight: -0.3, lastRunBonusWeight: 0.15,
        trainerPercentWeight: 1.8, trainerWinsWeight: 1.5,
        trainerBonusValue: 0.8, layoffPenaltyValue: -3.0, courseFormWeight: 1.0
    };

    function scoreRunner(r) {
        const rpr = Number.parseInt(r.rpr) || 0;
        const ts = Number.parseInt(r.ts) || 0;
        const or = Number.parseInt(r.ofr) || 0;
        const lastRun = Number.parseInt(r.last_run);
        const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99;
        let wins = 0, places = 0;
        if (typeof r.form === 'string') {
            wins = (r.form.match(/1/g) || []).length;
            places = (r.form.match(/[23]/g) || []).length;
        }
        const trainerPercent = Number.parseFloat(r.trainer_14_days?.percent) || 0;
        const trainerWins = Number.parseInt(r.trainer_14_days?.wins) || 0;
        const courseFormWins = (r.course_form?.match(/1/g) || []).length;

        let score = 0;
        score += TIPS_WEIGHTS.rprWeight * rpr;
        score += TIPS_WEIGHTS.tsWeight * ts;
        score += TIPS_WEIGHTS.orWeight * or;
        score += TIPS_WEIGHTS.winsWeight * wins;
        score += TIPS_WEIGHTS.placesWeight * places;
        if (lastRunVal > 50) score += (lastRunVal - 50) * TIPS_WEIGHTS.lastRunPenaltyWeight;
        else if (lastRunVal <= 30) score += (30 - lastRunVal) * TIPS_WEIGHTS.lastRunBonusWeight;
        score += TIPS_WEIGHTS.trainerPercentWeight * trainerPercent;
        score += TIPS_WEIGHTS.trainerWinsWeight * trainerWins;
        score += (trainerPercent >= 20 ? TIPS_WEIGHTS.trainerBonusValue : 0);
        score += (wins === 0 && lastRunVal > 50) ? TIPS_WEIGHTS.layoffPenaltyValue : 0;
        score += TIPS_WEIGHTS.courseFormWeight * courseFormWins;
        if (score < -12) score = -12 + (score + 12) * 0.4;
        if (!Number.isFinite(score)) score = 0;
        return Math.round(score * 100) / 100;
    }

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

        if (trainerP >= 25 && trainerW >= 5) reasons.push(`trainer in excellent recent form (${trainerP}% with ${trainerW} wins)`);
        else if (trainerP >= 20) reasons.push(`trainer in hot form (${trainerP}% last 2wks)`);
        else if (trainerW >= 3) reasons.push(`trainer has multiple recent winners (${trainerW})`);
        if (wins >= 2) reasons.push(`multiple recent wins (${wins})`);
        else if (wins === 1) reasons.push(`a recent win`);
        if (rpr > 125) reasons.push(`a very high RPR (${rpr})`);
        else if (rpr > 110) reasons.push(`a high RPR (${rpr})`);
        if (ts > 95) reasons.push(`impressive Topspeed (${ts})`);
        else if (ts > 85) reasons.push(`strong Topspeed (${ts})`);
        if (or > 115) reasons.push(`a top Official Rating (${or})`);
        else if (or > 105) reasons.push(`a strong Official Rating (${or})`);
        if (placed >= 3) reasons.push(`very consistent with ${placed} recent places`);
        else if (placed > 0) reasons.push(`consistent form with ${placed} places`);
        if (courseFormWins >= 2) reasons.push(`proven course specialist with ${courseFormWins} course wins`);
        else if (courseFormWins === 1) reasons.push(`proven course form with a course win`);
        if (lastRun <= 25) reasons.push(`raced recently (${lastRun} days ago)`);
        let negativeReasons = [];
        if (lastRun > 90 && wins === 0) negativeReasons.push(`a long layoff without recent wins`);

        let mainReason = '';
        if (reasons.length > 0) {
            mainReason = `Key strengths include ${reasons.slice(0, 3).join(', ')}.`;
            if (reasons.length > 3) {
                mainReason += ` Other positives: ${reasons.slice(3, 5).join(', ')}.`;
            }
        } else {
            mainReason = 'Solid profile for this contest.';
        }
        if (negativeReasons.length) mainReason += ` Considerations: ${negativeReasons.join(', ')}.`;
        if (oddsFrac) mainReason += ` Current odds: ${oddsFrac}.`;
        return mainReason.charAt(0).toUpperCase() + mainReason.slice(1);
    }

    function fractionToDecimalOdds(fraction) {
        if (!fraction || typeof fraction !== 'string') return Infinity;
        const parts = fraction.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0]);
            const denominator = parseFloat(parts[1]);
            if (denominator !== 0 && Number.isFinite(numerator) && Number.isFinite(denominator)) {
                return (numerator / denominator) + 1;
            }
        }
        const decimalValue = parseFloat(fraction);
        if (Number.isFinite(decimalValue)) return decimalValue;
        return Infinity;
    }

    // Attach scores and odds to all runners
    races.forEach(race => {
        (race.runners || []).forEach(r => {
            r.score = scoreRunner(r);
            r.oddsDecimal = fractionToDecimalOdds(r.odds?.[0]?.fractional);
            r.race = race;
        });
    });

    // Collect tips by type (unfiltered, can overlap by race - we'll filter next)
    let topRaw = [], valueRaw = [], outsiderRaw = [];
    races.forEach(race => {
        if (!race.runners || !race.runners.length) return;
        const sorted = [...race.runners].sort((a, b) => (b.score || 0) - (a.score || 0));
        const [first, second, third] = sorted;
        if (!first || first.score <= 0) return;
        // Top Pick: clear best, not too short, big gap
        if (
            second &&
            first.oddsDecimal && first.oddsDecimal <= 7.0 &&
            ((first.score - second.score) / Math.max(second.score, 1)) > 0.15
        ) {
            topRaw.push({ ...first, tipType: "Top Pick" });
        }
        // Value: 2nd/3rd best, mid odds, nearly as good as best
        for (let r of [second, third]) {
            if (!r) continue;
            if (
                r.oddsDecimal && r.oddsDecimal >= 5 && r.oddsDecimal < 17 &&
                r.score / first.score >= 0.85 && r.score > 0
            ) {
                valueRaw.push({ ...r, tipType: "Value" });
            }
        }
        // Outsider: 2nd/3rd, big price, not hopeless
        for (let r of [second, third]) {
            if (!r) continue;
            if (
                r.oddsDecimal && r.oddsDecimal >= 17 &&
                r.score / first.score >= 0.70 && r.score > 0
            ) {
                outsiderRaw.push({ ...r, tipType: "Outsider" });
            }
        }
    });

    // Helper to get unique races per tip type (don't double up on same race in category)
    function filterUniqueRace(tipsArr) {
        const used = new Set();
        return tipsArr.filter(tip => {
            const key = tip.race._id || tip.race.race_id;
            if (used.has(key)) return false;
            used.add(key);
            return true;
        });
    }

    // Final: max 3 per type, no same race in same category
    const topPicks = filterUniqueRace(topRaw).slice(0, 3);
    const valuePicks = filterUniqueRace(valueRaw.filter(
        v => !topPicks.some(t => (t.race._id || t.race.race_id) === (v.race._id || v.race.race_id))
    )).slice(0, 3);
    const outsiders = filterUniqueRace(outsiderRaw.filter(
        o => !topPicks.some(t => (t.race._id || t.race.race_id) === (o.race._id || o.race.race_id)) &&
             !valuePicks.some(v => (v.race._id || v.race.race_id) === (o.race._id || o.race.race_id))
    )).slice(0, 3);

    // Render tip cards
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

    try {
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
    } catch (renderError) {
        console.error("tips.js: Error during final HTML rendering:", renderError);
        main.innerHTML = `<div class="container"><h1 class="page-title">Today’s Horse Racing Tips</h1><p class="tips-intro">Our advanced system analyzes key performance metrics for every horse and race to identify potential top picks, value bets, and promising outsiders for today's racing action. Remember to always gamble responsibly.</p><h2>An error occurred while displaying tips.</h2><p>Please check the browser console for details.</p></div>`;
    }

    

    console.log(`tips.js: Rendered ${topPicks.length} top, ${valuePicks.length} value, ${outsiders.length} outsider tips.`);
    console.log('tips.js: Script finished.');
})();
