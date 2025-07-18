console.log('tips.js: Script started.');

(function() {
  const main = document.getElementById('main');
  if (!main) {
    console.error("tips.js: Main element with ID 'main' not found in the DOM.");
    return;
  }

  // --- Load races from data.js ---
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

  // --- Helper: find   a runner by horse name, ignore case ---
  function getRunnerByHorseName(horseName, races) {
    for (const race of races) {
      const runner = (race.runners || []).find(r =>
        (r.horse || '').toLowerCase() === horseName.toLowerCase()
      );
      if (runner) return { ...runner, race };
    }
    return null;
  }

  // --- Helper: non-runner check ---
  function isNonRunner(runner) {
    if (!runner) return false;
    if (typeof runner.number === "string" && runner.number.trim().toUpperCase() === "NR") return true;
    if (typeof runner.form === 'string' && runner.form.match(/\bNR\b/i)) return true;
    if (runner.status && typeof runner.status === 'string' && runner.status.toUpperCase() === 'NR') return true;
    if (runner.non_runner === true) return true;
    return false;
  }

  // --- Helper: sort by off_time (HH:MM), fallback 0 ---
  function sortByOffTime(arr) {
    return arr.slice().sort((a, b) => {
      const t = str => {
        if (!str) return 0;
        const [h, m] = str.split(':');
        return (parseInt(h,10) * 60 + parseInt(m,10)) * 60 * 1000;
      };
      return t(a.race.off_time) - t(b.race.off_time);
    });
    

  }

  // === Tipster picks ===
  const michaelsTips = ["coole cherry", "meehall", "royal musketeer", "insuspense"];
  const chrisTips    = ["canaria queen", "melek alreeh", "arabian force", "byblos"];
  const peterTips = ["Sorontar", "Electric Bass", "Prince Ali", "Nachtgeist"];
  const kenTips      = ["spirit lead me", "nahraan", "mudamer", "young fire"];
  const racingPostTips = ["Felicity Smoak", "Miss Hathaway", "Golden Handshake", "Catch Cunningham"];



  // --- Build tipster pick cards, skip non-existent picks ---
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

  // === CALC'S PICKS: Top 4 scores of the day, one per race, skip NRs ===
  const allRunners = races.flatMap(race => (race.runners || []).map(r => ({...r, race})));
  const sortedByScore = allRunners
    .filter(r => typeof r.score === 'number' && r.score > 0)
    .sort((a, b) => b.score - a.score);
  const usedRaceIds = new Set();
  let calsPicks = [];
  let calsHadNR = false;

  for (const r of sortedByScore) {
    const raceId = r.race._id || r.race.race_id;
    if (usedRaceIds.has(raceId)) continue;
    if (isNonRunner(r)) {
      calsHadNR = true;
      continue;
    }
    calsPicks.push(r);
    usedRaceIds.add(raceId);
    if (calsPicks.length === 4) break;
  }
  calsPicks = sortByOffTime(calsPicks);

  // --- Explain a pick ---
  function explainPick(r) {
    let bits = [];
    if (r.trainer_14_days && r.trainer_14_days.percent > 20) bits.push(`trainer in hot form (${r.trainer_14_days.percent}% 2wks)`);
    if (r.rpr > 110) bits.push(`high RPR (${r.rpr})`);
    if (r.ts > 95) bits.push(`strong Topspeed (${r.ts})`);
    if (r.form && r.form.match(/1/)) bits.push("recent win");
    if (r.form && r.form.match(/2|3/)) bits.push("placed recently");
    if (bits.length === 0) bits.push('solid profile');
    if (r.odds_fractional) {
      bits.push(`odds: ${r.odds_fractional}`);
    }
    return bits.join(', ') + '.';
  }

  // --- Render tip card ---
  function renderTipCard(r, i, badge) {
    const silksImageUrl = r.silk_url ? r.silk_url : 'https://placehold.co/40x40/333/fff?text=No+Silk';
    let raceName = r.race.race_name || '';
    let oddsStr = r.odds_fractional || '';
    return `
      <div class="tip-card">
        <div class="silks-wrapper">
          <img src="${silksImageUrl}" alt="${r.horse} silks" class="silks-img" onerror="this.onerror=null;this.src='https://placehold.co/40x40/333/fff?text=No+Silk';">
        </div>
        <div class="tip-content">
          <div class="tip-top-row">
            <a href="racecard.html?race_id=${r.race._id || r.race.race_id}" class="tip-horse">${r.horse}</a>
            <span class="tip-odds">${oddsStr}</span>
            <span class="tip-score">(Score: ${typeof r.score === "number" ? r.score : "?"})</span>
          </div>
          <div class="tip-middle-row">
            <span class="tip-race-time-course">${r.race.off_time} ${r.race.course}</span>
            <span class="tip-race-name">${raceName}</span>
          </div>
          <div class="tip-bottom-row">
            <div class="tip-reason">${explainPick(r)}</div>
            ${badge ? `<span class="tip-badge">${badge}</span>` : ''}
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
  if (calsPicks.length) {
    let calBadgeExtra = calsHadNR ? '<div style="color:#f44336; font-weight:bold; margin-bottom:8px;">⚠️ Some top picks were non-runners and replaced</div>' : '';
    sections += `
      <section class="tips-section featured-section">
        <h2 class="section-title">Calc’s Picks of the Day <span class="section-subtitle">(Top Data-Rated)</span></h2>
        ${calBadgeExtra}
        ${calsPicks.map((r, i) => renderTipCard(r, i, "Calc's Pick")).join('')}
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
    cal: calsPicks.length,
    calHadNR: calsHadNR
  });
  console.log('tips.js: Script finished.');
})();
