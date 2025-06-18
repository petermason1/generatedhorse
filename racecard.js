console.log('racecard.js loaded');
console.log(window.racecardsData);

function scoreRunner(r) {
  const rpr = Number.parseInt(r.rpr) || 0;
  const ts = Number.parseInt(r.ts) || 0;
  const or = Number.parseInt(r.ofr) || 0;
  const lastRun = Number.parseInt(r.last_run);
  const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99;

  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/[23]/g) || []).length;
  }

  const trainerPercent = Number.parseFloat(r.trainer_14_days?.percent) || 0;
  const trainerWins = Number.parseInt(r.trainer_14_days?.wins) || 0;
  const trainerBonus = trainerPercent >= 20 ? 0.5 : 0;
  const layoffPenalty = (wins === 0 && lastRunVal > 50) ? -2.5 : 0;

  let score = 0;
  score += 1.1 * rpr;
  score += 0.6 * ts;
  score += 0.32 * or;
  score += 2.1 * wins + 1.1 * places;
  if (lastRunVal > 50) {
    score += -(lastRunVal - 50) * 0.19;
  } else {
    score += (50 - lastRunVal) * 0.13;
  }
  score += 0.8 * trainerPercent;
  score += 1.2 * trainerWins;
  score += trainerBonus + layoffPenalty;

  if (score < -12) score = -12 + (score + 12) * 0.4;
  if (!Number.isFinite(score)) score = 0;
  return Math.round(score * 100) / 100;
}

// ========== Helper: Is Non-Runner ==========
function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

// ========== Helper: Get race_id from URL ==========
function getRaceId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('race_id');
}

// ========== Main Logic ==========
const main = document.getElementById('main');
const allRaces = window.racecardsData.racecards;
const raceId = getRaceId();

let race = null;
if (raceId) race = allRaces.find(r => r._id === raceId);
if (!race) race = allRaces[0];
if (!race) {
  main.innerHTML = '<p style="color: #e54c47;">No race found.</p>';
  throw new Error('No race found!');
}

// Score and sort all runners, push non-runners to bottom
race.runners.forEach(r => r.score = scoreRunner(r));
race.runners.sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999));
const nrs = race.runners.filter(isNonRunner);
const runners = race.runners.filter(r => !isNonRunner(r));
race.runners = [...runners, ...nrs];

// --- Course Race Bar ---
function renderCourseLinks(race, allRaces) {
  const courseRaces = allRaces
    .filter(r => r.course === race.course)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
  return `
    <nav class="race-links-bar">
      <span class="race-links-course">${race.course}</span>
      ${courseRaces.map(rc => `
        <a class="race-link${rc._id === race._id ? ' race-link-active' : ''}" href="racecard.html?race_id=${rc._id}">
          ${rc.off_time}
        </a>
      `).join('')}
    </nav>
  `;
}

