// constants for localStorage keys
const LOCAL_STORAGE_TODAY_KEY = 'smartRacecards_todayResults';
const LOCAL_STORAGE_YESTERDAY_KEY = 'smartRacecards_yesterdayResults';
const LOCAL_STORAGE_LAST_FETCH_DATE_KEY = 'smartRacecards_lastFetchDate';

/**
 * Calculates the number of paid places for a given race based on its type and number of runners.
 * @param {object} race - The race object.
 * @returns {number} The number of paid places.
 */
function getPaidPlaces(race) {
  const isHandicap = /handicap/i.test(race.race_name || "");
  // Filter for runners with a valid position (position > 0)
  const runners = (race.runners || []).filter(r => r.position && Number(r.position) > 0).length;

  if (isHandicap && runners >= 16) return 4;
  if (runners >= 8) return 3;
  if (runners >= 5) return 2;
  return 1;
}

/**
 * Renders the race results to the DOM.
 * @param {object} data - The results data object.
 * @param {boolean} isFallback - True if displaying fallback data, shows a banner.
 */
function renderResults(data, isFallback = false) {
  const resultsDiv = document.getElementById('results');
  let msg = '';
  if (isFallback) {
    msg = `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>`;
  }
  if (!data || !data.results || !data.results.length) {
    resultsDiv.innerHTML = msg + '<p>No results yet. Please check back later.</p>';
    return;
  }

  resultsDiv.innerHTML = msg + data.results.map(race => {
    const off = race.off || race.off_time || race.time || '-';
    const course = race.course || race.venue || '-';
    const name = race.race_name || race.name || '';
    const paid = getPaidPlaces(race);

    // Get all paid places, sorted by position
    const top = (race.runners || [])
      .filter(r => r.position && Number(r.position) > 0)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .slice(0, paid);

    // Name & SP helpers
    const rn = r => r.horse || r.runner_name || r.name || '-';
    const sp = r => r.sp || r.starting_price || r.sp_dec || '-';

    // Render each placed runner, always show SP
    const placeLabels = ["winner", "placed", "third", "placed", "placed"]; // Assuming max 5 places for medal display
    const medal = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
    const places = top.map((runner, i) => {
      const cls = placeLabels[i] || "placed"; // Fallback to 'placed' for 4th, 5th etc.
      return `<span class="${cls}">${medal(i)} <b>${rn(runner)}</b> <small>(SP: ${sp(runner)})</small></span>`;
    }).join('');

    return `
      <div class="race-result">
        <h2>${off} - ${course}</h2>
        <div class="race-meta">${name}</div>
        <div class="race-horses">${places}</div>
      </div>
    `;
  }).join('');
}

// --- Helper: get today's date in YYYY-MM-DD ---
function getTodaysDateStr() {
  return new Date().toISOString().split('T')[0];
}

// --- Helper: get yesterday's date in YYYY-MM-DD ---
// (Note: This function is still here but will not be used for the hardcoded static file fetch)
function getYesterdaysDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Saves data to local storage.
 * @param {string} key - The localStorage key.
 * @param {object} data - The data to save.
 */
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

/**
 * Retrieves data from local storage.
 * @param {string} key - The localStorage key.
 * @returns {object|null} The parsed data or null if not found/error.
 */
function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error getting from localStorage:', e);
    return null;
  }
}

/**
 * Manages local storage for daily results, promoting today's to yesterday's at day rollover.
 */
function manageLocalStorageDates() {
  const todayStr = getTodaysDateStr();
  const lastFetchDate = localStorage.getItem(LOCAL_STORAGE_LAST_FETCH_DATE_KEY);

  if (lastFetchDate && lastFetchDate !== todayStr) {
    // It's a new day! Promote today's results to yesterday's.
    const yesterdaysResults = getFromLocalStorage(LOCAL_STORAGE_TODAY_KEY);
    if (yesterdaysResults) {
      saveToLocalStorage(LOCAL_STORAGE_YESTERDAY_KEY, yesterdaysResults);
    }
    // Clear today's results as it's a new day
    localStorage.removeItem(LOCAL_STORAGE_TODAY_KEY);
  }
  // Always update the last fetch date to today
  localStorage.setItem(LOCAL_STORAGE_LAST_FETCH_DATE_KEY, todayStr);
}

/**
 * Main function to load and render results using a tiered fallback system.
 * 1. Live API fetch for today's results.
 * 2. Local storage for today's results.
 * 3. Local storage for yesterday's results.
 * 4. Hardcoded static file for 2025-06-30-results.json.
 */
