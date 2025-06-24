console.log('racecard.js loaded');
console.log(window.racecardsData);

/**
 * Calculates a score for a given runner based on various factors.
/**
 * Calculates a score for a given runner based on various factors.
 * (Direct port of score_logic_v1_balanced from Python)
 * @param {object} r - The runner object.
 * @returns {number} The calculated score, rounded to one decimal place.
 */
function scoreRunner(r) {
  function safeInt(x, def = 0) {
    if (x === null || x === undefined || x === '' || x === '-' || String(x).toLowerCase() === 'nan') return def;
    let v = parseInt(x);
    return Number.isFinite(v) ? v : def;
  }
  function safeFloat(x, def = 0.0) {
    if (x === null || x === undefined || x === '' || x === '-' || String(x).toLowerCase() === 'nan') return def;
    let v = parseFloat(x);
    return Number.isFinite(v) ? v : def;
  }

  const rpr = safeInt(r.rpr);
  const ts = safeInt(r.ts);
  const orating = safeInt(r.ofr);
  const last_run = safeInt(r.last_run, 99);

  // Form parsing
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
  }

  // Trainer 14 day data
  const trainer = r.trainer_14_days || {};
  const trainerPercent = safeFloat(trainer.percent);
  const trainerWins = safeInt(trainer.wins);

  // Scoring logic (direct translation)
  let score = 0;
  score += rpr;
  score += 0.5 * ts;
  score += 0.3 * orating;
  score += 3 * wins + 1 * places;
  if (last_run > 60) {
    score -= (last_run - 60) * 0.4;
  }
  score += Math.max(0, 60 - last_run) * 0.1;
  score += 0.7 * trainerPercent;
  score += 1.1 * trainerWins;

  // Clamp extreme negatives softly (prevents -80, -99, etc.)
  if (score < -15) {
    score = -15 + (score + 15) * 0.3;
  }
  if (!Number.isFinite(score)) score = 0;
  // Return rounded to 1 decimal
  return Math.round(score * 10) / 10;
}



/**
 * Checks if a runner is a non-runner.
 * @param {object} r - The runner object.
 * @returns {boolean} True if the runner is a non-runner, false otherwise.
 */
function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true; // Explicit non_runner flag
  return false;
}

/**
 * Extracts the race_id from the URL query parameters.
 * @returns {string|null} The race_id if found, otherwise null.
 */
function getRaceId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('race_id');
}

/**
 * Finds the most relevant race for a given course.
 * It prioritizes the first upcoming race. If all races are in the past, it returns the first race of the day.
 * @param {string} courseName - The name of the course.
 * @param {Array<object>} allRaces - An array of all available race objects.
 * @returns {object|null} The target race object, or null if no races are found for the course.
 */
function getTargetRaceForCourse(courseName, allRaces) {
  const racesForCourse = allRaces
    .filter(r => r.course === courseName)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt)); // Sort all races for the course by time

  const now = new Date();

  // Find the first upcoming race for this course
  const upcomingRace = racesForCourse.find(r => new Date(r.off_dt) > now);

  if (upcomingRace) {
    return upcomingRace; // Return the first upcoming race
  } else if (racesForCourse.length > 0) {
    // If no upcoming races, return the first race of the day for that course
    return racesForCourse[0];
  }
  return null; // No races found for this course
}

/**
 * Renders the navigation bar for all courses.
 * Each link directs to the most relevant race (closest to current time or first if all past) on that course.
 * @param {Array<object>} allRaces - All available race data.
 * @param {string} currentRaceId - The ID of the currently active race, used for highlighting.
 * @returns {string} HTML string for the course navigation bar.
 */
function renderCourseNavigation(allRaces, currentRaceId) {
  // Get unique course names and sort them alphabetically
  const uniqueCourses = [...new Set(allRaces.map(r => r.course))].sort();

  const courseLinksHtml = uniqueCourses.map(courseName => {
    const targetRace = getTargetRaceForCourse(courseName, allRaces);
    if (!targetRace) return ''; // Skip if no target race found for a course

    // Determine if this course is currently active
    const currentActiveCourse = allRaces.find(r => r._id === currentRaceId)?.course;
    const isActive = targetRace.course === currentActiveCourse;

    return `
      <a class="course-link${isActive ? ' active' : ''}" href="racecard.html?race_id=${targetRace._id}">
        ${courseName}
      </a>
    `;
  }).join('');

  return `
    <nav class="course-bar">
      ${courseLinksHtml}
    </nav>
  `;
}