// --- Top 3 picks (excluding NRs) ---
function renderTopPicks(race) {
  let top = race.runners.filter(r => !isNonRunner(r)).slice(0, 3);
  if (!top.length) return '';
  return `
    <div class="top-picks" style="margin-bottom:15px;">
      <div style="font-weight:700; font-size:1.07em; color:#ffc900; margin-bottom:3px;">
        Top Picks
      </div>
      <div>
        ${top.map((r, i) => `
          <span style="display:inline-block; margin-right:13px;">
            <b>${i+1}.</b> <span style="color:#32dd99;">${r.horse}</span>
            <span style="font-weight:600; color:#fff;">(${r.score})</span>
            <span style="color:#ffe564; margin-left:2px;">${r.odds?.[0]?.fractional||''}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// --- More Info Table ---
function renderRunnerMore(r) {
  return `
    <b>Comment:</b> ${r.comment || '<span style="color:#888">No comment</span>'}<br>
    <b>Spotlight:</b> ${r.spotlight || '<span style="color:#888">No spotlight</span>'}<br>
    <table class="runner-stats-table" style="margin:0.7em 0;font-size:0.97em;background:#21242a;border-radius:7px;width:100%;">
      <tbody>
        <tr>
          <td><b>Trainer 14d:</b></td>
          <td>${r.trainer_14_days?.wins || '0'} wins from ${r.trainer_14_days?.runs || '0'} runs (${r.trainer_14_days?.percent || '0'}%)</td>
          <td><b>Trainer RTF:</b></td>
          <td>${r.trainer_rtf ?? '-'}</td>
        </tr>
        <tr>
          <td><b>Jockey:</b></td>
          <td>${r.jockey || '-'}</td>
          <td><b>Draw:</b></td>
          <td>${r.draw || '-'}</td>
        </tr>
        <tr>
          <td><b>Owner:</b></td>
          <td colspan="3">
            ${r.owner || '-'}
            ${
              r.prev_owners && r.prev_owners.length
                ? `<br><span style="color:#90f">Prev: ${r.prev_owners.map(po=>po.owner).join(', ')}</span>`
                : ''
            }
          </td>
        </tr>
        <tr>
          <td><b>Breeder:</b></td>
          <td>${r.breeder || '-'}</td>
          <td><b>Colour:</b></td>
          <td>${r.colour || '-'}</td>
        </tr>
        <tr>
          <td><b>Sire:</b></td>
          <td>${r.sire || '-'}</td>
          <td><b>Dam:</b></td>
          <td>${r.dam || '-'}</td>
        </tr>
        <tr>
          <td><b>Headgear:</b></td>
          <td>${r.headgear || '-'}</td>
          <td><b>Wind Surgery:</b></td>
          <td>${r.wind_surgery ? 'Yes' : '-'}</td>
        </tr>
      </tbody>
    </table>
    <b>Quotes:</b> <ul>${r.quotes?.map(q=>`<li><b>${q.date || ''}:</b> ${q.quote}</li>`).join('') || '-'}</ul>
    <b>Stable Tour:</b> <ul>${r.stable_tour?.map(st=>`<li>${st.quote}</li>`).join('') || '-'}</ul>
  `;
}

function renderRace(race) {
  main.innerHTML = `
    <div class="container">
      ${renderCourseLinks(race, allRaces)}
      <section class="race-header">
        <h1>${race.course} <span style="font-weight: 600;">${race.off_time}</span></h1>
        <div class="race-meta">
          <strong>${race.race_name}</strong>
          <div>
            Prize: <b>${race.prize?.replace(/\u00a3/, '£') || '-'}</b>
            • Runners: <b>${race.field_size || '-'}</b>
            • Age/Sex: <b>${race.age_band||'-'}</b>
            • Pattern: <b>${race.pattern||race.race_class||''}</b>
            • Region: <b>${race.region||'-'}</b>
          </div>
        </div>
        <div class="race-details">
          Class ${race.race_class?.replace('Class ','') || '-'} • ${race.distance || '-'} • ${race.going || '-'}
        </div>
      </section>
      ${renderTopPicks(race)}
      <div class="runners-list">
        ${race.runners.map((r, i) => `
          <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}" data-i="${i}">
            <div class="runner-num-draw">
              <span class="runner-num">${r.number || i+1}</span>
              <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
              <span class="runner-score" style="display:block;font-size:0.93em;color:#32dd99;font-weight:700;">${typeof r.score === 'number' ? r.score : ''}</span>
            </div>
            <img class="runner-silk" src="${r.silk_url||''}" alt="silks" />
            <div class="runner-main">
              <div class="runner-horse">${r.horse || ''}</div>
              <div class="runner-meta">
                ${r.jockey || ''} <span style="opacity:.5;">|</span> ${r.trainer || ''}
                <span class="runner-form">${r.form || ''}</span>
                ${isNonRunner(r) ? '<span style="color:#e55;font-weight:700;margin-left:8px;">NR</span>' : ''}
              </div>
              <div class="runner-info">
                Age <b>${r.age || '-'}</b>
                • Weight <b>${r.lbs || '-'}</b>
                • RPR <b>${r.rpr || '-'}</b>
                • OR <b>${r.ofr || '-'}</b>
                • TS <b>${r.ts || '-'}</b>
                ${r.headgear ? `• Headgear <b>${r.headgear}</b>` : ''}
                ${r.last_run ? `• Last run <b>${r.last_run}d</b>` : ''}
              </div>
              <button class="runner-more-btn" type="button">More info ▼</button>
              <div class="runner-more">
                ${renderRunnerMore(r)}
              </div>
            </div>
            <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

renderRace(race);

// Toggle the more-info section for each runner
main.addEventListener('click', (e) => {
  if (e.target.classList.contains('runner-more-btn')) {
    const card = e.target.closest('.runner-card');
    card.classList.toggle('expanded');
    e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
  }
});
