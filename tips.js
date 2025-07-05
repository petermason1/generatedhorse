console.log('tips.js: Script started.');

(function() {
    const main = document.getElementById('main');
    if (!main) {
        console.error("tips.js: Main element with ID 'main' not found in the DOM.");
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
                <h1 class="page-title">Today’s Tipster Showdown</h1>
                <p class="tips-intro">
                  Data-driven highlights from today’s UK & Irish racing.<br>
                  <b>For information only — NOT betting advice.</b>
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
            <h1 class="page-title">Today’s Tipster Showdown</h1>
            <p class="tips-intro">
              Data-driven highlights from today’s UK & Irish racing.<br>
              <b>For information only — NOT betting advice.</b>
            </p>
            <h2>An error occurred while displaying picks.</h2>
            <p>Please check the browser console for details.</p>
          </div>`;
        return;
    }

    // ========== SCORING LOGICS ==========

    function jsStyleScore(r) {
      const rpr = parseInt(r.rpr) || 0;
      const ts = parseInt(r.ts) || 0;
      const orating = parseInt(r.ofr) || 0;
      const last_run = parseInt(r.last_run) || 99;
      let wins = 0, places = 0;
      if (typeof r.form === 'string') {
        wins = (r.form.match(/1/g) || []).length;
        places = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
      }
      const trainer = r.trainer_14_days || {};
      const trainerPercent = parseFloat(trainer.percent) || 0;
      const trainerWins = parseInt(trainer.wins) || 0;
      let score = 0;
      score += rpr;
      score += 0.5 * ts;
      score += 0.3 * orating;
      score += 3 * wins + 1 * places;
      if (last_run > 60) score -= (last_run - 60) * 0.4;
      score += Math.max(0, 60 - last_run) * 0.1;
      score += 0.7 * trainerPercent;
      score += 1.1 * trainerWins;
      if (score < -15) score = -15 + (score + 15) * 0.3;
      if (!Number.isFinite(score)) score = 0;
      return Math.round(score * 10) / 10;
    }

    function scoreLogicV2_FormWeighted(r) {
      const rpr = parseInt(r.rpr) || 0;
      const ts = parseInt(r.ts) || 0;
      const orating = parseInt(r.ofr) || 0;
      const last_run = parseInt(r.last_run) || 99;
      let wins = 0, placed = 0;
      if (typeof r.form === 'string') {
        wins = (r.form.match(/1/g) || []).length;
        placed = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
      }
      const trainer = r.trainer_14_days || {};
      const trainerPercent = parseFloat(trainer.percent) || 0;
      const trainerWins = parseInt(trainer.wins) || 0;
      let score = 0;
      score += 1.1 * wins + 0.6 * placed;
      score += 0.15 * rpr + 0.12 * ts + 0.10 * orating;
      score -= Math.max(0, last_run - 35) * 0.6;
      score += Math.max(0, 35 - last_run) * 0.09;
      score += 0.5 * trainerPercent;
      score += 0.8 * trainerWins;
      if (!Number.isFinite(score)) score = 0;
      return Math.round(score * 100) / 100;
    }

    function scoreLogicV4_Conservative(r) {
      const rpr = parseInt(r.rpr) || 0;
      const ts = parseInt(r.ts) || 0;
      const orating = parseInt(r.ofr) || 0;
      const last_run = parseInt(r.last_run) || 99;
      let wins = 0, placed = 0, runs = 0;
      if (typeof r.form === 'string') {
        wins = (r.form.match(/1/g) || []).length;
        placed = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
        runs = r.form.trim().length;
      }
      const trainer = r.trainer_14_days || {};
      const trainerPercent = parseFloat(trainer.percent) || 0;
      let score = 0;
      score += 0.35 * rpr + 0.25 * ts + 0.22 * orating;
      score += 1.3 * wins + 0.7 * placed;
      score -= Math.max(0, last_run - 30) * 1.5;
      if (runs < 3) score -= 3;
      if (wins === 0 && placed === 0) score -= 2;
      score += 0.7 * trainerPercent;
      if (rpr === 0 || orating === 0) score -= 1.7;
      if (!Number.isFinite(score)) score = 0;
      return Math.round(score * 100) / 100;
    }

    function scoreLogicV1_Combo(r) {
      const s2 = scoreLogicV2_FormWeighted(r);
      const s4 = scoreLogicV4_Conservative(r);
      return Math.round(((s2 + s4) / 2) * 1000) / 1000;
    }

    function scoreRunner(r) {
      // Hybrid scoring: Class 1 or 2 => JS logic, else Combo
      let raceClass = r.race_class || r.pattern || '';
      let classNum = null;
      if (typeof raceClass === "string" && raceClass.toLowerCase().startsWith("class ")) {
        classNum = parseInt(raceClass.split(" ")[1]);
      }
      if (classNum === 1 || classNum === 2) {
        return jsStyleScore(r);
      }
      return scoreLogicV1_Combo(r);
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

    // === TIPSTER PICKS: ENTER HORSE NAMES FOR EACH TIPSTER (CASE-INSENSITIVE) ===
    const michaelsTips = ["windlord", "term of endearment", "homeland", "sword"];
    const chrisTips    = ["Barranco", "Perfidia", "Hostelry", "Triple Force"];
    const peterTips    = ["Victory Queen", "Jupiter Ammon","Ridersinthesky", "Gorak"];
    const kenTips      = ["Mon Na Slieve", "Miss Popalong", "Ishe Worth Agamble", "Kassaya"];
    const racingPostTips = ["Take a breath", "sir lowry's pass", "Sansanetti", "Wheres The Crumpet"];

    // ==== APPEND MORE TIPSTERS HERE ====
    // const yourTipsterTips = ["horse1", "horse2"];
    // ...and so on, just like above!

    // ========== RUNNER DATA ATTACHMENT ==========
    races.forEach(race => {
        (race.runners || []).forEach(r => {
            r.race_class = race.race_class; // Attach for scoring
            r.score = scoreRunner(r);
            r.oddsDecimal = fractionToDecimalOdds(r.odds?.[0]?.fractional);
            r.race = race;
        });
    });

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

    // ========== TIPSTER LOGIC ==========

    // Helper to find a runner object by horse name
    function getRunnerByHorseName(horseName, races) {
        for (const race of races) {
            const runner = (race.runners || []).find(r =>
                (r.horse || '').toLowerCase() === horseName.toLowerCase()
            );
            if (runner) return { ...runner, race };
        }
        return null;
    }
    function isNonRunner(runner) {
        return (typeof runner.number === "string" && runner.number.trim().toUpperCase() === "NR");
    }
    // Sort by race off time (works with various date/time fields)
    function sortByOffTime(arr) {
        return arr.slice().sort((a, b) => {
            const getTime = r => {
                if (r.race.off_dt) return new Date(r.race.off_dt).getTime();
                if (r.race.race_datetime) return new Date(r.race.race_datetime).getTime();
                if (r.race.date && r.race.off_time) return new Date(`${r.race.date}T${r.race.off_time}`).getTime();
                if (r.race.off_time) {
                    const [h, m] = r.race.off_time.split(':');
                    return (parseInt(h,10) * 60 + parseInt(m,10)) * 60 * 1000;
                }
                return 0;
            };
            return getTime(a) - getTime(b);
        });
    }

    // Build tipster pick cards (skip if name not found in data, then sort)
    const michaelsFeatured = sortByOffTime(
        michaelsTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    );
    const chrisFeatured = sortByOffTime(
        chrisTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    );
    const peterFeatured = sortByOffTime(
        peterTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    );
    const kenFeatured = sortByOffTime(
        kenTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    );
    const racingPostFeatured = sortByOffTime(
        racingPostTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    );

    // ==== APPEND MORE TIPSTERS HERE ====
    // const yourFeatured = sortByOffTime(
    //   yourTipsterTips.map(name => getRunnerByHorseName(name, races)).filter(Boolean)
    // );
    // ...repeat for any other tipster!

    // === CAL'S PICKS: HIGHEST SCORING 4 RUNNERS OF THE DAY (NO DUPLICATE RACES), SKIP NRs ===
    const allRunners = races.flatMap(race => (race.runners || []).map(r => ({...r, race})));
    const sortedByScore = allRunners.filter(r => r.score > 0).sort((a, b) => b.score - a.score);
    const usedRaceIds = new Set();
    let calsPicks = [];
    for (const r of sortedByScore) {
        const raceId = r.race._id || r.race.race_id;
        if (isNonRunner(r)) continue;
        if (!usedRaceIds.has(raceId)) {
            calsPicks.push(r);
            usedRaceIds.add(raceId);
        }
        if (calsPicks.length === 4) break;
    }
    calsPicks = sortByOffTime(calsPicks);

    function renderTipCard(r, i, badge) {
      const silksImageUrl = r.silk_url ? r.silk_url : 'https://placehold.co/40x40/333/fff?text=No+Silk';
      let raceName = r.race.race_name || '';
      const raceTypeMatch = raceName.match(/\((.*?)\)/);
      let filteredRaceName = raceName;
      if (raceTypeMatch && raceTypeMatch[0]) {
          filteredRaceName = raceName.replace(raceTypeMatch[0], '').trim();
      }
      const commonRaceTypes = ['Handicap', 'Maiden', 'Stakes', 'Chase', 'Hurdle', 'Flat', 'National Hunt'];
      for (const type of commonRaceTypes) {
          filteredRaceName = filteredRaceName.replace(new RegExp(type, 'gi'), '').trim();
      }
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

    // === FINAL PAGE HTML ===
    let sections = '';

    if (michaelsFeatured.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Michael Pilling’s Tips of the Day</h2>
          ${michaelsFeatured.map((r, i) => renderTipCard(r, i, "Michael's Pick")).join('')}
        </section>
      `;
    }
    if (chrisFeatured.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Chris Waldock’s Tips of the Day</h2>
          ${chrisFeatured.map((r, i) => renderTipCard(r, i, "Chris's Pick")).join('')}
        </section>
      `;
    }
    if (peterFeatured.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Peter Mason’s Tips of the Day</h2>
          ${peterFeatured.map((r, i) => renderTipCard(r, i, "Peter's Pick")).join('')}
        </section>
      `;
    }
    if (kenFeatured.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Ken Durie’s Tips of the Day</h2>
          ${kenFeatured.map((r, i) => renderTipCard(r, i, "Ken's Pick")).join('')}
        </section>
      `;
    }
    if (racingPostFeatured.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Racing Post Tips</h2>
          ${racingPostFeatured.map((r, i) => renderTipCard(r, i, "Racing Post Pick")).join('')}
        </section>
      `;
    }
    // ==== APPEND MORE TIPSTER SECTIONS HERE ====
    // if (yourFeatured.length) {
    //   sections += `
    //     <section class="tips-section featured-section">
    //       <h2 class="section-title">YOUR TIPSTER'S NAME Tips</h2>
    //       ${yourFeatured.map((r, i) => renderTipCard(r, i, "Your Tipster's Pick")).join('')}
    //     </section>
    //   `;
    // }

    if (calsPicks.length) {
      sections += `
        <section class="tips-section featured-section">
          <h2 class="section-title">Calc’s Picks of the Day <span class="section-subtitle">(Top Data-Rated)</span></h2>
          ${calsPicks.map((r, i) => renderTipCard(r, i, "Cal's Pick")).join('')}
        </section>
      `;
    }

    main.innerHTML = `
      <div class="container">
        <h1 class="page-title">Today’s Tipster Showdown</h1>
        <p class="tips-intro">
          Michael, Chris, Peter, Ken, The Calc, and Racing Post go head-to-head.<br>
          <b>Who lands bragging rights today?</b>
        </p>
   <div style="text-align:center;">
  <a href="todays-leaderboard.html" class="cta-btn" style="margin: 18px auto 26px; display:inline-block; font-weight:700; background: linear-gradient(90deg,#37e8b5,#ffc900 95%); color:#232d33; border:none; border-radius:14px; padding:14px 42px; font-size:1.13em; box-shadow:0 4px 18px #0002; letter-spacing:0.01em; text-decoration:none; transition:background 0.2s,box-shadow 0.2s; cursor:pointer;">
    View Leaderboard &amp; Results
  </a>
</div>

        ${sections || `<div class="no-picks" style="color:#f66;font-weight:700;margin:2em 0;">No valid tips for today.</div>`}
        <div class="tips-disclaimer" style="text-align:center;color:var(--color-primary-yellow);font-size:0.98em;margin-top:2em;">
          <b>Disclaimer:</b> All picks are for information only and not betting advice. Please gamble responsibly.
        </div>
      </div>
    `;

    console.log('tips.js: Rendered sections:', {
      michaels: michaelsFeatured.length,
      chris: chrisFeatured.length,
      peter: peterFeatured.length,
      ken: kenFeatured.length,
      racingPost: racingPostFeatured.length,
      cal: calsPicks.length
    });
    console.log('tips.js: Script finished.');
})();
