// today.js

console.log('today.js loaded');

// ======== DATA SETUP ========
const races = (window.racecardsData && window.racecardsData.racecards) || [];

function isMobile() {
  return window.innerWidth <= 650;
}

// ======== NEXT 6 BAR ========
function getNext6Races(allRaces) {
  const now = new Date();
  return allRaces
    .filter(r => new Date(r.off_dt) > now)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
    .slice(0, 6);
}
function pad6(arr) {
  // Always 6 slots
  return [...arr, ...Array(6)].slice(0, 6);
}
function truncate(str, max) {
  return str.length > max ? str.slice(0, max-1) + '…' : str;
}
function renderNext6Bar(allRaces) {
  const races6 = pad6(getNext6Races(allRaces));
  const wrapperCls = isMobile() ? "next6-bar-grid" : "next6-bar";
  return `<div class="${wrapperCls}">
    ${races6.map(r =>
      r
        ? `<a href="racecard.html?date=today&race_id=${r._id}" class="race-bar-box" title="${r.course} ${r.off_time}">
            <span class="race-time">${r.off_time}</span>
            <span class="race-course">${truncate(r.course, 10)}</span>
          </a>`
        : `<span class="race-bar-box race-bar-empty"></span>`
    ).join('')}
  </div>`;
}

function updateNext6Bar() {
  document.getElementById('next-races-bar').innerHTML = renderNext6Bar(races);
}

// ======== COURSE LISTING ========
function renderCourseListing(allRaces) {
  // Group by course
  const byCourse = {};
  allRaces.forEach(rc => {
    let course = rc.course;
    if (course.startsWith("Lingfield")) course = "Lingfield";
    if (!byCourse[course]) byCourse[course] = [];
    byCourse[course].push(rc);
  });

  // Sort courses by earliest race off_dt
  const courseRows = Object.entries(byCourse)
    .map(([course, courseRaces]) => {
      const minOffDt = Math.min(...courseRaces.map(r => new Date(r.off_dt)));
      return { course, courseRaces, minOffDt };
    })
    .sort((a, b) => a.minOffDt - b.minOffDt);

  // Render
  return courseRows.map(({ course, courseRaces }) => `
    <div class="course-block">
      <div class="course-title">${course}</div>
      <div class="course-race-bar">
        ${courseRaces
          .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
          .map(rc => `
            <a class="course-race-box" href="racecard.html?date=today&race_id=${rc._id}">
              <span class="race-time">${rc.off_time}</span>
            </a>
          `).join('')}
      </div>
    </div>
  `).join('');
}
function updateCourseListing() {
  document.getElementById('course-listings').innerHTML = renderCourseListing(races);
}

// ======== HORSE SEARCH ========
const horseInput = document.getElementById('horseSearch');
const horseClearBtn = document.getElementById('horseSearchClear');
const horseResultsDiv = document.getElementById('horseSearchResults');

function searchHorses(query, allRaces) {
  if (!query || query.length < 2) return [];
  query = query.toLowerCase();
  const results = [];
  for (const race of allRaces) {
    // Fuzzy match on course or time
    if (race.course.toLowerCase().includes(query) || race.off_time.includes(query)) {
      for (const runner of (race.runners || [])) {
        results.push({ ...runner, course: race.course, off_time: race.off_time, raceId: race._id });
      }
      continue;
    }
    // Fuzzy match on horse
    for (const runner of (race.runners || [])) {
      if (runner.horse && runner.horse.toLowerCase().includes(query)) {
        results.push({ ...runner, course: race.course, off_time: race.off_time, raceId: race._id });
      }
    }
  }
  return results.slice(0, 16);
}
function renderHorseResults(list) {
  if (!list.length) {
    horseResultsDiv.innerHTML = '';
    return;
  }
  horseResultsDiv.innerHTML = list.map(r =>
    `<div class="horse-search-result">
      <a href="racecard.html?date=today&race_id=${r.raceId}">
        <b>${r.horse}</b> <span style="color:#ffe561;">(${r.course} ${r.off_time})</span>
      </a>
    </div>`
  ).join('');
}
function updateSearchClear() {
  horseClearBtn.style.display = horseInput.value ? 'block' : 'none';
}

// ======== EVENTS ========
function mainRender() {
  updateNext6Bar();
  updateCourseListing();
  renderHorseResults([]);
  updateSearchClear();
}
window.addEventListener('resize', updateNext6Bar);
window.addEventListener('DOMContentLoaded', () => {
  mainRender();

  // Search bar events
  horseInput.addEventListener('input', e => {
    updateSearchClear();
    if (e.target.value.length < 2) return renderHorseResults([]);
    renderHorseResults(searchHorses(e.target.value, races));
  });
  horseClearBtn.addEventListener('click', () => {
    horseInput.value = '';
    updateSearchClear();
    renderHorseResults([]);
    horseInput.focus();
  });
  horseInput.addEventListener('keydown', e => {
    if (e.key === "Escape") {
      horseInput.value = '';
      updateSearchClear();
      renderHorseResults([]);
      horseInput.blur();
    }
  });
  updateSearchClear();
});

console.log('today.js finished');
