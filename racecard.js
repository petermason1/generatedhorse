// ============ racecard.js ============
// FULL SPA RACE CARD LOGIC
// Expects: window.racecardsData.racecards (and optionally window.racecardsDataTomorrow.racecards)

console.log('racecard.js loaded');
console.log(window.racecardsData);

// ========== [1] UTILITY FUNCTIONS ==========

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

// ========== [2] SCORING LOGICS ==========

// -- V2: Form Weighted (Best Performer) --
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

// -- V4: Conservative (Best Performer) --
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

// -- V1: Combo (average of V2 and V4) --
function scoreLogicV1_Combo(r) {
  const s2 = scoreLogicV2_FormWeighted(r);
  const s4 = scoreLogicV4_Conservative(r);
  return Math.round(((s2 + s4) / 2) * 1000) / 1000;
}

// -- V3: Trainer Hot Streak --
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

// ========== [3] MAIN SCORE RUNNER ==========

// -- Set your preferred logic here --
function scoreRunner(r) {
  return scoreLogicV1_Combo(r); // Combo of V2 + V4
  // return scoreLogicV2_FormWeighted(r); // Or use V2 only
  // return scoreLogicV3_TrainerHot(r); // Or V3
  // return scoreLogicV4_Conservative(r); // Or V4 only
}

function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

// ========== [4] URL PARAM HELPERS ==========
function getRaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('race_id');
}
function getDayFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('date') || 'today';
}
function getAllRaces(day) {
  return (day === 'tomorrow' && window.racecardsDataTomorrow)
    ? window.racecardsDataTomorrow.racecards
    : window.racecardsData.racecards;
}

// [5] RENDER "NEXT 6 RACES" BAR
function renderNext6Bar(allRaces, activeRaceId, day) {
  const now = new Date();
  const next6 = allRaces
    .filter(r => new Date(r.off_dt) > now)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
    .slice(0, 6);

  if (!next6.length) {
    return `<span class="next6-empty" style="color:#b7b7b7;opacity:0.8;">No races left today</span>`;
  }
  return next6.map(r => `
    <a href="racecard.html?date=${day}&race_id=${r._id}" class="next6-link${r._id === activeRaceId ? ' active' : ''}" title="${r.course} ${r.off_time}">
      <span class="next6-time">${r.off_time}</span>
      <span class="next6-course">${r.course}</span>
    </a>
  `).join('');
}

// [6] RENDER COURSE NAVIGATION
function renderCourseNavigation(allRaces, currentRaceId, whichDay) {
  const uniqueCourses = [...new Set(allRaces.map(r => r.course))].sort();
  const currentActiveCourse = allRaces.find(r => r._id === currentRaceId)?.course;
  return uniqueCourses.map(courseName => {
    const courseRaces = allRaces.filter(r => r.course === courseName)
      .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
    const firstRace = courseRaces[0];
    const isActive = courseName === currentActiveCourse;
    return `
      <a class="course-link${isActive ? ' active' : ''}" 
         href="racecard.html?date=${whichDay}&race_id=${firstRace._id}" 
         data-race-id="${firstRace._id}" data-date="${whichDay}" data-course="${courseName}">
        ${courseName}
      </a>
    `;
  }).join('');
}

// [7] RENDER RACE TIMES AT COURSE
function renderCourseLinks(race, allRaces, whichDay) {
  const courseRaces = allRaces.filter(r => r.course === race.course)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
  return courseRaces.map(rc => `
    <a class="race-link${rc._id === race._id ? ' race-link-active' : ''}" 
       href="racecard.html?date=${whichDay}&race_id=${rc._id}" 
       data-race-id="${rc._id}" data-date="${whichDay}">
      ${rc.off_time}
    </a>
  `).join('');
}

