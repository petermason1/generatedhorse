// === Helpers ===
function isNonRunner(r) {
  if (typeof r.form === 'string' && /\bNR\b/i.test(r.form)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

function convertLbsToStone(lbs) {
  const v = Number(lbs);
  if (!v || isNaN(v)) return '-';
  const s = Math.floor(v / 14);
  const p = v % 14;
  return s > 0 ? `${s}st${p ? ' ' + p + 'lb' : ''}` : `${p}lb`;
}

// === Odds Helper (ONLY use odds_fractional) ===
function decimalToFractional(decimal) {
  if (!decimal || typeof decimal !== 'number' || decimal < 1.01) return '';
  const num = Math.round((decimal - 1) * 100);
  const denom = 100;
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  const d = gcd(num, denom);
  const numer = num / d, denomr = denom / d;
  return denomr === 1 ? `${numer}/1` : `${numer}/${denomr}`;
}

function getRunnerOdds(r) {
  // Only use the odds_fractional field if present, else blank
  return r.odds_fractional || '';
}


// --- Render course (meeting) pills ---
function renderCourseNavigation(allRaces, currentCourse) {
  const uniqueCourses = [...new Set(allRaces.map(r => r.course))].sort();
  return uniqueCourses.map(courseName => {
    const isActive = courseName === currentCourse;
    return `
      <a class="course-link${isActive ? ' active' : ''}" href="#" data-course="${courseName}">
        ${courseName}
      </a>
    `;
  }).join('');
}

// --- Render race time pills for current course ---
function renderCourseTimes(allRaces, currentCourse, currentRaceId) {
  const racesAtCourse = allRaces.filter(r => r.course === currentCourse);
  return racesAtCourse.map(race =>
    `<a class="race-link${race.race_id === currentRaceId ? ' active' : ''}" href="#" data-race="${race.race_id}" data-course="${currentCourse}">
      ${race.off_time}
    </a>`
  ).join('');
}

// --- Render main racecard (WITH More Info button/drawer) ---
function renderRace(race, allRaces, whichDay) {
  const main = document.getElementById('mainRacecard');
  if (!main || !race || !race.runners) {
    if (main) main.innerHTML = "<p>No race or runners found.</p>";
    return;
  }

  // Render course pills and race time pills
  document.getElementById('racecardCourses').innerHTML =
    renderCourseNavigation(allRaces, race.course);
  document.getElementById('courseTimesNav').innerHTML =
    renderCourseTimes(allRaces, race.course, race.race_id);

  // Sort and show runners
  const activeRunners = race.runners.filter(r => !isNonRunner(r));
  const nonRunners = race.runners.filter(isNonRunner);
  activeRunners.sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999));

  main.innerHTML = `
    <section class="race-header">
      <h1>${race.course} <span class="race-header-time">${race.off_time}</span></h1>
      <div class="race-meta">
        <strong class="race-name">${race.race_name}</strong>
        <div class="race-details-line-1">
          Prize: <b class="race-prize">${race.prize?.replace(/\u00a3/, '£') || '-'}</b>
          • Runners: <b class="race-field-size">${activeRunners.length || '-'}</b>
          • Age/Sex: <b class="race-age-band">${race.age_band||'-'}</b>
        </div>
        <div class="race-details-line-2">
          <span class="race-detail-item">Pattern: <b class="race-pattern">${race.pattern||race.race_class||''}</b></span>
          <span class="race-detail-item">Region: <b class="race-region">${race.region||'-'}</b></span>
          <span class="race-detail-item">Class <b class="race-class">${race.race_class?.replace('Class ','') || '-'}</b></span>
          <span class="race-detail-item">Distance: <b class="race-distance">${race.distance || '-'}</b></span>
          <span class="race-detail-item">Going: <b class="race-going">${race.going || '-'}</b></span>
        </div>
      </div>
    </section>
    <div class="runners-list">
      ${activeRunners.map((r, i) => `
        <div class="runner-card" data-i="${i}">
          <div class="runner-num-draw">
            <span class="runner-num">${r.number || i+1}</span>
            <span class="runner-draw">${
              (r.draw !== undefined && r.draw !== null && r.draw !== '')
                ? `(${r.draw})`
                : ''
            }</span>
          </div>
          <div class="runner-silk-group">
            <img class="runner-silk" src="${r.silk_url||'https://placehold.co/39x39/161c22/fff?text=S'}" alt="silks" onerror="this.src='https://placehold.co/39x39/161c22/fff?text=S';" />
            <span class="runner-form">${r.form || ''}</span>
          </div>
          <div class="runner-main">
            <div class="runner-horse">
                ${r.horse || ''}
                <span class="runner-age-weight">
                    ${r.age ? ` (${r.age}yo)` : ''}
                    ${r.lbs ? ` ${convertLbsToStone(r.lbs)}` : ''}
                </span>
            </div>
            <div class="runner-meta-line">
              <span class="runner-jockey">${r.jockey || ''}</span>
              <span class="runner-meta-separator">|</span>
              <span class="runner-trainer">${r.trainer || ''}</span>
            </div>
            <div class="runner-info-line">
              RPR <b class="runner-rpr">${r.rpr || '-'}</b>
              • OR <b class="runner-or">${r.ofr || '-'}</b>
              • TS <b class="runner-ts">${r.ts || '-'}</b>
              ${r.headgear ? `• Headgear <b class="runner-headgear">${r.headgear}</b>` : ''}
              ${r.last_run ? `• Last run <b class="runner-last-run">${r.last_run}d</b>` : ''}
            </div>
            <div class="runner-key-stats">
                ${r.score !== undefined && r.score !== null ? `<span class="runner-score-inline">Score: ${r.score}</span>` : ''}
                ${getRunnerOdds(r) ? `<span class="runner-odds-inline">Odds: ${getRunnerOdds(r)}</span>` : ''}
            </div>
            <button class="runner-more-btn" type="button" aria-expanded="false">More Info</button>
            <div class="runner-more" tabindex="-1">
              <div class="runner-more-content">
                <p><b>Sire:</b> ${r.sire || '—'}<br><b>Dam:</b> ${r.dam || '—'}</p>
                <p><b>Owner:</b> ${r.owner || '—'}</p>
                <p><b>Trainer Form (14 days):</b> ${r.trainer_14_days
    ? `${r.trainer_14_days.wins}/${r.trainer_14_days.runs} wins (${r.trainer_14_days.percent}%)`
    : '—'}</p>

                <p><b>Comment:</b> ${r.comment || 'No additional info.'}</p>
                <p><b>Spotlight:</b> ${r.spotlight || 'No spotlight available.'}</p>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    ${nonRunners.length > 0 ? `
      <div class="non-runners-section">
        <h2>Non-Runners (${nonRunners.length})</h2>
        <div class="non-runners-list">
          ${nonRunners.map(nr => `
            <div class="non-runner-item">
              <span class="non-runner-num">${nr.number || ''}.</span>
              <span class="non-runner-horse">${nr.horse || ''}</span>
              <span class="non-runner-reason">${nr.status_reason || 'Withdrawn'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // === Add More Info toggle handlers ===
  setTimeout(() => { // let DOM update
    document.querySelectorAll('.runner-more-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const card = btn.closest('.runner-card');
        // Close others:
        document.querySelectorAll('.runner-card.expanded').forEach(el => {
          if (el !== card) el.classList.remove('expanded');
        });
        card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', card.classList.contains('expanded'));
      });
    });
    // Optional: close drawer when clicking outside
    document.addEventListener('click', function(ev) {
      document.querySelectorAll('.runner-card.expanded').forEach(card => {
        if (!card.contains(ev.target)) card.classList.remove('expanded');
      });
    });
  }, 0);
}

