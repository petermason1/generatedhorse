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
// === Odds Helper ===
function getRunnerOdds(r) {
  // Array version: look for Bet365, then latest
  if (Array.isArray(r.odds) && r.odds.length) {
    const bet365 = r.odds.find(o =>
      (o.source && o.source.toLowerCase().includes('bet365')) ||
      (o.provider && o.provider.toLowerCase().includes('bet365'))
    );
    if (bet365 && bet365.fractional) return bet365.fractional;
    // Otherwise, show latest available
    const last = r.odds[r.odds.length - 1];
    if (last && last.fractional) return last.fractional;
    if (last && last.decimal) return last.decimal;
  }
  // Object version with .bet365 key
  if (r.odds && r.odds.bet365 && r.odds.bet365.fractional) return r.odds.bet365.fractional;
  // Fallbacks
  if (r.sp_fractional) return r.sp_fractional;
  if (r.sp) return r.sp;
  if (r.sp_dec) return r.sp_dec;
  return '';
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

// --- Render main racecard ---
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
      <h2>Runners</h2>
      ${activeRunners.map((r, i) => `
        <div class="runner-card" data-i="${i}">
          <div class="runner-num-draw">
            <span class="runner-num">${r.number || i+1}</span>
            <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
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
                <span class="runner-score-inline">Score: ${typeof r.score === 'number' ? r.score : ''}</span>
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
          </div>
          <span class="runner-odds">${getRunnerOdds(r)}</span>
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

// === Find and show first race on page load ===
document.addEventListener('DOMContentLoaded', function () {
  const rcData = window.racecardsData && window.racecardsData.racecards;
  if (rcData && Array.isArray(rcData) && rcData.length > 0) {
    renderRace(rcData[0], rcData, "today");
  } else {
    const main = document.getElementById('mainRacecard');
    if (main) main.innerHTML = "<p>No race data found.</p>";
  }
});