async function loadResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Loading results...'; // Initial loading message
  manageLocalStorageDates(); // Handle day rollover

  let dataToRender = null;
  let isFallbackRender = false;
  const todaysDateStr = getTodaysDateStr(); // Get today's date

  try {
    // 1. Try to fetch today's live results
    console.log(`Attempting to fetch live results from /api/results for ${todaysDateStr}`);
    const response = await fetch('/api/results');
    if (response.ok) {
      const liveData = await response.json();
      if (liveData && liveData.results && liveData.results.length) {
        dataToRender = liveData;
        saveToLocalStorage(LOCAL_STORAGE_TODAY_KEY, liveData);
        console.log("Fetched and rendered live today's results.");
      } else {
        console.log("Live API returned no or empty results, checking local cache for today.");
      }
    } else {
      console.log(`Live API fetch failed with status: ${response.status}. Checking local cache for today.`);
    }

    // If dataToRender is still null, proceed with fallbacks
    if (!dataToRender) {
      // 2. Try cached today's results
      dataToRender = getFromLocalStorage(LOCAL_STORAGE_TODAY_KEY);
      if (dataToRender && dataToRender.results && dataToRender.results.length) {
        console.log("Rendered cached today's results.");
      } else {
        console.log("No cached today's results, checking local cache for yesterday.");
        // 3. Try cached yesterday's results
        dataToRender = getFromLocalStorage(LOCAL_STORAGE_YESTERDAY_KEY);
        if (dataToRender && dataToRender.results && dataToRender.results.length) {
          isFallbackRender = true;
          console.log("Rendered cached yesterday's results.");
        } else {
          // 4. No cached yesterday's. Try fetching the specific hardcoded static file.
          const staticFilePath = '/2025-06-30-results.json'; // Hardcoded path
          console.log(`No cached yesterday's results, trying static file: ${staticFilePath}`);
          try {
            const responseStatic = await fetch(staticFilePath); // Use the hardcoded path
            if (responseStatic.ok) {
              const staticData = await responseStatic.json();
              if (staticData && staticData.results && staticData.results.length) {
                dataToRender = staticData;
                isFallbackRender = true;
                console.log("Rendered hardcoded static yesterday's results.");
                saveToLocalStorage(LOCAL_STORAGE_YESTERDAY_KEY, staticData); // Optionally cache it
              } else {
                console.warn(`Static file ${staticFilePath} loaded but contains NO results.`);
                // Explicit message if file loaded but data is empty
                resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Fallback file loaded but contains NO results.</span>`;
                return; // Exit as we've handled display
              }
            } else {
              console.warn(`Static file fetch failed for ${staticFilePath} with status: ${responseStatic.status}.`);
              // Explicit message for HTTP errors on static file
              resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Could not load fallback file: <b>${staticFilePath}</b> (HTTP ${responseStatic.status})</span>`;
              return; // Exit as we've handled display
            }
          } catch (staticFileError) {
            console.error(`Error fetching static file ${staticFilePath}:`, staticFileError);
            // Explicit message for network/parsing errors on static file
            resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Error fetching fallback file: ${staticFileError.message || staticFileError}</span>`;
            return; // Exit as we've handled display
          }
        }
      }
    }
  } catch (error) {
    // This catch block handles critical network errors or unhandled JSON parsing errors
    console.error("Critical error during initial fetch or processing:", error);
    console.log("Attempting fallback due to critical error: checking local cache for today.");
    dataToRender = getFromLocalStorage(LOCAL_STORAGE_TODAY_KEY);
    if (dataToRender && dataToRender.results && dataToRender.results.length) {
      console.log("Rendered cached today's results after critical error.");
    } else {
      console.log("No cached today's results, checking local cache for yesterday.");
      dataToRender = getFromLocalStorage(LOCAL_STORAGE_YESTERDAY_KEY);
      if (dataToRender && dataToRender.results && dataToRender.results.length) {
        isFallbackRender = true;
        console.log("Rendered cached yesterday's results after critical error.");
      } else {
        // Last resort: try the hardcoded static file again in case the initial error prevented it.
        const staticFilePath = '/2025-06-30-results.json';
        console.log(`No cached yesterday's results, trying static file ${staticFilePath} as last resort after critical error.`);
        try {
          const responseStatic = await fetch(staticFilePath);
          if (responseStatic.ok) {
            const staticData = await responseStatic.json();
            if (staticData && staticData.results && staticData.results.length) {
              dataToRender = staticData;
              isFallbackRender = true;
              console.log("Rendered hardcoded static yesterday's results after critical error.");
              saveToLocalStorage(LOCAL_STORAGE_YESTERDAY_KEY, staticData);
            } else {
              console.warn(`Static file ${staticFilePath} loaded but contains NO results after critical error.`);
              resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Fallback file loaded but contains NO results after critical error.</span>`;
              return;
            }
          } else {
            console.warn(`Static file fetch failed for ${staticFilePath} with status: ${responseStatic.status} after critical error.`);
            resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Could not load fallback file: <b>${staticFilePath}</b> (HTTP ${responseStatic.status}) after critical error.</span>`;
            return;
          }
        } catch (staticFileError) {
          console.error(`Error fetching static file ${staticFilePath} during critical fallback:`, staticFileError);
          resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + `<span style="color:#ff5858">Error fetching fallback file: ${staticFileError.message || staticFileError} after critical error.</span>`;
          return;
        }
      }
    }
  } finally {
    // If no data was found or explicitly rendered by an error path, display default message
    if (!dataToRender || !dataToRender.results || !dataToRender.results.length) {
        console.log("No data found to render. Displaying generic 'No results yet' message.");
        resultsDiv.innerHTML = (isFallbackRender ? `<div class="fallback-banner">Showing <b>yesterday's</b> results (today’s results not yet available).</div>` : '') + '<p>No results yet. Please check back later.</p>';
    } else {
        // If data was found and not explicitly rendered by an error message, render it now.
        // This prevents double rendering if an early error path already set innerHTML.
        if (!resultsDiv.innerHTML.includes('<span style="color:#ff5858">')) { // Simple check to avoid overwriting error messages
            renderResults(dataToRender, isFallbackRender);
        }
    }
  }
}

// Call the main function to load results when the script runs
loadResults();