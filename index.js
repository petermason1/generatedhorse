console.log('index.js loaded');
const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  main.innerHTML = '<h2>No racecards loaded.</h2>';
  throw new Error('No racecards!');
}

// ---- Score function (reuse from racecard.js or edit) ----
function scoreRunner(r) {
  let score = 0;
  if (r.rpr) score += parseInt(r.rpr);
  if (r.ts) score += 0.5 * parseInt(r.ts);
  if (r.form) {
    let wins = (r.form.match(/1/g) || []).length;
    let places = (r.form.match(/[23]/g) || []).length;
    score += 3 * wins + 1 * places;
  }
  if (r.last_run && !isNaN(r.last_run)) {
    score += Math.max(0, 50 - r.last_run) * 0.1;
  }
  if (r.odds?.[0]?.decimal) {
    score += 10 / parseFloat(r.odds[0].decimal);
  }
  return Math.round(score * 10) / 10;
}

// ---- Sort races by off_dt ----
races.sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));

// ---- Attach score to runners ----
races.forEach(race => {
  (race.runners || []).forEach(r => r.score = scoreRunner(r));
});

// ---- Next 6 races (not gone off) ----
const now = new Date();
const next6 = races.filter(r => new Date(r.off_dt) >= now).slice(0, 6);

// ---- Group races by course ----
const courses = {};
for (const rc of races) {
  if (!courses[rc.course]) courses[rc.course] = [];
  courses[rc.course].push(rc);
}

// ---- Top 4 picks of the day (one per race, by highest score) ----
const bestOfEachRace = races.map(race => {
  if (!race.runners || !race.runners.length) return null;
  const best = [...race.runners].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  return best ? { ...best, race } : null;
}).filter(Boolean);

const top4 = bestOfEachRace.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 4);

// ---- Render the full page ----
main.innerHTML = `
  <h1 style="text-align:center;margin:1.3em 0 0.9em 0;font-size:2em;">Best Bets of the Day</h1>
  <div class="best-bets-list" style="max-width:600px;margin:0 auto 1.2em auto;">
    ${top4.length === 0
      ? '<div style="opacity:.6">No picks found</div>'
      : top4.map((r, i) => `
        <div class="best-bet-card" style="background:#282d34;border-radius:9px;padding:1em 1.1em;margin-bottom:0.75em;display:flex;align-items:center;gap:13px;box-shadow:0 2px 7px #1119;">
          <span style="font-weight:bold;font-size:1.2em;width:2em;display:inline-block;">${i+1}.</span>
          <div style="flex:1">
            <a href="racecard.html?race_id=${r.race._id}" style="color:#35e9ae;font-size:1.11em;font-weight:700;text-decoration:none;">
              ${r.horse}
            </a>
            <span style="color:#ffe564;font-weight:bold;font-size:1em;margin-left:8px;">
              ${r.odds?.[0]?.fractional || ''}
            </span>
            <span style="color:#fff;font-weight:600;font-size:.98em;margin-left:4px;">(${r.score})</span>
            <div style="font-size:.98em;opacity:.81;">
              ${r.race.course} ${r.race.off_time} — <span style="color:#ffc900">${r.race.race_name}</span>
            </div>
          </div>
        </div>
      `).join('')}
  </div>

  <section class="next6-bar">
    <h2>Next 6 Races</h2>
    <div class="next6-races">
      ${next6.map(r => `
        <a class="next6-race-link" href="racecard.html?race_id=${r._id}">
          <div class="next6-time">${r.off_time}</div>
          <div class="next6-course">${r.course}</div>
        </a>
      `).join('')}
      ${next6.length === 0 ? '<span style="opacity:.6">No more races today</span>' : ''}
    </div>
  </section>

  <section class="courses-list">
    ${Object.entries(courses).map(([course, courseRaces]) => `
      <div class="course-block">
        <h3>${course}</h3>
        <div class="course-races">
          ${courseRaces.map(rc => `
            <a class="race-link" href="racecard.html?race_id=${rc._id}">
              ${rc.off_time} &mdash; <b>${rc.race_name}</b>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </section>
`;

console.log('index.js finished.');
