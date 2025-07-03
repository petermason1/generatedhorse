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
  const body = document.body;

  // --- Navbar Toggling Logic ---
  function toggleNav() {
    const navIsNowOpen = !navLinks.classList.contains('active');

    navLinks.classList.toggle('active');
    navBackdrop.classList.toggle('active');
    body.classList.toggle('nav-open'); // Toggle body class to prevent scroll

    // Update ARIA attributes for accessibility
    hamburger.setAttribute('aria-expanded', navIsNowOpen);
    hamburger.setAttribute('aria-label', navIsNowOpen ? 'Close menu' : 'Open menu');
  }

  // Ensure all elements exist before adding listeners
  if (hamburger && navLinks && navCloseBtn && navBackdrop) {
    hamburger.addEventListener('click', toggleNav);
    navCloseBtn.addEventListener('click', toggleNav);
    navBackdrop.addEventListener('click', toggleNav);

    // Close nav when any link inside navLinks is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', toggleNav);
    });
  }

  // --- Highlight active nav link based on current page ---
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function(link) {
    const href = link.getAttribute('href');
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
  const htmlElement = document.documentElement;

  function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (themeToggleBtn) {
      if (theme === 'light') {
        themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      } else {
        themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      }
    }
  }

  function toggleTheme() {
    if (htmlElement.getAttribute('data-theme') === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }


  // --- Footer Year Logic ---
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }


  // ----- Optional: Racecards logic if window.racecardsData exists -----
  // Get the new wrapper section for "Next 6 Races"
  const next6Section = document.getElementById('next6-section');

  // Check if racecardsData exists and has length, AND if the next6Section exists in the DOM
  if (window.racecardsData && window.racecardsData.length && next6Section) {
    const races = window.racecardsData.slice();
    races.sort((a, b) => getRaceDate(a) - getRaceDate(b));
    const now = new Date();
    races.forEach(r => r.isPast = getRaceDate(r) < now);

    // NEXT 6 RACES BAR (inside the next6Section)
    const bar = document.getElementById('next6Bar'); // Use the correct ID for the bar itself
    if (bar) { // Check if the bar element exists
      const nextRaces = races.filter(r => !r.isPast).slice(0, 6);
      if (!nextRaces.length) {
        // If no future races, hide the entire section
        next6Section.style.display = 'none';
      } else {
        // If there are future races, ensure the section is visible
        next6Section.style.display = ''; // Resets to default CSS display (e.g., 'block' or 'flex')
        bar.innerHTML = nextRaces.map(r =>
          `<div class="next6-pill">
            <div class="next6-course" title="${r.course}">${r.course.length > 8 ? r.course.slice(0, 8) + '…' : r.course}</div>
            <a href="race-${r._id}.html" class="next6-time-btn${r.isPast ? ' past' : ''}">${r.off_time}</a>
          </div>`
        ).join('');
      }
    } else {
      // If the bar element itself is missing but racecardsData exists, still hide the section
      next6Section.style.display = 'none';
    }
  } else {
    // If window.racecardsData is completely missing, empty, or next6Section doesn't exist, hide it
    if (next6Section) { // Only try to hide if the section actually exists in the HTML
      next6Section.style.display = 'none';
    }
  }

  // COURSES LIST
  const courses = {};
  if (window.racecardsData && window.racecardsData.length) { // Ensure racecardsData exists for this part too
    window.racecardsData.forEach(r => {
      if (!courses[r.course]) courses[r.course] = [];
      courses[r.course].push(r);
    });
  }
  const coursesList = document.getElementById('racecardCourses'); // Corrected ID from courses-list to racecardCourses
  if (coursesList) {
    // Only build courses list if there are courses
    if (Object.keys(courses).length > 0) {
      coursesList.innerHTML = Object.entries(courses).map(([course, courseRaces]) => `
        <a class="course-link" href="#">${course}</a>
      `).join('');
      // You'll likely need additional JS to handle clicks on these course-links
      // and update the race times (courseTimesNav) based on the selected course.
    } else {
      coursesList.style.display = 'none'; // Hide if no courses
    }
  }


  // RACE TIMES FOR CURRENT MEETING (assuming this is populated based on selected course)
  const courseTimesNav = document.getElementById('courseTimesNav');
  // You'll need logic here to populate this based on which course is active/selected.
  // For now, let's just ensure it can be hidden if empty, similar to the above.
  if (courseTimesNav && (!window.racecardsData || window.racecardsData.length === 0)) {
     courseTimesNav.style.display = 'none';
  }


  // MAIN RACE CARD (header + runners, all JS-injected)
  const mainRacecard = document.getElementById('mainRacecard');
  // This section would typically be populated with detailed race info and runners
  // based on the race currently being viewed.
  if (mainRacecard && (!window.racecardsData || window.racecardsData.length === 0)) {
    mainRacecard.style.display = 'none'; // Hide if no race data
  }
});


document.addEventListener("DOMContentLoaded", function() {
  const data = window.racecardsData;
  if (!data || !data.racecards) return;

  // Flatten all runners and grab race_id for linking
  const horses = [];
  data.racecards.forEach(race => {
    (race.runners || []).forEach(runner => {
      horses.push({
        horse: runner.horse,
        course: race.course,
        time: race.off_time,
        race: race.race_name,
        number: runner.number || "",
        draw: runner.draw || "",
        jockey: runner.jockey || "",
        trainer: runner.trainer || "",
        race_id: race._id || race.race_id || "", // capture race ID for link!
        horse_id: runner.horse_id || ""
      });
    });
  });

  const input = document.getElementById('horseSearch');
  const resultsDiv = document.getElementById('horseSearchResults');

  input.addEventListener('input', function() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      resultsDiv.innerHTML = "";
      return;
    }

    // Find matching horses
    const matches = horses.filter(h =>
      h.horse.toLowerCase().includes(q)
    );

    // Show results
    if (matches.length === 0) {
      resultsDiv.innerHTML = `<div style="color:#aaa;padding:1em 0;">No horses found.</div>`;
      return;
    }

    resultsDiv.innerHTML = matches.map(h => `
      <div style="background:#23293c;margin-bottom:8px;padding:14px 18px;border-radius:11px;box-shadow:0 1px 10px #0002;">
        <div>
          <b style="color:#ffc900">
            <a href="racecard.html?race_id=${encodeURIComponent(h.race_id)}"
               style="color:#ffc900;text-decoration:underline;"
               target="_blank" rel="noopener">
              ${h.horse}
            </a>
          </b>
        </div>
        <div style="font-size:0.99em;color:#a2ecda;">
          <b>${h.course}</b> &bull; <b>${h.time}</b><br>
          Race: ${h.race}<br>
          ${h.number ? `No: ${h.number}` : ""}${h.draw ? ` &bull; Draw: ${h.draw}` : ""}
          ${h.jockey ? `<br>Jockey: ${h.jockey}` : ""}
          ${h.trainer ? `<br>Trainer: ${h.trainer}` : ""}
        </div>
      </div>
    `).join('');
  });
});
