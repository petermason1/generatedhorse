// main.js -- Site UI + Horse Search Bar

// =============== NAVBAR TOGGLING ===============
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const navBackdrop = document.getElementById('navBackdrop');
  const body = document.body;

  function toggleNav() {
    const navIsNowOpen = !navLinks.classList.contains('active');
    navLinks.classList.toggle('active');
    navBackdrop.classList.toggle('active');
    body.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', navIsNowOpen);
    hamburger.setAttribute('aria-label', navIsNowOpen ? 'Close menu' : 'Open menu');
  }

  if (hamburger && navLinks && navCloseBtn && navBackdrop) {
    hamburger.addEventListener('click', toggleNav);
    navCloseBtn.addEventListener('click', toggleNav);
    navBackdrop.addEventListener('click', toggleNav);
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', toggleNav);
    });
  }

  // =============== NAV ACTIVE LINK ===============
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

  // =============== THEME TOGGLE ===============
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute(
        'aria-label',
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      );
    }
  }
  function toggleTheme() {
    setTheme(htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  }
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  // =============== FOOTER YEAR ===============
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // =============== HORSE SEARCH BAR ===============
  // Requires: window.racecardsData.racecards to be loaded
  const horseSearchInput = document.getElementById('horseSearch');
  const horseSearchResults = document.getElementById('horseSearchResults');
  // If present, enable search bar
  if (horseSearchInput && horseSearchResults && window.racecardsData && Array.isArray(window.racecardsData.racecards)) {
    const allRaces = window.racecardsData.racecards;
    // Helper to search for horses
    function searchHorses(query) {
      query = query.trim().toLowerCase();
      if (!query) return [];
      const results = [];
      allRaces.forEach(race => {
        (race.runners || []).forEach(runner => {
          if ((runner.horse || '').toLowerCase().includes(query)) {
            results.push({
              horse: runner.horse,
              race: race,
              runner: runner
            });
          }
        });
      });
      return results;
    }
    horseSearchInput.addEventListener('input', function(e) {
      const val = e.target.value;
      horseSearchResults.innerHTML = '';
      if (val.length < 2) return;
      const results = searchHorses(val);
      if (!results.length) {
        horseSearchResults.innerHTML = `<div style="color:#bbb;">No horses found.</div>`;
        return;
      }
      horseSearchResults.innerHTML = results.slice(0, 8).map(r =>
        `<div class="horse-search-result">
          <a href="racecard.html?race_id=${r.race._id}">
            <b>${r.horse}</b> <span style="color:#aaa;">(${r.race.off_time}, ${r.race.course})</span>
          </a>
        </div>`
      ).join('');
    });
    // Optional: click result fills search box
    horseSearchResults.addEventListener('click', function(e) {
      if (e.target.closest('a')) {
        horseSearchInput.value = '';
        horseSearchResults.innerHTML = '';
      }
    });
  }
});

(function horseSearchInit() {
  const horseSearchInput = document.getElementById('horseSearch');
  const horseSearchResults = document.getElementById('horseSearchResults');
  // Wait until data is loaded
  if (!(horseSearchInput && horseSearchResults && window.racecardsData && Array.isArray(window.racecardsData.racecards))) {
    setTimeout(horseSearchInit, 200);
    return;
  }
  const allRaces = window.racecardsData.racecards;
  function searchHorses(query) {
    query = query.trim().toLowerCase();
    if (!query) return [];
    const results = [];
    allRaces.forEach(race => {
      (race.runners || []).forEach(runner => {
        if ((runner.horse || '').toLowerCase().includes(query)) {
          results.push({
            horse: runner.horse,
            race: race,
            runner: runner
          });
        }
      });
    });
    return results;
  }
  horseSearchInput.addEventListener('input', function(e) {
    const val = e.target.value;
    horseSearchResults.innerHTML = '';
    if (val.length < 2) return;
    const results = searchHorses(val);
    if (!results.length) {
      horseSearchResults.innerHTML = `<div style="color:#bbb;">No horses found.</div>`;
      return;
    }
    horseSearchResults.innerHTML = results.slice(0, 8).map(r =>
      `<div class="horse-search-result">
        <a href="racecard.html?race_id=${r.race._id}">
          <b>${r.horse}</b> <span style="color:#aaa;">(${r.race.off_time}, ${r.race.course})</span>
        </a>
      </div>`
    ).join('');
  });
  horseSearchResults.addEventListener('click', function(e) {
    if (e.target.closest('a')) {
      horseSearchInput.value = '';
      horseSearchResults.innerHTML = '';
    }
  });
})();
