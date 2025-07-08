console.log('index.js loaded');

// ===== SCORING LOGIC (copied from racecard.js) =====

function safeInt(x, def = 0) {
  if (x == null || x === '' || x === '-' || String(x).toLowerCase() === 'nan') return def;
  let v = parseInt(x);
  return Number.isFinite(v) ? v : def;
}

function safeFloat(x, def = 0.0) {
  if (x == null || x === '' || x === '-' || String(x).toLowerCase() === 'nan') return def;
  let v = parseFloat(x);
  return Number.isFinite(v) ? v : def;
}

function scoreLogicV2_FormWeighted(r) {
  const rpr = safeInt(r.rpr);
  const ts = safeInt(r.ts);
  const orating = safeInt(r.ofr);
  const last_run = safeInt(r.last_run, 99);
  let wins = 0, placed = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    placed = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
  }
  const trainer = r.trainer_14_days || {};
  const trainerPercent = safeFloat(trainer.percent);
  const trainerWins = safeInt(trainer.wins);
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
  const rpr = safeInt(r.rpr);
  const ts = safeInt(r.ts);
  const orating = safeInt(r.ofr);
  const last_run = safeInt(r.last_run, 99);
  let wins = 0, placed = 0, runs = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    placed = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
    runs = r.form.trim().length;
  }
  const trainer = r.trainer_14_days || {};
  const trainerPercent = safeFloat(trainer.percent);
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

function scoreLogicV3_TrainerHot(r) {
  const rpr = safeInt(r.rpr);
  const ts = safeInt(r.ts);
  const orating = safeInt(r.ofr);
  const last_run = safeInt(r.last_run, 99);
  let wins = 0, placed = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    placed = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
  }
  const trainer = r.trainer_14_days || {};
  const trainerPercent = safeFloat(trainer.percent);
  const trainerWins = safeInt(trainer.wins);
  const jockey = r.jockey_14_days || {};
  const jockeyPercent = safeFloat(jockey.percent);
  const jockeyWins = safeInt(jockey.wins);
  let score = 0;
  score += 0.7 * rpr + 0.6 * ts + 0.4 * orating;
  score += 2.5 * wins + 0.7 * placed;
  score += 1.2 * trainerPercent + 1.2 * trainerWins;
  score += 1.1 * jockeyPercent + 1.1 * jockeyWins;
  score -= Math.max(0, last_run - 50) * 0.3;
  score += Math.max(0, 50 - last_run) * 0.08;
  if (!Number.isFinite(score)) score = 0;
  return Math.round(score * 100) / 100;
}

function scoreRunner(r) {
  let raceClass = r.race_class || r.pattern || "";
  let classNum = null;
  if (typeof raceClass === "string" && raceClass.toLowerCase().startsWith("class ")) {
    classNum = parseInt(raceClass.split(" ")[1]);
  }
  // JS-style for Class 1 and 2
  if (classNum === 1 || classNum === 2) {
    const rpr = safeInt(r.rpr);
    const ts = safeInt(r.ts);
    const orating = safeInt(r.ofr);
    const last_run = safeInt(r.last_run, 99);
    let wins = 0, places = 0;
    if (typeof r.form === 'string') {
      wins = (r.form.match(/1/g) || []).length;
      places = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
    }
    const trainer = r.trainer_14_days || {};
    const trainerPercent = safeFloat(trainer.percent);
    const trainerWins = safeInt(trainer.wins);
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
  // Everything else
  return scoreLogicV1_Combo(r);
}

function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

// ===== END SCORING LOGIC =====

// === MAIN CODE ===

const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  document.getElementById('main-content-dynamic').innerHTML = '<h2>No racecards loaded.</h2>';
  document.getElementById('next6-dynamic').innerHTML = '';
  throw new Error('No racecards!');
}

