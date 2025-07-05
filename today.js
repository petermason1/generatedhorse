function parseRaceDate(isoStr) {
  return new Date(isoStr);
}

function getNext6Races(races) {
  const now = new Date();
  const upcoming = races.filter(r => now < new Date(parseRaceDate(r.off_dt).getTime() + 3 * 60000));
  upcoming.sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
  return upcoming.slice(0, 6);
}

function isMobile() {
  return window.innerWidth <= 650;
}

// Find the next race with "cooling off" logic
function getNextRaceIndex(races) {
  const now = new Date();
  for (let i = 0; i < races.length; ++i) {
    const thisOff = parseRaceDate(races[i].off_dt);
    const thisEnd = new Date(thisOff.getTime() + 6 * 60000);
    if (now <= thisEnd) {
      if (i === 0) return 0;
      const prevOff = parseRaceDate(races[i - 1].off_dt);
      const prevEnd = new Date(prevOff.getTime() + 6 * 60000);
      if (now - prevEnd >= 60 * 1000) return i;
      return -1;
    }
  }
  return -1;
}

function renderNext6Bar(races) {
  const barDiv = document.getElementById('next-races-bar');
  if (!races || !races.length) {
    barDiv.innerHTML = '<div class="no-races">No races available.</div>';
    return;
  }
  const now = new Date();
  let nextIndex = getNextRaceIndex(races);

  // Always show 6 boxes (pad with nulls)
  // IMPORTANT: Ensure you have exactly 6 items for a 3x2 grid to fill correctly
  while (races.length < 6) {
      races.push(null);
  }
  // If you have more than 6, slice it to ensure only 6 are rendered in this component
  races = races.slice(0, 6);

  if (isMobile()) {
    // For mobile (3x2 grid), place all race boxes directly into next6-bar-grid
    barDiv.innerHTML = `
      <div class="next6-bar-grid">
        ${races.map((race, i) =>
          race ? renderRaceBox(race, i, nextIndex, now, 'race-bar-box') : `<span class="race-bar-box race-bar-empty"></span>`
        ).join('')}
      </div>
    `;
  } else {
    // For desktop (flex row), keep the next6-bar container
    barDiv.innerHTML = `
      <div class="next6-bar">
        ${races.map((race, i) =>
          race ? renderRaceBox(race, i, nextIndex, now, 'race-bar-box') : `<span class="race-bar-box race-bar-empty"></span>`
        ).join('')}
      </div>
    `;
  }
}

function renderRaceBox(race, idx, nextIndex, now, cls) {
  const off = parseRaceDate(race.off_dt);
  const sixMinsAfter = new Date(off.getTime() + 6 * 60000);
  const finished = now > sixMinsAfter;
  const localTime = off.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let badge = '';
  if (idx === nextIndex) badge = `<span class="badge-next">Next</span>`;
  else if (finished) badge = `<span class="badge-finished">Finished</span>`;
  else badge = `<span class="badge-empty"></span>`;
  return `<a class="${cls}${finished ? ' past' : (idx === nextIndex ? ' next' : '')}"
    href="racecard.html?date=today&race_id=${race._id}" title="${race.course} – ${race.race_name}">
    <span class="race-time">${localTime}</span>
    ${badge}
  </a>`;
}

// ===== All Meetings: finished meetings at bottom live =====
function renderCourseListing(races) {
  const courseDiv = document.getElementById('course-listings');
  if (!races || !races.length) {
    courseDiv.innerHTML = '<div class="no-races">No races available.</div>';
    return;
  }

  // Group by course
  const courses = {};
  races.forEach(r => {
    if (!courses[r.course]) courses[r.course] = [];
    courses[r.course].push(r);
  });

  // Partition courses by all-finished or not
  const now = new Date();
  const notFinished = [];
  const allFinished = [];
  Object.keys(courses).forEach(courseName => {
    const courseRaces = courses[courseName];
    const allDone = courseRaces.every(r => {
      const off = parseRaceDate(r.off_dt);
      return now > new Date(off.getTime() + 6 * 60000);
    });
    if (allDone) allFinished.push({ courseName, courseRaces });
    else notFinished.push({ courseName, courseRaces });
  });

  // Sort by first race time then name
  const courseSort = arr => arr.sort((a, b) => {
    const tA = parseRaceDate(a.courseRaces[0].off_dt).getTime();
    const tB = parseRaceDate(b.courseRaces[0].off_dt).getTime();
    if (tA !== tB) return tA - tB;
    return a.courseName.localeCompare(b.courseName);
  });
  const sortedNotFinished = courseSort(notFinished);
  const sortedAllFinished = courseSort(allFinished);

  const renderBlock = ({ courseName, courseRaces }) => `
      <div class="course-block${courseRaces.every(r => {
        const off = parseRaceDate(r.off_dt);
        return now > new Date(off.getTime() + 6 * 60000);
      }) ? ' course-block-finished' : ''}">
        <div class="course-title">${courseName}</div>
        <div class="course-race-bar">
          ${courseRaces.map(race => {
            const off = parseRaceDate(race.off_dt);
            const sixMinsAfter = new Date(off.getTime() + 6 * 60000);
            const finished = now > sixMinsAfter;
            const localTime = off.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let badge = finished ? `<span class="badge-finished">Finished</span>` : `<span class="badge-empty"></span>`;
            return `<a class="course-race-box${finished ? ' past' : ''}"
              href="racecard.html?date=today&race_id=${race._id}" title="${race.race_name}">
              <span class="race-time">${localTime}</span>
              ${badge}
            </a>`;
          }).join('')}
        </div>
      </div>
    `;

  courseDiv.innerHTML =
    [...sortedNotFinished, ...sortedAllFinished].map(renderBlock).join('');
}

function mainRenderNextRaces() {
  if (!window.racecardsData || !Array.isArray(window.racecardsData.racecards)) {
    document.getElementById('next-races-bar').innerHTML = '<div class="no-races">No races data loaded.</div>';
    document.getElementById('course-listings').innerHTML = '';
    return;
  }
  const races = window.racecardsData.racecards;
  const next6 = getNext6Races(races);
  renderNext6Bar(next6);
  renderCourseListing(races);
}


window.addEventListener('resize', mainRenderNextRaces);
setInterval(mainRenderNextRaces, 30 * 1000);
window.addEventListener('DOMContentLoaded', mainRenderNextRaces);
