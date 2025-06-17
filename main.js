// main.js
// Put your data like this (replace with real data.js import if you want):
// window.racecardsData = [...];   // array of racecard objects

function getRaceDate(r) {
  if (r.off_dt) return new Date(r.off_dt);
  if (r.race_datetime) return new Date(r.race_datetime);
  if (r.off_time && r.date) return new Date(r.date + "T" + r.off_time);
  return new Date();
}

document.addEventListener('DOMContentLoaded', function () {
  // Hamburger nav
  document.getElementById('hamburger').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('show');
  });

  const races = (window.racecardsData || []).slice();
  // Sort by time
  races.sort((a, b) => getRaceDate(a) - getRaceDate(b));
  const now = new Date();
  // Mark past/future
  races.forEach(r => r.isPast = getRaceDate(r) < now);
  // Next 6
  const nextRaces = races.filter(r => !r.isPast).slice(0, 6);

  // NEXT 6 RACES
  let bar = document.getElementById('next6-bar');
  if (!bar) return;
  if (!nextRaces.length) {
    bar.innerHTML = '<span class="next6-title">No more races today</span>';
  } else {
    bar.innerHTML =
      nextRaces.map(r =>
        `<div class="next6-pill">
          <div class="next6-course" title="${r.course}">${r.course.length > 8 ? r.course.slice(0, 8) + '…' : r.course}</div>
          <a href="race-${r._id}.html" class="next6-time-btn${r.isPast ? ' past' : ''}">${r.off_time}</a>
        </div>`
      ).join('');
  }

  // GROUP BY COURSE for main list
  let courses = {};
  races.forEach(r => {
    if (!courses[r.course]) courses[r.course] = [];
    courses[r.course].push(r);
  });
  let coursesList = document.getElementById('courses-list');
  coursesList.innerHTML = Object.entries(courses).map(([course, courseRaces]) => `
    <section class="course-section">
      <h2 class="course-title">${course}</h2>
      <div class="race-times-row">
        ${courseRaces.map(rc =>
          `<a class="race-time-btn" href="race-${rc._id}.html">${rc.off_time}</a>`
        ).join('')}
      </div>
    </section>
  `).join('');
});
