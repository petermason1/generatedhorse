// main.js

// Helper function to get race date
function getRaceDate(r) {
  if (r.off_dt) return new Date(r.off_dt);
  if (r.race_datetime) return new Date(r.race_datetime);
  if (r.off_time && r.date) return new Date(r.date + "T" + r.off_time);
  return new Date();
}

document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const navBackdrop = document.getElementById('navBackdrop');
  const body = document.body; // Reference to the body for 'nav-open' class

  // --- Navbar Toggling Logic ---
  function toggleNav() {
    navLinks.classList.toggle('active');
    navBackdrop.classList.toggle('active');
    hamburger.classList.toggle('active');
    body.classList.toggle('nav-open'); // Toggle body class to prevent scroll

    // Toggle close button visibility based on nav state
    if (navLinks.classList.contains('active')) {
      navCloseBtn.style.display = 'block';
      hamburger.setAttribute('aria-expanded', 'true');
    } else {
      navCloseBtn.style.display = 'none';
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }

  if (hamburger && navLinks && navCloseBtn && navBackdrop) {
    hamburger.addEventListener('click', toggleNav);
    navCloseBtn.addEventListener('click', toggleNav);
    navBackdrop.addEventListener('click', toggleNav);

    // Close nav when any link inside navLinks is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', toggleNav); // Use the same toggle function to close
    });
  }

  // --- Highlight active nav link based on current page ---
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function(link) {
    const href = link.getAttribute('href');
    // Handles both index.html and root, and accounts for empty href for root
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


  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement; // This is the <html> tag

  // Function to set the theme
  function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Store user preference

    // Update aria-label for accessibility
    if (themeToggleBtn) { // Ensure button exists before setting attributes
      if (theme === 'light') {
        themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      } else {
        themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      }
    }
  }

  // Function to toggle the theme
  function toggleTheme() {
    if (htmlElement.getAttribute('data-theme') === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }

  // Check for user's preferred theme on page load
  // Order of preference: localStorage > OS preference > default (dark)
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme); // Apply saved theme
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    // If no saved theme, check OS preference and set to light if preferred
    setTheme('light');
  } else {
    // Default to dark mode if no preference saved and OS preference is not light
    setTheme('dark');
  }

  // Add event listener to the theme toggle button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }


  // --- Footer Year Logic ---
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }


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