/**
 * Renders the race times navigation bar for the current course.
 * @param {object} race - The current race object.
 * @param {Array<object>} allRaces - All available race data.
 * @returns {string} HTML string for the race times navigation bar.
 */
function renderCourseLinks(race, allRaces) {
  const courseRaces = allRaces
    .filter(r => r.course === race.course)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt)); // Sort races for the current course by time

  return `
    <nav class="race-links-bar">
      <span class="race-links-course">${race.course}</span>
      ${courseRaces.map(rc => `
        <a class="race-link${rc._id === race._id ? ' race-link-active' : ''}" href="racecard.html?race_id=${rc._id}">
          ${rc.off_time}
        </a>
      `).join('')}
    </nav>
  `;
}

/**
 * Renders the top 3 picks for the current race.
 * @param {object} race - The current race object.
 * @returns {string} HTML string for the top picks section.
 */
function renderTopPicks(race) {
  // Filter out non-runners and take the top 3
  let top = race.runners.filter(r => !isNonRunner(r)).slice(0, 3);
  if (!top.length) return ''; // Don't render if no top picks

  return `
    <div class="race-top-picks">
      <div class="race-top-picks-title">Top Picks</div>
      <div class="race-top-picks-list">
        ${top.map((r, i) => `
          <span class="race-top-pick-item">
            <b class="pick-number">${i+1}.</b>
            <span class="pick-horse">${r.horse}</span>
            <span class="pick-score">(${r.score})</span>
            <span class="pick-odds">${r.odds?.[0]?.fractional||''}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Renders the detailed "More Info" section for a single runner.
 * @param {object} r - The runner object.
 * @returns {string} HTML string for the runner's more info section.
 */
function renderRunnerMore(r) {
  return `
    <div class="runner-more-content">
        <p class="runner-comment"><b>Comment:</b> ${r.comment || '<span class="no-data">No comment</span>'}</p>
        <p class="runner-spotlight"><b>Spotlight:</b> ${r.spotlight || '<span class="no-data">No spotlight</span>'}</p>

        <table class="runner-stats-table">
          <tbody>
            <tr>
              <td><b>Trainer 14d:</b></td>
              <td>${r.trainer_14_days?.wins || '0'} wins from ${r.trainer_14_days?.runs || '0'} runs (${r.trainer_14_days?.percent || '0'}%)</td>
            </tr>
            <tr>
              <td><b>Trainer RTF:</b></td>
              <td>${r.trainer_rtf ?? '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Jockey:</b></td>
              <td>${r.jockey || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Draw:</b></td>
              <td>${r.draw || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Owner:</b></td>
              <td>
                ${r.owner || '<span class="no-data">-</span>'}
                ${
                  r.prev_owners && r.prev_owners.length
                    ? `<br><span class="prev-owners">Prev: ${r.prev_owners.map(po=>po.owner).join(', ')}</span>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td><b>Breeder:</b></td>
              <td>${r.breeder || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Colour:</b></td>
              <td>${r.colour || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Sire:</b></td>
              <td>${r.sire || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Dam:</b></td>
              <td>${r.dam || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Headgear:</b></td>
              <td>${r.headgear || '<span class="no-data">-</span>'}</td>
            </tr>
            <tr>
              <td><b>Wind Surgery:</b></td>
              <td>${r.wind_surgery ? 'Yes' : '<span class="no-data">-</span>'}</td>
            </tr>
          </tbody>
        </table>

        ${r.quotes && r.quotes.length ? `
        <div class="runner-quotes">
            <b>Quotes:</b>
            <ul>
                ${r.quotes.map(q=>`<li><b>${q.date || ''}:</b> ${q.quote}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${r.stable_tour && r.stable_tour.length ? `
        <div class="runner-stable-tour">
            <b>Stable Tour:</b>
            <ul>
                ${r.stable_tour.map(st=>`<li>${st.quote}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
  `;
}


// ========== Main Logic Execution ==========
const allRaces = window.racecardsData.racecards;
const raceId = getRaceId();

let race = null;
if (raceId) race = allRaces.find(r => r._id === raceId);
if (!race) race = allRaces[0]; // Fallback to first race if ID not found
if (!race) {
  const mainElement = document.getElementById('main');
  if (mainElement) {
    mainElement.innerHTML = '<p class="error-message">No race found.</p>';
  }
  throw new Error('No race found or main element not found!');
}

// Score and sort all runners, push non-runners to bottom
race.runners.forEach(r => r.score = scoreRunner(r));
race.runners.sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999));
const nrs = race.runners.filter(isNonRunner);
const runners = race.runners.filter(r => !isNonRunner(r));
race.runners = [...runners, ...nrs];

/**
 * Renders the entire race page content into the 'main' element.
 * @param {object} race - The race object to render.
 */
function renderRace(race) {
  const mainElement = document.getElementById('main');
  if (!mainElement) {
    console.error("Main element not found!");
    return;
  }

  // Generate the new course navigation bar
  const courseNavigationHtml = renderCourseNavigation(allRaces, race._id);

  // Generate the existing race links bar for the current course's times
  const raceLinksHtml = renderCourseLinks(race, allRaces);

  mainElement.innerHTML = `
    <div class="container">
      ${courseNavigationHtml}
      ${raceLinksHtml}
      <section class="race-header">
        <h1>${race.course} <span class="race-header-time">${race.off_time}</span></h1>
        <div class="race-meta">
          <strong class="race-name">${race.race_name}</strong>
          <div class="race-details-line-1">
            Prize: <b class="race-prize">${race.prize?.replace(/\u00a3/, '£') || '-'}</b>
            • Runners: <b class="race-field-size">${race.field_size || '-'}</b>
            • Age/Sex: <b class="race-age-band">${race.age_band||'-'}</b>
          </div>
          <div class="race-details-line-2">
            Pattern: <b class="race-pattern">${race.pattern||race.race_class||''}</b>
            • Region: <b class="race-region">${race.region||'-'}</b>
            • Class <b class="race-class">${race.race_class?.replace('Class ','') || '-'}</b>
            • <b class="race-distance">${race.distance || '-'}</b>
            • <b class="race-going">${race.going || '-'}</b>
          </div>
        </div>
      </section>
      ${renderTopPicks(race)}
      <div class="runners-list">
        ${race.runners.map((r, i) => `
          <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}" data-i="${i}">
            <div class="runner-num-draw">
              <span class="runner-num">${r.number || i+1}</span>
              <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
              <span class="runner-score">${typeof r.score === 'number' ? r.score : ''}</span>
            </div>
            <img class="runner-silk" src="${r.silk_url||'https://placehold.co/39x39/161c22/fff?text=S'}" alt="silks" onerror="this.src='https://placehold.co/39x39/161c22/fff?text=S';" />
            <div class="runner-main">
              <div class="runner-horse">${r.horse || ''}</div>
              <div class="runner-meta-line">
                <span class="runner-jockey">${r.jockey || ''}</span>
                <span class="runner-meta-separator">|</span>
                <span class="runner-trainer">${r.trainer || ''}</span>
                <span class="runner-form">${r.form || ''}</span>
                ${isNonRunner(r) ? '<span class="runner-nr-tag">NR</span>' : ''}
              </div>
              <div class="runner-info-line">
                Age <b class="runner-age">${r.age || '-'}</b>
                • Weight <b class="runner-weight">${r.lbs || '-'}</b>
                • RPR <b class="runner-rpr">${r.rpr || '-'}</b>
                • OR <b class="runner-or">${r.ofr || '-'}</b>
                • TS <b class="runner-ts">${r.ts || '-'}</b>
                ${r.headgear ? `• Headgear <b class="runner-headgear">${r.headgear}</b>` : ''}
                ${r.last_run ? `• Last run <b class="runner-last-run">${r.last_run}d</b>` : ''}
              </div>
              <button class="runner-more-btn" type="button">More info ▼</button>
              <div class="runner-more">
                ${renderRunnerMore(r)}
              </div>
            </div>
            <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Initial render of the race page
renderRace(race);

// Event listener for toggling the more-info section
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('runner-more-btn')) {
    const card = e.target.closest('.runner-card');
    card.classList.toggle('expanded');
    // Update button text based on expanded state
    e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
  }
});

console.log('racecard.js finished.');