// === SPA navigation handling ===
document.addEventListener('click', function(e) {
  // --- Course (meetings) navigation ---
  if (e.target.classList.contains('course-link')) {
    e.preventDefault();
    const course = e.target.getAttribute('data-course');
    const allRaces = window.racecardsData && window.racecardsData.racecards;
    if (allRaces) {
      // Always show first race of new course!
      const firstRace = allRaces.filter(r => r.course === course)
        .sort((a, b) => a.off_time.localeCompare(b.off_time))[0];
      if (firstRace) renderRace(firstRace, allRaces, "today");
    }
  }
  // --- Race time navigation ---
  if (e.target.classList.contains('race-link')) {
    e.preventDefault();
    const raceId = e.target.getAttribute('data-race');
    const allRaces = window.racecardsData && window.racecardsData.racecards;
    if (allRaces) {
      const race = allRaces.find(r => r.race_id === raceId);
      if (race) renderRace(race, allRaces, "today");
    }
  }
});

// === Find and show race on page load ===
document.addEventListener('DOMContentLoaded', function () {
  const rcData = window.racecardsData && window.racecardsData.racecards;
  const main = document.getElementById('mainRacecard');

  if (!rcData || !Array.isArray(rcData) || rcData.length === 0) {
    if (main) main.innerHTML = "<p>No race data found.</p>";
    return;
  }

  // Check for race_id in URL
  const params = new URLSearchParams(window.location.search);
  const raceIdFromUrl = params.get('race_id');

  let raceToRender;
  if (raceIdFromUrl) {
    // Find race by race_id or _id from URL
    raceToRender = rcData.find(r => (r.race_id || r._id) === raceIdFromUrl);
  }

  // If no specific race found from URL, or no ID provided, default to the first race
  if (!raceToRender) {
    raceToRender = rcData[0];
  }

  if (raceToRender) {
    renderRace(raceToRender, rcData, "today");
  } else {
    if (main) main.innerHTML = "<p>No race found to display.</p>";
  }
});
