console.log('index.js loaded');
const main = document.getElementById('main');
const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  main.innerHTML = '<h2>No racecards loaded.</h2>';
  throw new Error('No racecards!');
}

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    // Ensure we don't truncate too much if original text is shorter than maxLength-3
    return text.substring(0, maxLength - 3) + '...'; 
  }
  return text;
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

// ---- Sort courses by earliest off_dt ----
const courseRows = Object.entries(byCourse)
  .map(([course, courseRaces]) => {
    // Find the earliest off_dt for this course
    const minOffDt = Math.min(...courseRaces.map(r => new Date(r.off_dt)));
    return { course, courseRaces, minOffDt };
  })
  .sort((a, b) => a.minOffDt - b.minOffDt); // Sort by earliest race

// ---- Main Section HTML ----
let html = "";

// Next 6 Races block — only show if at least 1 race is upcoming
if (next6.length) {
  html += `
    <section class="next6-bar" style="margin-bottom:2.2em;">
      <h2 style="color:#ffc900;">Next 6 Races</h2>
      <div class="next6-races">
        ${next6.map(r => {
          const truncatedCourse = truncateText(r.course, 10); // Apply truncation here
          return `
            <a class="next6-race-link" href="racecard.html?race_id=${r._id}">
              <div class="next6-course">${truncatedCourse}</div>
              <div class="next6-time">${r.off_time}</div>
            </a>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

html += `
  <section class="races-course-list" style="margin-top:2.4em;">
    <h2 style="margin-bottom:.9em;color:#ffc900;">Today's Racecards</h2>
    ${courseRows.map(({ course, courseRaces }) => `
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
