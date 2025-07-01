console.log('tips.js: Script started.');

(function() {
    const main = document.getElementById('main');
    if (!main) {
        console.error("tips.js: Main element with ID 'main' not found in the DOM.");
        console.error("Error: Page structure incomplete. Missing 'main' element. Please check tips.html.");
        return;
    }

    let races = [];
    try {
        if (window.racecardsData && Array.isArray(window.racecardsData.racecards)) {
            races = window.racecardsData.racecards;
            console.log(`tips.js: Loaded ${races.length} races from data.js.`);
        } else {
            main.innerHTML = `
              <div class="container">
                <h1 class="page-title">Today’s Smart Picks</h1>
                <p class="tips-intro">
                  Our data-driven system automatically highlights standout runners based on ratings, form, and key stats.
                  <br><b>For information only — NOT betting advice.</b>
                </p>
                <h2>No racecards loaded or data format is incorrect.</h2>
                <p>Please ensure 'data.js' is correctly generated and contains valid racecard data.</p>
              </div>`;
            return;
        }
    } catch (error) {
        console.error("tips.js: Error loading racecards data:", error);
        main.innerHTML = `
          <div class="container">
            <h1 class="page-title">Today’s Smart Picks</h1>
            <p class="tips-intro">
              Our data-driven system automatically highlights standout runners based on ratings, form, and key stats.
              <br><b>For information only — NOT betting advice.</b>
            </p>
            <h2>An error occurred while displaying picks.</h2>
            <p>Please check the browser console for details.</p>
          </div>`;
        return;
    }

    // Scoring weights (tune as needed)
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

    // Collect picks by type (unfiltered, can overlap by race)
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

    // RENDERING

    function renderTipCard(r, i, badge) {
      // Use r.silk_url as confirmed by the user, with a placeholder for missing silks
      const silksImageUrl = r.silk_url ? r.silk_url : 'https://placehold.co/40x40/333/fff?text=No+Silk';

      // Extract race type from race_name and filter it out
      let raceName = r.race.race_name || '';
      const raceTypeMatch = raceName.match(/\((.*?)\)/); // Matches content in parentheses
      let filteredRaceName = raceName;
      if (raceTypeMatch && raceTypeMatch[0]) {
          filteredRaceName = raceName.replace(raceTypeMatch[0], '').trim();
      }
      // Further filter out common race type keywords if not in parentheses
      const commonRaceTypes = ['Handicap', 'Maiden', 'Stakes', 'Chase', 'Hurdle', 'Flat', 'National Hunt'];
      for (const type of commonRaceTypes) {
          filteredRaceName = filteredRaceName.replace(new RegExp(type, 'gi'), '').trim();
      }
      // Remove any trailing hyphens or empty parentheses left from filtering
      filteredRaceName = filteredRaceName.replace(/-\s*$/, '').trim();
      filteredRaceName = filteredRaceName.replace(/\(\s*\)/, '').trim();


      return `
        <div class="tip-card">
          <div class="silks-wrapper">
            <img src="${silksImageUrl}" alt="${r.horse} silks" class="silks-img" onerror="this.onerror=null;this.src='https://placehold.co/40x40/333/fff?text=No+Silk';">
          </div>
          <div class="tip-content">
            <div class="tip-top-row">
              <a href="racecard.html?race_id=${r.race._id}" class="tip-horse">${r.horse}</a>
              <span class="tip-odds">${r.odds?.[0]?.fractional || ''}</span>
              <span class="tip-score">(Score: ${r.score})</span>
            </div>
            <div class="tip-middle-row">
              <span class="tip-race-time-course">${r.race.off_time} ${r.race.course}</span>
              ${filteredRaceName ? `<span class="tip-race-filtered-name">${filteredRaceName}</span>` : ''}
            </div>
            <div class="tip-bottom-row">
              <div class="tip-reason">${explainPick(r)}</div>
              ${badge ? `<span class="tip-badge ${badge.toLowerCase().replace(' ', '-')}-badge">${badge}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    try {
        main.innerHTML = `
          <div class="container">
            <h1 class="page-title">Today’s Smart Picks</h1>
            <p class="tips-intro">
              <b>Automated shortlists for today’s UK & Irish racing.</b><br>
              Selections below are generated by our system using performance ratings, form, and key stats.
              <br><span style="color:var(--color-primary-yellow)"><b>These are NOT tips or betting advice – just data-driven suggestions.</b></span>
            </p>

            <section class="tips-section">
              <h2 class="section-title top-picks-title">Smart Picks <span class="section-subtitle">(Best Rated)</span></h2>
              ${topPicks.length ? topPicks.map((r, i) => renderTipCard(r, i, 'Smart Pick')).join('') : '<div class="no-picks">No standouts today.</div>'}
            </section>

            <section class="tips-section">
              <h2 class="section-title value-picks-title">Value Runners <span class="section-subtitle">(Strong Scores, Mid-Range Odds)</span></h2>
              ${valuePicks.length ? valuePicks.map((r, i) => renderTipCard(r, i, 'Value')).join('') : '<div class="no-picks">No value runners today.</div>'}
            </section>

            <section class="tips-section">
              <h2 class="section-title outsider-picks-title">Outsiders <span class="section-subtitle">(Potential at Longer Odds)</span></h2>
              ${outsiders.length ? outsiders.map((r, i) => renderTipCard(r, i, 'Outsider')).join('') : '<div class="no-picks">No outsiders today.</div>'}
            </section>

            <div class="tips-disclaimer" style="text-align:center;color:var(--color-primary-yellow);font-size:0.98em;margin-top:2em;">
              <b>Disclaimer:</b> These “Smart Picks” are automated and not intended as betting advice.<br>
              No profits are guaranteed. For information only. Please gamble responsibly. 18+
            </div>
          </div>
        `;
    } catch (renderError) {
        console.error("tips.js: Error during final HTML rendering:", renderError);
        main.innerHTML = `
          <div class="container">
            <h1 class="page-title">Today’s Smart Picks</h1>
            <p class="tips-intro">
              Our data-driven system automatically highlights standout runners based on ratings, form, and key stats.
              <br><b>For information only — NOT betting advice.</b>
            </p>
            <h2>An error occurred while displaying picks.</h2>
            <p>Please check the browser console for details.</p>
          </div>`;
    }

    console.log(`tips.js: Rendered ${topPicks.length} top, ${valuePicks.length} value, ${outsiders.length} outsider picks.`);
    console.log('tips.js: Script finished.');
})();
