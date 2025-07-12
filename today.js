console.log('today.js loaded');

// ======== DATA SETUP ========
const races = (window.racecardsData && window.racecardsData.racecards) || [];

function isMobile() {
  return window.innerWidth <= 650;
}

// ======== NEXT 6 BAR ========

// ======== NEXT 6 BAR ========

// Return races that have started within the last X minutes
function getNext6Races(allRaces) {
  const now = new Date();
  const ONE_MINUTE_MS = 60000;

  // Option 1: Show races that started up to 10 minutes ago, but are not too far in the future
  // This will show races that are currently running or just finished.
  const maxPastTime = new Date(now.getTime() - 3  * ONE_MINUTE_MS); // Races that started up to 10 minutes ago
  const maxFutureTime = new Date(now.getTime() + 60 * ONE_MINUTE_MS); // Don't show races too far in the future (e.g., more than an hour away)

  return allRaces
    .filter(r => {
      const raceOffTime = new Date(r.off_dt || r.off_time);
      // Include races that started within the last 10 minutes AND are not more than an hour in the future
      return raceOffTime >= maxPastTime && raceOffTime <= maxFutureTime;
    })
    .sort((a, b) => new Date(a.off_dt || a.off_time) - new Date(b.off_dt || b.off_time))
    .slice(0, 6);
}

// ... rest of your code remains the same ...

function pad6(arr) {
  // Always 6 slots
  return [...arr, ...Array(6)].slice(0, 6);
}
function truncate(str, max) {
  return str ? str.slice(0, max) : '';
}

function getRaceId(race) {
  return race.race_id || race._id || '';
}

function renderNext6Bar(allRaces) {
  const races6 = pad6(getNext6Races(allRaces));
  const wrapperCls = isMobile() ? "next6-bar-grid" : "next6-bar";
  return `<div class="${wrapperCls}">
    ${races6.map(r =>
      r
        ? `<a href="racecard.html?race_id=${getRaceId(r)}" class="race-bar-box" title="${r.course} ${r.off_time}">
            <span class="race-time">${r.off_time}</span>
            <span class="race-course">${truncate(r.course, 5)}</span>
          </a>`
        : `<span class="race-bar-box race-bar-empty"></span>`
    ).join('')}
  </div>`;
}

function updateNext6Bar() {
  const el = document.getElementById('next-races-bar');
  if (el) el.innerHTML = renderNext6Bar(races);
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
      const minOffDt = Math.min(...courseRaces.map(r => new Date(r.off_dt || r.off_time)));
      return { course, courseRaces, minOffDt };
    })
    .sort((a, b) => a.minOffDt - b.minOffDt);

  // Render
  return courseRows.map(({ course, courseRaces }) => `
    <div class="course-block">
      <div class="course-title">${course}</div>
      <div class="course-race-bar">
        ${courseRaces
          .sort((a, b) => new Date(a.off_dt || a.off_time) - new Date(b.off_dt || b.off_time))
          .map(rc => `
            <a class="course-race-box" href="racecard.html?race_id=${getRaceId(rc)}">
              <span class="race-time">${rc.off_time}</span>
            </a>
          `).join('')}
      </div>
    </div>
  `).join('');
}
function updateCourseListing() {
  const el = document.getElementById('course-listings');
  if (el) el.innerHTML = renderCourseListing(races);
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
    if ((race.course && race.course.toLowerCase().includes(query)) || (race.off_time && race.off_time.includes(query))) {
      for (const runner of (race.runners || [])) {
        results.push({ ...runner, course: race.course, off_time: race.off_time, raceId: getRaceId(race) });
      }
      continue;
    }
    // Fuzzy match on horse
    for (const runner of (race.runners || [])) {
      if (runner.horse && runner.horse.toLowerCase().includes(query)) {
        results.push({ ...runner, course: race.course, off_time: race.off_time, raceId: getRaceId(race) });
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
      <a href="racecard.html?race_id=${r.raceId}">
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

// Optionally, auto-update every minute for “live” bar
setInterval(updateNext6Bar, 60000);

console.log('today.js finished');
