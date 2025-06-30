console.log('racecard.yesterday.js loaded');
console.log(window.racecardsDataYesterday);

(function () {
  // ====== UTILITY FUNCTIONS ======

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

  function scoreRunner(r) {
    const rpr = safeInt(r.rpr);
    const ts = safeInt(r.ts);
    const orating = safeInt(r.ofr);
    const last_run = safeInt(r.last_run, 99);

    let wins = 0, places = 0;
    if (typeof r.form === 'string') {
      wins = (r.form.match(/1/g) || []).length;
      places = (r.form.match(/2/g) || []).length + (r.form.match(/3/g) || []).length;
    }

    const trainer = r.trainer_14_days || {};
    const trainerPercent = safeFloat(trainer.percent);
    const trainerWins = safeInt(trainer.wins);

    let score = 0;
    score += rpr;
    score += 0.5 * ts;
    score += 0.3 * orating;
    score += 3 * wins + 1 * places;
    if (last_run > 60) score -= (last_run - 60) * 0.4;
    score += Math.max(0, 60 - last_run) * 0.1;
    score += 0.7 * trainerPercent;
    score += 1.1 * trainerWins;
    if (score < -15) score = -15 + (score + 15) * 0.3;
    if (!Number.isFinite(score)) score = 0;
    return Math.round(score * 10) / 10;
  }

  function isNonRunner(r) {
    if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
    if (r.status && r.status.toUpperCase() === 'NR') return true;
    if (r.non_runner === true) return true;
    return false;
  }

  function getRaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('race_id');
  }

  function getAllRaces() {
    // ONLY YESTERDAY
    return window.racecardsDataYesterday.racecards;
  }

  // Picks the "next" race if first has gone +3 mins (not really used for yesterday but kept for navigation)
  function getTargetRaceForCourse(courseName, allRaces) {
    const racesForCourse = allRaces
      .filter(r => r.course === courseName)
      .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));
    if (!racesForCourse.length) return null;
    return racesForCourse[0];
  }

  // ========== RENDER FUNCTIONS ==========

  function renderCourseNavigation(allRaces, currentRaceId) {
    const uniqueCourses = [...new Set(allRaces.map(r => r.course))].sort();
    return `
      <nav class="course-bar">
        ${uniqueCourses.map(courseName => {
          const targetRace = getTargetRaceForCourse(courseName, allRaces);
          if (!targetRace) return '';
          const currentActiveCourse = allRaces.find(r => r._id === currentRaceId)?.course;
          const isActive = targetRace.course === currentActiveCourse;
          return `
            <a class="course-link${isActive ? ' active' : ''}" href="#" 
              data-race-id="${targetRace._id}" data-course="${courseName}">
              ${courseName}
            </a>
          `;
        }).join('')}
      </nav>
    `;
  }

  function renderCourseLinks(race, allRaces) {
    const courseRaces = allRaces
      .filter(r => r.course === race.course)
      .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));

    // Deduplicate by off_time
    const seenTimes = new Set();
    const uniqueByTime = [];
    for (const rc of courseRaces) {
      if (!seenTimes.has(rc.off_time)) {
        seenTimes.add(rc.off_time);
        uniqueByTime.push(rc);
      }
    }

    return `
      <div class="race-links-wrapper" style="position:relative;">
        <button class="race-links-arrow left" type="button" aria-label="Scroll left" style="display:none;">&lt;</button>
        <nav class="race-links-bar">
          ${uniqueByTime.map(rc => `
            <a class="race-link${rc._id === race._id ? ' race-link-active' : ''}" 
              href="#" data-race-id="${rc._id}">
              ${rc.off_time}
            </a>
          `).join('')}
        </nav>
        <button class="race-links-arrow right" type="button" aria-label="Scroll right" style="display:none;">&gt;</button>
      </div>
    `;
  }

  function renderTopPicks(race) {
    let top = race.runners.filter(r => !isNonRunner(r)).slice(0, 3);
    if (!top.length) return '';
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
                  ${r.prev_owners && r.prev_owners.length
                    ? `<br><span class="prev-owners">Prev: ${r.prev_owners.map(po=>po.owner).join(', ')}</span>`
                    : ''}
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

  function renderRace(race, allRaces) {
    const mainElement = document.getElementById('main');
    if (!mainElement) return;
    race.runners.forEach(r => r.score = scoreRunner(r));
    race.runners.sort((a, b) => (b.score ?? -9999) - (a.score ?? -9999));
    const nrs = race.runners.filter(isNonRunner);
    const runners = race.runners.filter(r => !isNonRunner(r));
    race.runners = [...runners, ...nrs];
    mainElement.innerHTML = `
      <div class="container">
        ${renderCourseNavigation(allRaces, race._id)}
        ${renderCourseLinks(race, allRaces)}
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
                <div class="runner-more">${renderRunnerMore(r)}</div>
              </div>
              <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    setupRaceLinksArrows();
  }

  // ========== MAIN APP LOGIC ==========

  let allRaces = getAllRaces();
  let raceId = getRaceIdFromURL();

  function findRace(raceId, allRaces, courseName) {
    if (raceId) return allRaces.find(r => r._id === raceId) || allRaces[0];
    if (courseName) {
      const target = getTargetRaceForCourse(courseName, allRaces);
      if (target) return target;
    }
    return allRaces[0];
  }

  function loadAndRender(raceId, pushState=true, courseName) {
    allRaces = getAllRaces();
    let race = findRace(raceId, allRaces, courseName);
    if (!race) {
      document.getElementById('main').innerHTML = '<p class="error-message">No race found.</p>';
      return;
    }
    if (pushState) {
      history.pushState({ raceId: race._id }, '', `racecard.yesterday.html?race_id=${race._id}`);
    }
    renderRace(race, allRaces);
  }

  function setupRaceLinksArrows() {
    document.querySelectorAll('.race-links-wrapper').forEach(wrapper => {
      const bar = wrapper.querySelector('.race-links-bar');
      const left = wrapper.querySelector('.race-links-arrow.left');
      const right = wrapper.querySelector('.race-links-arrow.right');
      if (!bar || !left || !right) return;

      function scrollToActiveRaceLink() {
        const active = bar.querySelector('.race-link-active');
        if (bar && active) {
          const leftPad = parseInt(window.getComputedStyle(bar).paddingLeft, 10) || 0;
          let offset = active.offsetLeft - leftPad - 8;
          if (offset < 0) offset = 0;
          bar.scrollTo({ left: offset, behavior: 'smooth' });
        }
      }

      function updateArrowVisibility() {
        if (bar.scrollWidth > bar.clientWidth + 4) {
          left.style.display = 'flex';
          right.style.display = 'flex';
        } else {
          left.style.display = 'none';
          right.style.display = 'none';
        }
      }
      function updateArrows() {
        left.style.opacity = bar.scrollLeft > 4 ? "0.94" : "0.25";
        right.style.opacity = (bar.scrollWidth - bar.clientWidth - bar.scrollLeft > 4) ? "0.94" : "0.25";
      }
      left.onclick = () => { bar.scrollBy({ left: -120, behavior: 'smooth' }); };
      right.onclick = () => { bar.scrollBy({ left: 120, behavior: 'smooth' }); };

      bar.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', () => {
        updateArrowVisibility();
        updateArrows();
      });

      setTimeout(() => {
        updateArrowVisibility();
        updateArrows();
        scrollToActiveRaceLink();
      }, 120);
    });
  }

  // Initial load
  loadAndRender(raceId, false);

  // SPA navigation
  document.addEventListener('click', function(e) {
    // Course navigation
    if (e.target.classList.contains('course-link')) {
      e.preventDefault();
      const newRaceId = e.target.getAttribute('data-race-id');
      const courseName = e.target.getAttribute('data-course');
      loadAndRender(newRaceId, true, courseName);
      return;
    }
    // Race time navigation
    if (e.target.classList.contains('race-link')) {
      e.preventDefault();
      const newRaceId = e.target.getAttribute('data-race-id');
      loadAndRender(newRaceId);
      return;
    }
    // Runner more info toggle
    if (e.target.classList.contains('runner-more-btn')) {
      const card = e.target.closest('.runner-card');
      card.classList.toggle('expanded');
      e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
    }
  });

  // SPA Back/Forward
  window.addEventListener('popstate', function(e) {
    const state = e.state || {};
    loadAndRender(state.raceId, false);
  });

  console.log('racecard.yesterday.js finished.');
})();
