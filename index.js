console.log('index.js loaded');
const main = document.getElementById('main');
const races = window.racecardsData.racecards;

// Sort races by off_dt (datetime)
races.sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));

// Next 6 races that haven't gone off yet
const now = new Date();
const next6 = races.filter(r => new Date(r.off_dt) >= now).slice(0, 6);

// Group races by course
const courses = {};
for (const rc of races) {
  if (!courses[rc.course]) courses[rc.course] = [];
  courses[rc.course].push(rc);
}

main.innerHTML = `
  <section class="next6-bar">
    <h2>Next 6 Races</h2>
    <div class="next6-races">
      ${next6.map(r => `
        <a class="next6-race-link" href="racecard.html?race_id=${r._id}">
          <div class="next6-time">${r.off_time}</div>
          <div class="next6-course">${r.course}</div>
        </a>
      `).join('')}
      ${next6.length === 0 ? '<span style="opacity:.6">No more races today</span>' : ''}
    </div>
  </section>

  <section class="courses-list">
    ${Object.entries(courses).map(([course, courseRaces]) => `
      <div class="course-block">
        <h3>${course}</h3>
        <div class="course-races">
          ${courseRaces.map(rc => `
            <a class="race-link" href="racecard.html?race_id=${rc._id}">
              ${rc.off_time} &mdash; <b>${rc.race_name}</b>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </section>
`;
