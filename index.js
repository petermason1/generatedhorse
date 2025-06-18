console.log('index.js loaded');
const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  main.innerHTML = '<h2>No racecards loaded.</h2>';
  throw new Error('No racecards!');
}

// ---- Next 6 races (not gone off, sorted by time ascending) ----
const now = new Date();
const next6 = [...races]
  .filter(r => new Date(r.off_dt) >= now)
  .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
  .slice(0, 6);


// ---- Races grouped by course ----
const byCourse = {};
for (const rc of races) {
  let course = rc.course;
  if (course.startsWith("Lingfield")) course = "Lingfield";
  if (!byCourse[course]) byCourse[course] = [];
  byCourse[course].push(rc);
}


// ---- Main Section HTML ----
let html = "";

// Next 6 Races block — only show if at least 1 race is upcoming
if (next6.length) {
  html += `
    <section class="next6-bar" style="margin-bottom:2.2em;">
      <h2 style="color:#ffc900;">Next 6 Races</h2>
      <div class="next6-races">
        ${next6.map(r => `
          <a class="next6-race-link" href="racecard.html?race_id=${r._id}">
            <div class="next6-time">${r.off_time}</div>
            <div class="next6-course">${r.course}</div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

html += `
  <section class="races-course-list" style="margin-top:2.4em;">
    <h2 style="margin-bottom:.9em;color:#ffc900;">Today's Racecards</h2>
    ${Object.entries(byCourse).map(([course, courseRaces]) => `
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
    `).join('')}
  </section>
`;

main.innerHTML = html;
console.log('index.js finished.');
