// results.js

function getPaidPlaces(race) {
  const isHandicap = /handicap/i.test(race.race_name || "");
  const runners = (race.runners || []).filter(r => r.position && Number(r.position) > 0).length;
  if (isHandicap && runners >= 16) return 4;
  if (runners >= 8) return 3;
  if (runners >= 5) return 2;
  return 1;
}

function renderResults(data) {
  const resultsDiv = document.getElementById('results');
  if (!data || !data.results || !data.results.length) {
    resultsDiv.innerHTML = '<p>No results yet. Please check back later.</p>';
    return;
  }
  resultsDiv.innerHTML = data.results.map(race => {
    const off = race.off || race.off_time || race.time || '-';
    const course = race.course || race.venue || '-';
    const name = race.race_name || race.name || '';
    const paid = getPaidPlaces(race);

    // Get all paid places, sorted by position
    const top = (race.runners || [])
      .filter(r => r.position && Number(r.position) > 0)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .slice(0, paid);

    // Name & SP helpers
    const rn = r => r.horse || r.runner_name || r.name || '-';
    const sp = r => r.sp || r.starting_price || r.sp_dec || '-';

    // Render each placed runner, always show SP
    const placeLabels = ["winner", "placed", "third", "placed"];
    const places = top.map((runner, i) => {
      const label = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
      const cls = placeLabels[i] || "placed";
      return `<span class="${cls}">${label} <b>${rn(runner)}</b> <small style="color:#999;">(SP: ${sp(runner)})</small></span>`;
    }).join('<br>');

    return `
      <div class="race-result">
        <h2>${off} - ${course}</h2>
        <div class="race-meta">${name}</div>
        <div class="race-horses">${places}</div>
      </div>
    `;
  }).join('');
}

// Fetch and render results
fetch('/api/results')
  .then(res => res.json())
  .then(renderResults)
  .catch(() => {
    document.getElementById('results').innerHTML = '<p>Error loading results.</p>';
  });
