console.log('index.js loaded (top picks, no value label)');

// === HELPERS ===
function isNonRunner(r) {
  if (!r) return true;
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && typeof r.status === 'string' && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  if (r.number && r.number.toString().trim().toUpperCase() === 'NR') return true;
  return false;
}

// === DATA ===
const races = (window.racecardsData && window.racecardsData.racecards) || [];
if (!races.length) {
  if (document.getElementById('main-content-dynamic')) document.getElementById('main-content-dynamic').innerHTML = '<h2>No racecards loaded.</h2>';
  if (document.getElementById('next6-dynamic')) document.getElementById('next6-dynamic').innerHTML = '';
  throw new Error('No racecards!');
}

// === TOP DATA PICKS (by gap in score, no odds filter, no "value pick" label) ===
function renderTodaySmartPicks(allRaces) {
  // 1. For each race, get top 2 by score (ignoring NRs and non-numeric scores)
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
      raceId: race._id,
      raceName: race.race_name,
      course: race.course,
      offTime: race.off_time,
      topRunner: top1,
      gap
    };
  }).filter(Boolean);

  // 2. Sort by confidence gap (descending)
  picks.sort((a, b) => b.gap - a.gap);

  // 3. Top 3 picks overall
  const topPicks = picks.slice(0, 3);

  if (!topPicks.length) return `<p>No picks available matching the criteria.</p>`;

  // 4. Render
  return topPicks.map((pick, i) => {
    const r = pick.topRunner;
    const odds = r.odds && r.odds[0] && r.odds[0].fractional ? r.odds[0].fractional : '';
    return `
      <div class="pick-card${i === 0 ? ' pick-best' : ''}">
        <div class="pick-main">
          <a href="racecard.html?race_id=${pick.raceId}" class="pick-horse-link">
            <span class="pick-horse">${r.horse}</span>
          </a>
        </div>
        <div class="pick-race">${pick.offTime} ${pick.course}</div>
        ${odds ? `<div class="pick-odds">Odds: ${odds}</div>` : ''}
        <div class="pick-notes">Score: ${typeof r.score === 'number' ? r.score.toFixed(2) : '-'} (Gap: ${pick.gap.toFixed(2)})</div>
      </div>
    `;
  }).join('');
}

// --- INJECT PICKS ---
const picksContainer = document.querySelector('.picks-list');
if (picksContainer) {
  picksContainer.innerHTML = renderTodaySmartPicks(races);
} else {
  console.warn('No .picks-list element found!');
}

console.log('index.js finished (top picks, no value label).');