// [8] RENDER TOP PICKS
function renderTopPicks(race) {
  let top = race.runners.filter(r => !isNonRunner(r)).slice(0, 3);
  if (!top.length) return '';
  return `
    <div class="race-top-picks">
      <div class="race-top-picks-title">Top Picks</div>
      <div class="race-top-picks-list">
        ${top.map((r, i) => `
          <span class="race-top-pick-item">
            <b class="pick-number">${i + 1}.</b>
            <span class="pick-horse">${r.horse}</span>
            <span class="pick-score">(${r.score})</span>
            <span class="pick-odds">${r.odds?.[0]?.fractional || ''}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// [9] RENDER "MORE" PANEL FOR RUNNER
function renderRunnerMore(r) {
  return `
    <div class="runner-more-content">
      <p class="runner-comment"><b>Comment:</b> ${r.comment || '<span class="no-data">No comment</span>'}</p>
      <p class="runner-spotlight"><b>Spotlight:</b> ${r.spotlight || '<span class="no-data">No spotlight</span>'}</p>
      <table class="runner-stats-table"><tbody>
        <tr><td><b>Trainer 14d:</b></td><td>${r.trainer_14_days?.wins || '0'} wins from ${r.trainer_14_days?.runs || '0'} runs (${r.trainer_14_days?.percent || '0'}%)</td></tr>
        <tr><td><b>Trainer RTF:</b></td><td>${r.trainer_rtf ?? '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Jockey:</b></td><td>${r.jockey || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Draw:</b></td><td>${r.draw || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Owner:</b></td>
          <td>${r.owner || '<span class="no-data">-</span>'}
          ${r.prev_owners && r.prev_owners.length ? `<br><span class="prev-owners">Prev: ${r.prev_owners.map(po=>po.owner).join(', ')}</span>` : ''}</td>
        </tr>
        <tr><td><b>Breeder:</b></td><td>${r.breeder || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Colour:</b></td><td>${r.colour || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Sire:</b></td><td>${r.sire || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Dam:</b></td><td>${r.dam || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Headgear:</b></td><td>${r.headgear || '<span class="no-data">-</span>'}</td></tr>
        <tr><td><b>Wind Surgery:</b></td><td>${r.wind_surgery ? 'Yes' : '<span class="no-data">-</span>'}</td></tr>
      </tbody></table>
      ${r.quotes && r.quotes.length ? `
      <div class="runner-quotes"><b>Quotes:</b><ul>
          ${r.quotes.map(q=>`<li><b>${q.date || ''}:</b> ${q.quote}</li>`).join('')}
      </ul></div>` : ''}
      ${r.stable_tour && r.stable_tour.length ? `
      <div class="runner-stable-tour"><b>Stable Tour:</b><ul>
          ${r.stable_tour.map(st=>`<li>${st.quote}</li>`).join('')}
      </ul></div>` : ''}
    </div>
  `;
}

// [10] MAIN RACE DISPLAY
function renderRace(race, allRaces, whichDay) {
  const main = document.getElementById('mainRacecard');
  if (!main) return;
  // Score, sort, NRs last
  race.runners.forEach(r => r.score = scoreRunner(r));
  race.runners.sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999));
  const nrs = race.runners.filter(isNonRunner);
  const runners = race.runners.filter(r => !isNonRunner(r));
  race.runners = [...runners, ...nrs];
  // Render
  main.innerHTML = `
    <section class="race-header">
      <h1>${race.course} <span class="race-header-time">${race.off_time}</span></h1>
      <div class="race-meta">
        <strong class="race-name">${race.race_name}</strong>
        <div class="race-details-line-1">
          Prize: <b class="race-prize">${race.prize?.replace(/\u00a3/, '£') || '-'}</b>
          • Runners: <b class="race-field-size">${race.field_size || '-'}</b>
          • Age/Sex: <b class="race-age-band">${race.age_band||'-'}</b>
        </div>
        <div class="race-details-line-2">
          Pattern: <b class="race-pattern">${race.pattern||race.race_class||''}</b>
          • Region: <b class="race-region">${race.region||'-'}</b>
          • Class <b class="race-class">${race.race_class?.replace('Class ','') || '-'}</b>
          • <b class="race-distance">${race.distance || '-'}</b>
          • <b class="race-going">${race.going || '-'}</b>
        </div>
      </div>
    </section>
    ${renderTopPicks(race)}
    <div class="runners-list">
      ${race.runners.map((r, i) => `
        <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}" data-i="${i}">
          <div class="runner-num-draw">
            <span class="runner-num">${r.number || i+1}</span>
            <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
            <span class="runner-score">${typeof r.score === 'number' ? r.score : ''}</span>
          </div>
          <img class="runner-silk" src="${r.silk_url||'https://placehold.co/39x39/161c22/fff?text=S'}" alt="silks" onerror="this.src='https://placehold.co/39x39/161c22/fff?text=S';" />
          <div class="runner-main">
            <div class="runner-horse">${r.horse || ''}</div>
            <div class="runner-meta-line">
              <span class="runner-jockey">${r.jockey || ''}</span>
              <span class="runner-meta-separator">|</span>
              <span class="runner-trainer">${r.trainer || ''}</span>
              <span class="runner-form">${r.form || ''}</span>
              ${isNonRunner(r) ? '<span class="runner-nr-tag">NR</span>' : ''}
            </div>
            <div class="runner-info-line">
              Age <b class="runner-age">${r.age || '-'}</b>
              • Weight <b class="runner-weight">${r.lbs || '-'}</b>
              • RPR <b class="runner-rpr">${r.rpr || '-'}</b>
              • OR <b class="runner-or">${r.ofr || '-'}</b>
              • TS <b class="runner-ts">${r.ts || '-'}</b>
              ${r.headgear ? `• Headgear <b class="runner-headgear">${r.headgear}</b>` : ''}
              ${r.last_run ? `• Last run <b class="runner-last-run">${r.last_run}d</b>` : ''}
            </div>
            <button class="runner-more-btn" type="button">More info ▼</button>
            <div class="runner-more">${renderRunnerMore(r)}</div>
          </div>
          <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ========== [11] MAIN APP SPA LOGIC ==========
