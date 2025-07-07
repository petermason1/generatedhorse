console.log('index.js loaded');

const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  document.getElementById('main-content-dynamic').innerHTML = '<h2>No racecards loaded.</h2>';
  document.getElementById('next6-dynamic').innerHTML = '';
  throw new Error('No racecards!');
}

// ---- NEXT 6 RACES ----
function renderNext6Bar(allRaces) {
  const now = new Date();
  const next6 = allRaces
    .filter(r => new Date(r.off_dt) > now)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
    .slice(0, 6);

  if (!next6.length) {
    return `<span class="next6-empty" style="color:#b7b7b7;opacity:0.8;">No races left today</span>`;
  }
  return next6.map(r => `
    <a href="racecard.html?race_id=${r._id}" class="next6-race-link" title="${r.course} ${r.off_time}">
      <span class="next6-time">${r.off_time}</span>
      <span class="next6-course">${r.course}</span>
    </a>
  `).join('');
}

document.getElementById('next6-dynamic').innerHTML = renderNext6Bar(races);

// ---- RACES BY COURSE ----
function renderByCourse(allRaces) {
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

  // Build section
  return courseRows.map(({ course, courseRaces }) => `
    <div class="racecard-course-row">
      <div class="racecard-course-header">${course}</div>
      <div class="racecard-race-row">
        ${courseRaces
          .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
          .map(rc => `
            <a class="racecard-time-link" href="racecard.html?race_id=${rc._id}">
              <span class="racecard-time">${rc.off_time}</span>
            </a>
          `).join('')}
      </div>
    </div>
  `).join('');
}

document.getElementById('main-content-dynamic').innerHTML = renderByCourse(races);

console.log('index.js finished.');