// Render Next 6 races bar
function renderNext6Bar(allRaces) {
  const now = new Date();
  const next6 = allRaces
    .filter(r => new Date(r.off_dt) > now)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
    .slice(0, 6);

  if (!next6.length) {
    return `<span class="next6-empty" style="color:#b7b7b7;opacity:0.8;">No races left today</span>`;
  }
  return next6.map(r => `
    <a href="racecard.html?race_id=${r._id}" class="next6-race-link" title="${r.course} ${r.off_time}">
      <span class="next6-time">${r.off_time}</span>
      <span class="next6-course">${r.course}</span>
    </a>
  `).join('');
}

document.getElementById('next6-dynamic').innerHTML = renderNext6Bar(races);

// Render races grouped by course
function renderByCourse(allRaces) {
  const byCourse = {};
  allRaces.forEach(rc => {
    let course = rc.course;
    if (course.startsWith("Lingfield")) course = "Lingfield";
    if (!byCourse[course]) byCourse[course] = [];
    byCourse[course].push(rc);
  });

  const courseRows = Object.entries(byCourse)
    .map(([course, courseRaces]) => {
      const minOffDt = Math.min(...courseRaces.map(r => new Date(r.off_dt)));
      return { course, courseRaces, minOffDt };
    })
    .sort((a, b) => a.minOffDt - b.minOffDt);

  return courseRows.map(({ course, courseRaces }) => `
    <div class="racecard-course-row">
      <div class="racecard-course-header">${course}</div>
      <div class="racecard-race-row">
        ${courseRaces
          .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
          .map(rc => `
            <a class="racecard-time-link" href="racecard.html?race_id=${rc._id}">
              <span class="racecard-time">${rc.off_time}</span>
            </a>
          `).join('')}
      </div>
    </div>
  `).join('');
}

document.getElementById('main-content-dynamic').innerHTML = renderByCourse(races);

// ==== RENDER TODAY'S SMART PICKS ====
function renderTodaySmartPicks(allRaces) {
  const isNonRunner = r => r.number && r.number.toString().trim().toUpperCase() === 'NR';

  // For each race, score runners and find the top 2 to calculate gap
  const raceTopDiffs = allRaces.map(race => {
    const runners = (race.runners || [])
      .filter(r => !isNonRunner(r))
      .map(runner => ({
        ...runner,
        score: scoreRunner(runner)
      }))
      .sort((a, b) => b.score - a.score);

    if (runners.length === 0) return null;

    const top1 = runners[0];
    const top2 = runners[1] || { score: 0 }; // fallback if only one runner

    const gap = top1.score - top2.score;

    return {
      raceId: race._id,
      raceName: race.race_name,
      course: race.course,
      offTime: race.off_time,
      topRunner: top1,
      gap
    };
  }).filter(Boolean) // remove nulls

  // Sort races by score gap (descending) — more confident picks first
  raceTopDiffs.sort((a, b) => b.gap - a.gap);

  // Now pick top 3 races with largest gap
  const topPicks = raceTopDiffs.slice(0, 3);

  if (topPicks.length === 0) {
    return `<p>No picks available for today.</p>`;
  }

  // Render picks
  return topPicks.map((pick, i) => {
    const r = pick.topRunner;
    const odds = (r.odds && r.odds.length > 0 && r.odds[0].fractional) ? r.odds[0].fractional : 'N/A';
    return `
      <div class="pick-card ${i === 0 ? 'pick-best' : ''}">
        ${i === 0 ? '<div class="pick-label">Value Pick</div>' : ''}
        <div class="pick-main">
          <span class="pick-horse">${r.horse}</span>
          <span class="pick-race">${pick.offTime} ${pick.course}</span>
          <span class="pick-odds">Odds: ${odds}</span>
        </div>
        <div class="pick-notes">Score: ${r.score.toFixed(2)} (Gap: ${pick.gap.toFixed(2)})</div>
      </div>
    `;
  }).join('');
}



const picksContainer = document.querySelector('.picks-list');
if (picksContainer) {
  picksContainer.innerHTML = renderTodaySmartPicks(races);
}

console.log('index.js finished.');
