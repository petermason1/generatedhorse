// ========== ALL RACES: SIMPLE LIST ==========
// Expects: window.racecardsData.racecards

console.log('allraces.js loaded');
console.log(window.racecardsData);

// ---- Utility functions ----
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
function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}
function scoreRunner(r) {
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

// ---- RENDER ALL RUNNERS IN RACE ----
function renderRaceRunners(race) {
  const runners = race.runners.map(r => ({
    ...r,
    score: scoreRunner(r)
  }));
  // NRs last
  const sorted = [
    ...runners.filter(r => !isNonRunner(r)).sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999)),
    ...runners.filter(isNonRunner)
  ];
  return `
    <table style="width:100%;margin:0.7em 0 0.7em 0;border-collapse:collapse;">
      <thead>
        <tr style="background:#14202e;font-size:1em;">
          <th style="color:#ffe561;padding:4px 8px;">No.</th>
          <th style="color:#ffe561;padding:4px 8px;">Horse</th>
          <th style="color:#ffe561;padding:4px 8px;">Form</th>
          <th style="color:#ffe561;padding:4px 8px;">Score</th>
          <th style="color:#ffe561;padding:4px 8px;">Odds</th>
          <th style="color:#ffe561;padding:4px 8px;">Jockey</th>
          <th style="color:#ffe561;padding:4px 8px;">Trainer</th>
          <th style="color:#ffe561;padding:4px 8px;">NR?</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((r, i) => `
          <tr style="background:${isNonRunner(r) ? '#292b32' : '#181e24'};color:#fff;">
            <td style="padding:3px 8px;text-align:center;">${r.number || i+1}</td>
            <td style="padding:3px 8px;">${r.horse || ''}</td>
            <td style="padding:3px 8px;text-align:center;">${r.form || ''}</td>
            <td style="padding:3px 8px;text-align:center;font-weight:700;color:#b6ffea;">${typeof r.score === 'number' ? r.score : ''}</td>
            <td style="padding:3px 8px;text-align:center;color:#ffe4b2;">${r.odds?.[0]?.fractional || ''}</td>
            <td style="padding:3px 8px;">${r.jockey || ''}</td>
            <td style="padding:3px 8px;">${r.trainer || ''}</td>
            <td style="padding:3px 8px;text-align:center;">${isNonRunner(r) ? '<span style="color:#f88;">NR</span>' : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---- MAIN RENDER FUNCTION ----
function renderAllRacesList(races) {
  const container = document.getElementById('allRacesList');
  if (!container) return;
  const now = new Date();
  const sortedRaces = [...races].sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
  let foundNext = false;
  container.innerHTML = sortedRaces.map((race, idx) => {
    let isNext = false;
    if (!foundNext && new Date(race.off_dt) > now) { foundNext = true; isNext = true; }
    return `
      <div class="allrace-list-item"
           data-race-idx="${idx}"
           ${isNext ? 'id="nextRace"' : ''}
           style="background:#181e24;border-radius:11px;box-shadow:0 2px 10px #0002;padding:0.7em 1.1em;margin-bottom:1em;font-size:0.99em;">
        <div style="font-size:1.13em;font-weight:800;color:#36e8b5;">
          ${race.off_time} <span style="font-weight:600;color:#ffc900;">${race.course}</span>
        </div>
        <div style="font-size:0.99em;color:#ffe4b2;font-weight:700;margin-top:2px;">
          ${race.race_name}
        </div>
        <div style="color:#aac7f1;font-size:0.97em;margin-bottom:0.35em;">
          Field: <b>${race.field_size || '-'}</b> • Age/Sex: <b>${race.age_band||'-'}</b> • Class: <b>${race.race_class||'-'}</b> • Distance: <b>${race.distance||'-'}</b> • Going: <b>${race.going||'-'}</b>
        </div>
        ${renderRaceRunners(race)}
        <div>
          <a href="racecard.html?date=today&race_id=${race._id}"
             style="margin-top:8px;display:inline-block;background:#36e8b5;color:#10141a;font-weight:700;padding:5px 14px;border-radius:7px;text-decoration:none;box-shadow:0 2px 7px #0002;font-size:1em;">
             View Full Racecard
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Scroll to next race if exists
  setTimeout(() => {
    const nextRaceEl = document.getElementById('nextRace');
    if (nextRaceEl) {
      nextRaceEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 60);
}

// ---- MAIN ENTRY ----
document.addEventListener('DOMContentLoaded', function() {
  if (!window.racecardsData || !Array.isArray(window.racecardsData.racecards)) {
    document.getElementById('allRacesList').innerHTML = '<div style="color:#f44;">No racecards data found.</div>';
    return;
  }
  renderAllRacesList(window.racecardsData.racecards);
});
