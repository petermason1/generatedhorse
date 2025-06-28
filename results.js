function getPaidPlaces(race) {
  const isHandicap = /handicap/i.test(race.race_name || "");
  const runners = (race.runners || []).filter(r => r.position && Number(r.position) > 0).length;
  if (isHandicap && runners >= 16) return 4;
  if (runners >= 8) return 3;
  if (runners >= 5) return 2;
  return 1;
}

function renderResults(data, isFallback = false) {
  const resultsDiv = document.getElementById('results');
  let msg = '';
  if (isFallback) {
    msg = `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>`;
  }
  if (!data || !data.results || !data.results.length) {
    resultsDiv.innerHTML = msg + '<p>No results yet. Please check back later.</p>';
    return;
  }
  resultsDiv.innerHTML = msg + data.results.map(race => {
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
    const placeLabels = ["winner", "placed", "third", "placed", "placed"];
    const medal = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
    const places = top.map((runner, i) => {
      const cls = placeLabels[i] || "placed";
      return `<span class="${cls}">${medal(i)} <b>${rn(runner)}</b> <small>(SP: ${sp(runner)})</small></span>`;
    }).join('');

    return `
      <div class="race-result">
        <h2>${off} - ${course}</h2>
        <div class="race-meta">${name}</div>
        <div class="race-horses">${places}</div>
      </div>
    `;
  }).join('');
}

// --- Helper: get yesterday's date in YYYY-MM-DD ---
function getYesterdaysDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// Main: Try today, fallback to yesterday
fetch('/api/results')
  .then(res => res.json())
  .then(data => {
    if (data && data.results && data.results.length) {
      renderResults(data);
    } else {
      // Fallback: fetch yesterday's file
      const yest = getYesterdaysDateStr();
      fetch(`/${yest}-results.json`)
        .then(res2 => res2.json())
        .then(data2 => renderResults(data2, true))
        .catch(() => {
          document.getElementById('results').innerHTML = '<p>No results yet. Please check back later.</p>';
        });
    }
  })
  .catch(() => {
    // Fallback: fetch yesterday's file
    const yest = getYesterdaysDateStr();
    fetch(`/${yest}-results.json`)
      .then(res2 => res2.json())
      .then(data2 => renderResults(data2, true))
      .catch(() => {
        document.getElementById('results').innerHTML = '<p>No results yet. Please check back later.</p>';
      });
  });
