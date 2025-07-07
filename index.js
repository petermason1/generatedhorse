console.log('index.js loaded');

const races = (window.racecardsData && window.racecardsData.racecards) || [];

if (!races.length) {
  document.getElementById('main-content-dynamic').innerHTML = '<h2>No racecards loaded.</h2>';
  document.getElementById('next6-dynamic').innerHTML = '';
  throw new Error('No racecards!');
}

// Render Next 6 races bar
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

// Render races grouped by course
function renderByCourse(allRaces) {
  const byCourse = {};
  allRaces.forEach(rc => {
    let course = rc.course;
    if (course.startsWith("Lingfield")) course = "Lingfield";
    if (!byCourse[course]) byCourse[course] = [];
    byCourse[course].push(rc);
  });

  const courseRows = Object.entries(byCourse)
    .map(([course, courseRaces]) => {
      const minOffDt = Math.min(...courseRaces.map(r => new Date(r.off_dt)));
      return { course, courseRaces, minOffDt };
    })
    .sort((a, b) => a.minOffDt - b.minOffDt);

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

// ==== RENDER TODAY'S SMART PICKS ====
// Use your existing scoring or fallback to 0 if missing
function renderTodaySmartPicks(allRaces) {
  const isNonRunner = r => r.number && r.number.toString().trim().toUpperCase() === 'NR';

  // Flatten runners & score if missing
  const allRunners = allRaces.flatMap(race => (race.runners || []).map(runner => {
    // Score from racecard.js scoreRunner if you want, else fallback:
    const score = typeof runner.score === 'number' ? runner.score : 0;
    return {
      ...runner,
      raceName: race.race_name,
      course: race.course,
      offTime: race.off_time,
      score
    };
  }));

  // Filter valid runners only
  const validRunners = allRunners.filter(r => r.score > 0 && !isNonRunner(r));

  // Sort descending by score and pick top 3 only
  const topPicks = validRunners.sort((a, b) => b.score - a.score).slice(0, 3);

  if (topPicks.length === 0) {
    return `<p>No picks available for today.</p>`;
  }

  return topPicks.map((pick, i) => `
    <div class="pick-card ${i === 0 ? 'pick-best' : ''}">
      ${i === 0 ? '<div class="pick-label">Value Pick</div>' : ''}
      <div class="pick-main">
        <span class="pick-horse">${pick.horse}</span>
        <span class="pick-race">${pick.offTime} ${pick.course}</span>
      </div>
      <div class="pick-notes">Score: ${pick.score.toFixed(2)}</div>
    </div>
  `).join('');
}

const picksContainer = document.querySelector('.picks-list');
if (picksContainer) {
  picksContainer.innerHTML = renderTodaySmartPicks(races);
}

console.log('index.js finished.');
