console.log('today.js loaded');

// ======== DATA SETUP ========
const races = (window.racecardsData && window.racecardsData.racecards) || [];

// small helper
function isMobile() {
  return window.innerWidth <= 650;
}

// ======== TIME PARSING HELPER ========
/**
 * Turn either r.off_dt (ISO) or r.date + r.off_time into a JS Date (local).
 */
function parseOffTime(r) {
  if (r.off_dt) {
    return new Date(r.off_dt);
  }
  // fallback: combine r.date + r.off_time
  // new Date(year, monthIndex, day, hour, minute)
  const [year, month, day] = r.date.split('-').map(Number);
  let [hour, minute] = (r.off_time || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

// ======== “NEXT 6” SLIDING WINDOW ========
/**
 * Return the next six races whose start is no more than 3 minutes in the past.
 */
function getNext6Races(allRaces) {
  const now = new Date();
  const THREE_MIN_MS = 3 * 60 * 1000;
  const threshold = new Date(now.getTime() - THREE_MIN_MS);

  return allRaces
    // annotate each race with a Date object
    .map(r => ({ ...r, _time: parseOffTime(r) }))
    // drop anything that started more than 3 minutes ago
    .filter(r => r._time >= threshold)
    // sort soonest first
    .sort((a, b) => a._time - b._time)
    // pick the first six
    .slice(0, 6);
}

function pad6(arr) {
  return [...arr, ...Array(6)].slice(0, 6);
}

function truncate(str, max) {
  return str ? str.slice(0, max) : '';
}

function getRaceId(race) {
  return race.race_id || race._id || '';
}

function renderNext6Bar(allRaces) {
  const nextSix = pad6(getNext6Races(allRaces));
  const wrapper = isMobile() ? 'next6-bar-grid' : 'next6-bar';
  return `
    <div class="${wrapper}">
      ${nextSix.map(r =>
        r
          ? `<a href="racecard.html?race_id=${getRaceId(r)}"
                class="race-bar-box"
                title="${r.course} ${r.off_time}">
              <span class="race-time">${r.off_time}</span>
              <span class="race-course">${truncate(r.course, 5)}</span>
            </a>`
          : `<span class="race-bar-box race-bar-empty"></span>`
      ).join('')}
    </div>
  `;
}

function updateNext6Bar() {
  const el = document.getElementById('next-races-bar');
  if (el) el.innerHTML = renderNext6Bar(races);
}

// ======== COURSE LISTING ========
function renderCourseListing(allRaces) {
  const byCourse = {};
  allRaces.forEach(rc => {
    let c = rc.course;
    if (c.startsWith('Lingfield')) c = 'Lingfield';
    byCourse[c] = byCourse[c] || [];
    byCourse[c].push(rc);
  });

  // sort courses by their earliest off‐time
  const rows = Object.entries(byCourse)
    .map(([course, list]) => ({
      course,
      list,
      earliest: Math.min(...list.map(r => parseOffTime(r)))
    }))
    .sort((a, b) => a.earliest - b.earliest);

  return rows.map(({ course, list }) => `
    <div class="course-block">
      <div class="course-title">${course}</div>
      <div class="course-race-bar">
        ${list
          .sort((a, b) => parseOffTime(a) - parseOffTime(b))
          .map(r => `
            <a class="course-race-box"
               href="racecard.html?race_id=${getRaceId(r)}">
              <span class="race-time">${r.off_time}</span>
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
const horseInput      = document.getElementById('horseSearch');
const horseClearBtn   = document.getElementById('horseSearchClear');
const horseResultsDiv = document.getElementById('horseSearchResults');

function searchHorses(query, allR) {
  if (!query || query.length < 2) return [];
  query = query.toLowerCase();
  const out = [];
  for (const rc of allR) {
    if ((rc.course && rc.course.toLowerCase().includes(query))
     || (rc.off_time && rc.off_time.includes(query))) {
      rc.runners.forEach(r => out.push({ ...r, ...rc }));
      continue;
    }
    rc.runners.forEach(r => {
      if (r.horse && r.horse.toLowerCase().includes(query)) {
        out.push({ ...r, ...rc });
      }
    });
  }
  return out.slice(0, 16);
}

function renderHorseResults(list) {
  if (!list.length) {
    horseResultsDiv.innerHTML = '';
    return;
  }
  horseResultsDiv.innerHTML = list.map(r => `
    <div class="horse-search-result">
      <a href="racecard.html?race_id=${getRaceId(r)}">
        <b>${r.horse}</b>
        <span style="color:#ffe561;">(${r.course} ${r.off_time})</span>
      </a>
    </div>
  `).join('');
}

function updateSearchClear() {
  horseClearBtn.style.display = horseInput.value ? 'block' : 'none';
}

// ======== BOOTSTRAP EVERYTHING ========
function mainRender() {
  updateNext6Bar();
  updateCourseListing();
  renderHorseResults([]);
  updateSearchClear();
}

window.addEventListener('resize', updateNext6Bar);
window.addEventListener('DOMContentLoaded', () => {
  mainRender();

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
    if (e.key === 'Escape') {
      horseInput.value = '';
      updateSearchClear();
      renderHorseResults([]);
      horseInput.blur();
    }
  });
});

setInterval(updateNext6Bar, 60_000);  // refresh every minute  

console.log('today.js finished');
