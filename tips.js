console.log('tips.js loaded');

const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];
if (!races.length) {
  main.innerHTML = '<h2>No racecards loaded.</h2>';
  throw new Error('No racecards!');
}

// --- Score function (copy your latest, tweak if needed) ---
function scoreRunner(r) {
  let score = 0;
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run) || 99;
  let oddsDec = 0;
  if (r.odds?.[0]?.decimal) {
    oddsDec = parseFloat(r.odds[0].decimal);
    if (isNaN(oddsDec)) oddsDec = 0;
  }
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/[23]/g) || []).length;
  }
  let trainerPercent = r.trainer_14_days?.percent ? parseFloat(r.trainer_14_days.percent) : 0;
  let trainerWins = r.trainer_14_days?.wins ? parseInt(r.trainer_14_days.wins) : 0;

  score += rpr;
  score += 0.5 * ts;
  score += 0.3 * or;
  score += 3 * wins + 1 * places;
  if (lastRun > 60) score -= (lastRun - 60) * 0.5;
  score += Math.max(0, 60 - lastRun) * 0.08;
  score += 0.9 * trainerPercent;
  score += 1.2 * trainerWins;

  if (oddsDec >= 8) score -= (oddsDec - 7) * 3;
  if (oddsDec >= 15) score -= (oddsDec - 14) * 6;
  if (oddsDec >= 26) score -= (oddsDec - 25) * 10;
  if (oddsDec > 0 && oddsDec <= 7) score += 8 / oddsDec;

  if (score === 0 && oddsDec > 0) {
    score = 12 / oddsDec;
  }
  score = Math.max(score, 0);
  return Math.round(score * 10) / 10;
}

// --- Reason blurb
function explainPick(r) {
  let reasons = [];
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run) || 99;
  let oddsDec = r.odds?.[0]?.decimal ? parseFloat(r.odds[0].decimal) : 0;
  let oddsFrac = r.odds?.[0]?.fractional || '';
  let form = typeof r.form === 'string' ? r.form : '';
  let trainerP = r.trainer_14_days?.percent ? parseFloat(r.trainer_14_days.percent) : 0;
  let trainerW = r.trainer_14_days?.wins ? parseInt(r.trainer_14_days.wins) : 0;
  let wins = (form.match(/1/g) || []).length;
  let placed = (form.match(/[23]/g) || []).length;

  if (wins >= 2) reasons.push(`Multiple recent wins (${wins})`);
  else if (wins === 1) reasons.push(`Recent win`);
  if (placed > 0) reasons.push(`Consistent placer (${placed}x 2nd/3rd)`);
  if (rpr > 120) reasons.push(`High Racing Post Rating (${rpr})`);
  if (ts > 90) reasons.push(`Strong Topspeed (${ts})`);
  if (or > 110) reasons.push(`Top Official Rating (${or})`);
  if (lastRun <= 21) reasons.push(`Raced recently (${lastRun} days ago)`);
  if (trainerP > 20) reasons.push(`Trainer in hot form (${trainerP}% last 2wks)`);
  if (trainerW > 2) reasons.push(`Trainer has multiple winners last 2wks`);
  if (oddsDec >= 8 && r.score > 0) reasons.push(`Big price (${oddsFrac}) but ranks well on ratings`);
  if (!reasons.length && oddsDec) reasons.push(`Short price favourite (${oddsFrac})`);

  return reasons.length ? reasons.slice(0,2).join('. ') + '.' : 'Solid profile for this contest.';
}

// --- Attach scores
races.forEach(race => (race.runners || []).forEach(r => r.score = scoreRunner(r)));

// --- Gather runner IDs to avoid dupes ---
function runnerKey(r) { return (r.race?._id || r.race_id || '') + '|' + (r.horse_id || r.horse || ''); }

// --- 1. Top 4 picks ---
const bestOfEachRace = races.map(race => {
  if (!race.runners || !race.runners.length) return null;
  const best = [...race.runners].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  return best ? { ...best, race } : null;
}).filter(Boolean);
const top4 = bestOfEachRace.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 4);
const topKeys = new Set(top4.map(runnerKey));

// --- 2. Value picks (not in top4) ---
const allRunners = races.flatMap(r => (r.runners || []).map(rn => ({ ...rn, race: r })));
const valuePicks = allRunners
  .filter(r => r.odds?.[0]?.decimal && parseFloat(r.odds[0].decimal) >= 5 && !topKeys.has(runnerKey(r)))
  .sort((a, b) => ((b.score / (parseFloat(b.odds?.[0]?.decimal) || 99)) - (a.score / (parseFloat(a.odds?.[0]?.decimal) || 99))))
  .slice(0, 4);
const valueKeys = new Set(valuePicks.map(runnerKey));

// --- 3. Outsiders (not in top4 or value) ---
const outsiders = allRunners
  .filter(r => r.score > 0 && r.odds?.[0]?.decimal && parseFloat(r.odds[0].decimal) >= 12 && !topKeys.has(runnerKey(r)) && !valueKeys.has(runnerKey(r)))
  .sort((a, b) => (b.score - a.score))
  .slice(0, 4);

// --- Render helper
function renderTipCard(r, i, badge) {
  return `
    <div class="best-bet-card" style="background:#282d34;border-radius:9px;padding:1.1em 1.1em 1em 1.1em;margin-bottom:0.78em;display:flex;align-items:flex-start;gap:13px;box-shadow:0 2px 7px #1119;">
      <span style="font-weight:bold;font-size:1.22em;width:2em;display:inline-block;color:#ffc900;">${i+1}</span>
      <div style="flex:1">
        <div>
          <a href="racecard.html?race_id=${r.race._id}" style="color:#35e9ae;font-size:1.13em;font-weight:700;text-decoration:none;">
            ${r.horse}
          </a>
          <span style="color:#ffe564;font-weight:bold;font-size:1em;margin-left:8px;">
            ${r.odds?.[0]?.fractional || ''}
          </span>
          <span style="color:#fff;font-weight:600;font-size:.98em;margin-left:4px;">(${r.score})</span>
        </div>
        <div style="font-size:.98em;opacity:.81;">
          ${r.race.course} ${r.race.off_time} — <span style="color:#ffc900">${r.race.race_name}</span>
        </div>
        <div style="margin-top:5px;color:#a8e7ff;font-size:.97em;">${explainPick(r)}</div>
        ${badge ? `<span class="tip-badge">${badge}</span>` : ''}
      </div>
    </div>
  `;
}

// --- Render the page
main.innerHTML = `
  <h1 style="text-align:center;margin:1.5em 0 0.3em 0;font-size:2em;">Today’s Horse Racing Tips</h1>
  <section style="margin:0 auto 2.5em auto;max-width:700px;">
    <h2 style="color:#ffc900;margin-bottom:0.65em;">Top Picks</h2>
    ${top4.map((r, i) => renderTipCard(r, i, 'Top Pick')).join('')}
    <h2 style="color:#2ce8c0;margin-bottom:0.65em;">Value Picks</h2>
    ${valuePicks.map((r, i) => renderTipCard(r, i, 'Value')).join('')}
    <h2 style="color:#68aeff;margin-bottom:0.65em;">Outside Chancers</h2>
    ${outsiders.map((r, i) => renderTipCard(r, i, 'Outsider')).join('')}
  </section>
`;

console.log('tips.js finished.');