let whichDay = getDayFromURL();
let allRaces = getAllRaces(whichDay);
let raceId = getRaceIdFromURL();

function findRace(raceId, allRaces, courseName) {
  if (raceId) return allRaces.find(r => r._id === raceId) || allRaces[0];
  if (courseName) {
    const target = allRaces.filter(r => r.course === courseName)
      .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))[0];
    if (target) return target;
  }
  return allRaces[0];
}

function loadAndRender(raceId, day, pushState = true, courseName) {
  whichDay = day;
  allRaces = getAllRaces(day);
  let race = findRace(raceId, allRaces, courseName);
  if (!race) {
    document.getElementById('mainRacecard').innerHTML = '<p class="error-message">No race found.</p>';
    return;
  }
  if (pushState) {
    history.pushState({ raceId: race._id, day }, '', `racecard.html?date=${day}&race_id=${race._id}`);
  }
  document.getElementById('next6Bar').innerHTML = renderNext6Bar(allRaces, race._id, whichDay);
  document.getElementById('racecardCourses').innerHTML = renderCourseNavigation(allRaces, race._id, whichDay);
  document.getElementById('courseTimesNav').innerHTML = renderCourseLinks(race, allRaces, whichDay);
  renderRace(race, allRaces, day);
}

// ========== [12] SPA EVENT HANDLERS ==========
document.addEventListener('click', function(e) {
  // Next 6 nav
  if (e.target.closest('.next6-link')) {
    e.preventDefault();
    const el = e.target.closest('.next6-link');
    const url = new URL(el.href, window.location.origin);
    const newDay = url.searchParams.get('date') || whichDay;
    const newRaceId = url.searchParams.get('race_id');
    loadAndRender(newRaceId, newDay);
    return;
  }
  // Course nav
  if (e.target.classList.contains('course-link')) {
    e.preventDefault();
    const newRaceId = e.target.getAttribute('data-race-id');
    const newDay = e.target.getAttribute('data-date') || whichDay;
    const courseName = e.target.getAttribute('data-course');
    loadAndRender(newRaceId, newDay, true, courseName);
    return;
  }
  // Race times
  if (e.target.classList.contains('race-link')) {
    e.preventDefault();
    const newRaceId = e.target.getAttribute('data-race-id');
    const newDay = e.target.getAttribute('data-date') || whichDay;
    loadAndRender(newRaceId, newDay);
    return;
  }
  // Runner more info
  if (e.target.classList.contains('runner-more-btn')) {
    const card = e.target.closest('.runner-card');
    const more = card.querySelector('.runner-more');
    if (!card.classList.contains('expanded')) {
      more.style.display = 'block';
      card.classList.add('expanded');
      e.target.textContent = 'Less info ▲';
    } else {
      more.style.display = 'none';
      card.classList.remove('expanded');
      e.target.textContent = 'More info ▼';
    }
  }
});

// Popstate nav
window.addEventListener('popstate', function(e) {
  const state = e.state || {};
  loadAndRender(state.raceId, state.day, false);
});

// ========== [13] INITIAL LOAD ==========
loadAndRender(raceId, whichDay, false);

console.log('racecard.js finished.');
