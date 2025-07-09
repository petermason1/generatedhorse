console.log('index.js loaded (top picks, next 6 bar, race times)');

// === HELPERS ===
function isNonRunner(r) {
  if (!r) return true;
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && typeof r.status === 'string' && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  if (r.number && r.number.toString().trim().toUpperCase() === 'NR') return true;
  return false;
}

// Get a Date object for a race using off_dt or (date + off_time)
function getRaceDateObj(race) {
  if (race.off_dt) return new Date(race.off_dt);
  if (race.date && race.off_time) {
    // Pad single-digit hour ("9:00" → "09:00")
    let t = race.off_time;
    if (t.length === 4) t = '0' + t;
    // Compose ISO string
    return new Date(`${race.date}T${t}:00`);
  }
  return null;
}

// === DATA ===
const races = (window.racecardsData && window.racecardsData.racecards) || [];
if (!races.length) {
  if (document.getElementById('main-content-dynamic')) document.getElementById('main-content-dynamic').innerHTML = '<h2>No racecards loaded.</h2>';
  if (document.getElementById('next6-dynamic')) document.getElementById('next6-dynamic').innerHTML = '';
  throw new Error('No racecards!');
}

// === TOP DATA PICKS (using betfair_odds_fractional if available) ===
function renderTodaySmartPicks(allRaces) {
  const picks = allRaces.map(race => {
    const valid = (race.runners || [])
      .filter(r => !isNonRunner(r))
      .filter(r => typeof r.score === 'number' && isFinite(r.score))
      .sort((a, b) => b.score - a.score);
    if (!valid.length) return null;
    const top1 = valid[0];
    const top2 = valid[1] || { score: 0 };
    const gap = top1.score - top2.score;
    return {
      raceId: race.race_id || race._id,
      raceName: race.race_name,
      course: race.course,
      offTime: race.off_time,
      topRunner: top1,
      gap
    };
  }).filter(Boolean);

  picks.sort((a, b) => b.gap - a.gap);

  const topPicks = picks.slice(0, 3);

  if (!topPicks.length) return `<p>No picks available matching the criteria.</p>`;

  return topPicks.map((pick, i) => {
    const r = pick.topRunner;
    // Prefer betfair_odds_fractional, fallback to old method
    const odds =
      r.betfair_odds_fractional ||
      (r.odds && r.odds[0] && r.odds[0].fractional) ||
      '';
    return `
      <div class="pick-card${i === 0 ? ' pick-best' : ''}">
        <div class="pick-main">
          <a href="racecard.html?race_id=${pick.raceId}" class="pick-horse-link">
            <span class="pick-horse">${r.horse}</span>
          </a>
        </div>
        <div class="pick-race">
          ${pick.offTime ? pick.offTime : ''} ${pick.course || ''}
        </div>
        ${odds ? `<div class="pick-odds">Odds: ${odds}</div>` : ''}
        <div class="pick-notes">
          Score: ${typeof r.score === 'number' ? r.score.toFixed(2) : '-'}
          (Gap: ${pick.gap.toFixed(2)})
        </div>
      </div>
    `;
  }).join('');
}

// === NEXT 6 BAR ===
function renderNext6Bar(races) {
  const now = new Date();
  const upcoming = races
    .filter(r => {
      const t = getRaceDateObj(r);
      return t && t > now && r.course;
    })
    .sort((a, b) => getRaceDateObj(a) - getRaceDateObj(b))
    .slice(0, 6);

  if (!upcoming.length) return '<div>No upcoming races.</div>';

  return `
    <div class="next6-list">
      ${upcoming.map(race => `
        <a href="racecard.html?race_id=${race.race_id || race._id}" class="next6-race">
          <span class="next6-time">${race.off_time || ''}</span>
          <span class="next6-course">${race.course || ''}</span>
        </a>
      `).join('')}
    </div>
  `;
}

// === ALL RACE TIMES & COURSES (optional, if you want a full list somewhere) ===
function renderAllRaceTimes(races) {
  const sorted = [...races].sort((a, b) => getRaceDateObj(a) - getRaceDateObj(b));
  return `
    <ul class="all-race-times">
      ${sorted.map(race => `
        <li>
          <a href="racecard.html?race_id=${race.race_id || race._id}">
            <span class="race-time">${race.off_time || ''}</span>
            <span class="race-course">${race.course || ''}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

// --- INJECT TOP PICKS ---
const picksContainer = document.querySelector('.picks-list');
if (picksContainer) {
  picksContainer.innerHTML = renderTodaySmartPicks(races);
} else {
  console.warn('No .picks-list element found!');
}

// --- INJECT NEXT 6 BAR ---
const next6Container = document.getElementById('next6-dynamic');
if (next6Container) {
  next6Container.innerHTML = renderNext6Bar(races);
}

// --- INJECT ALL RACE TIMES (optional, needs <div id="all-races-list"></div> in your HTML) ---
const allRacesContainer = document.getElementById('all-races-list');
if (allRacesContainer) {
  allRacesContainer.innerHTML = renderAllRaceTimes(races);
}

console.log('index.js finished (top picks, next 6 bar, race times).');
