// main.js
function getRaceDate(r) {
  if (r.off_dt) return new Date(r.off_dt);
  if (r.race_datetime) return new Date(r.race_datetime);
  if (r.off_time && r.date) return new Date(r.date + "T" + r.off_time);
  return new Date();
}

document.addEventListener('DOMContentLoaded', function () {
  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    // Close nav on any link click (mobile UX)
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  // Highlight active nav link based on current page (works for /, /index.html, etc.)
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function(link) {
    const href = link.getAttribute('href');
    // Handles both index.html and root
    if (
      href === currentPath ||
      (currentPath === 'index.html' && (href === './' || href === '')) ||
      (currentPath === '' && (href === 'index.html' || href === './' || href === ''))
    ) {
      link.classList.add('nav-link-active');
    } else {
      link.classList.remove('nav-link-active');
    }
  });

  // ----- Optional: Racecards logic if window.racecardsData exists -----
  if (window.racecardsData && window.racecardsData.length) {
    const races = window.racecardsData.slice();
    races.sort((a, b) => getRaceDate(a) - getRaceDate(b));
    const now = new Date();
    races.forEach(r => r.isPast = getRaceDate(r) < now);

    // NEXT 6 RACES BAR
    const bar = document.getElementById('next6-bar');
    if (bar) {
      const nextRaces = races.filter(r => !r.isPast).slice(0, 6);
      if (!nextRaces.length) {
        bar.innerHTML = '<span class="next6-title">No more races today</span>';
      } else {
        bar.innerHTML = nextRaces.map(r =>
          `<div class="next6-pill">
            <div class="next6-course" title="${r.course}">${r.course.length > 8 ? r.course.slice(0, 8) + '…' : r.course}</div>
            <a href="race-${r._id}.html" class="next6-time-btn${r.isPast ? ' past' : ''}">${r.off_time}</a>
          </div>`
        ).join('');
      }
    }

    // COURSES LIST
    const courses = {};
    races.forEach(r => {
      if (!courses[r.course]) courses[r.course] = [];
      courses[r.course].push(r);
    });
    const coursesList = document.getElementById('courses-list');
    if (coursesList) {
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
    }
  }
});


// main.js
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const navBackdrop = document.getElementById('navBackdrop');
  const body = document.body;

  // Hamburger opens nav
  if (hamburger && navLinks && navCloseBtn && navBackdrop) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.add('active');
      navCloseBtn.style.display = 'block';
      navBackdrop.classList.add('active');
      body.classList.add('nav-open');
      hamburger.classList.add('active');
    });
    // Close button closes nav
    navCloseBtn.addEventListener('click', function () {
      navLinks.classList.remove('active');
      navCloseBtn.style.display = 'none';
      navBackdrop.classList.remove('active');
      body.classList.remove('nav-open');
      hamburger.classList.remove('active');
    });
    // Overlay closes nav
    navBackdrop.addEventListener('click', function () {
      navLinks.classList.remove('active');
      navCloseBtn.style.display = 'none';
      navBackdrop.classList.remove('active');
      body.classList.remove('nav-open');
      hamburger.classList.remove('active');
    });
    // Clicking a link closes nav
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navCloseBtn.style.display = 'none';
        navBackdrop.classList.remove('active');
        body.classList.remove('nav-open');
        hamburger.classList.remove('active');
      });
    });
  }

  // Highlight active nav link based on current page
  const currentPath = window.location.pathname.split('/').pop() || "index.html";
  document.querySelectorAll('.nav-link').forEach(link => {
    if (
      link.getAttribute('href') === currentPath ||
      (currentPath === '' && (link.getAttribute('href') === 'index.html' || link.getAttribute('href') === './'))
    ) {
      link.classList.add('nav-link-active');
    } else {
      link.classList.remove('nav-link-active');
    }
  });
});
