console.log('custom-score.js loaded');

// Get references to HTML elements for sliders and their values
const rprWeightInput = document.getElementById('rprWeight');
const tsWeightInput = document.getElementById('tsWeight');
const orWeightInput = document.getElementById('orWeight');
const winsWeightInput = document.getElementById('winsWeight');
const placesWeightInput = document.getElementById('placesWeight');
const lastRunPenaltyWeightInput = document.getElementById('lastRunPenaltyWeight');
const lastRunBonusWeightInput = document.getElementById('lastRunBonusWeight');
const trainerPercentWeightInput = document.getElementById('trainerPercentWeight');
const trainerWinsWeightInput = document.getElementById('trainerWinsWeight');
const trainerBonusValueInput = document.getElementById('trainerBonusValue');
const layoffPenaltyValueInput = document.getElementById('layoffPenaltyValue');
const courseFormWeightInput = document.getElementById('courseFormWeight');

const rprWeightValue = document.getElementById('rprWeightValue');
const tsWeightValue = document.getElementById('tsWeightValue');
const orWeightValue = document.getElementById('orWeightValue');
const winsWeightValue = document.getElementById('winsWeightValue');
const placesWeightValue = document.getElementById('placesWeightValue');
const lastRunPenaltyWeightValue = document.getElementById('lastRunPenaltyWeightValue');
const lastRunBonusWeightValue = document.getElementById('lastRunBonusWeightValue');
const trainerPercentWeightValue = document.getElementById('trainerPercentWeightValue');
const trainerWinsWeightValue = document.getElementById('trainerWinsWeightValue');
const trainerBonusValueDisplay = document.getElementById('trainerBonusValueDisplay');
const layoffPenaltyValueDisplay = document.getElementById('layoffPenaltyValueDisplay');
const courseFormWeightValue = document.getElementById('courseFormWeightValue');

const customRunnersListDiv = document.getElementById('customRunnersList');
const currentRaceDisplay = document.getElementById('currentRaceDisplay');
const currentRaceDetails = document.getElementById('currentRaceDetails');

// Race selection elements
const raceSelector = document.getElementById('raceSelector');
let currentSelectedRace = null;

// Define weight presets with expanded ranges for greater impact
const weightPresets = {
    "Default": {
        rprWeight: 0.0,
        tsWeight: 0.0,
        orWeight: 0.0,
        winsWeight: 0.0,
        placesWeight: 0.0,
        lastRunPenaltyWeight: 0.0,
        lastRunBonusWeight: 0.0,
        trainerPercentWeight: 0.0,
        trainerWinsWeight: 0.0,
        trainerBonusValue: 0.0,
        layoffPenaltyValue: 0.0,
        courseFormWeight: 0.0
    },
    "Speed Focus": {
        rprWeight: 4.0, // Increased from 2.5
        tsWeight: 2.5,  // Increased from 1.5
        orWeight: 1.0,  // Increased from 0.5
        winsWeight: 2.0, // Increased from 1.0
        placesWeight: 1.0, // Increased from 0.5
        lastRunPenaltyWeight: -0.5, // Increased penalty from -0.25
        lastRunBonusWeight: 0.4, // Increased bonus from 0.2
        trainerPercentWeight: 0.8, // Increased from 0.4
        trainerWinsWeight: 1.2, // Increased from 0.6
        trainerBonusValue: 0.5, // Increased from 0.2
        layoffPenaltyValue: -2.0, // Increased penalty from -1.0
        courseFormWeight: 1.0 // Increased from 0.5
    },
    "Form Focus": {
        rprWeight: 1.5, // Increased from 0.8
        tsWeight: 0.6, // Increased from 0.3
        orWeight: 0.4, // Increased from 0.2
        winsWeight: 8.0, // SIGNIFICANTLY Increased from 4.0
        placesWeight: 5.0, // SIGNIFICANTLY Increased from 2.5
        lastRunPenaltyWeight: -0.2, // Increased penalty from -0.1
        lastRunBonusWeight: 0.2, // Increased from 0.1
        trainerPercentWeight: 3.0, // Increased from 1.5
        trainerWinsWeight: 4.0, // Increased from 2.0
        trainerBonusValue: 2.0, // Increased from 1.0
        layoffPenaltyValue: -8.0, // SIGNIFICANTLY Increased penalty from -4.0
        courseFormWeight: 2.0 // Increased from 1.0
    },
    "Trainer Focus": {
        rprWeight: 1.0, // Increased from 0.5
        tsWeight: 0.6, // Increased from 0.3
        orWeight: 0.2, // Increased from 0.1
        winsWeight: 2.0, // Increased from 1.0
        placesWeight: 1.0, // Increased from 0.5
        lastRunPenaltyWeight: -0.2, // Increased penalty from -0.1
        lastRunBonusWeight: 0.2, // Increased from 0.1
        trainerPercentWeight: 4.0, // Increased from 2.5
        trainerWinsWeight: 4.0, // Increased from 2.5
        trainerBonusValue: 4.0, // Increased from 2.0
        layoffPenaltyValue: -2.0, // Increased penalty from -1.0
        courseFormWeight: 0.6 // Increased from 0.3
    },
    "Outsider Value": {
        rprWeight: 2.5, // Increased from 1.5
        tsWeight: 2.0, // Increased from 1.0
        orWeight: 2.0, // Increased from 1.0
        winsWeight: 1.0, // Increased from 0.5
        placesWeight: 1.5, // Increased from 0.8
        lastRunPenaltyWeight: -0.2, // Increased penalty from -0.1
        lastRunBonusWeight: 0.3, // Increased from 0.15
        trainerPercentWeight: 1.4, // Increased from 0.7
        trainerWinsWeight: 1.8, // Increased from 0.9
        trainerBonusValue: 0.6, // Increased from 0.3
        layoffPenaltyValue: -1.0, // Increased penalty from -0.5
        courseFormWeight: 1.4 // Increased from 0.7
    },
    "Consistency Focus": {
        rprWeight: 1.4, // Increased from 0.7
        tsWeight: 1.0, // Increased from 0.5
        orWeight: 0.8, // Increased from 0.4
        winsWeight: 3.0, // Increased from 1.5
        placesWeight: 6.0, // Increased from 3.0
        lastRunPenaltyWeight: -0.3, // Increased penalty from -0.15
        lastRunBonusWeight: 0.5, // Increased from 0.25
        trainerPercentWeight: 2.0, // Increased from 1.0
        trainerWinsWeight: 2.0, // Increased from 1.0
        trainerBonusValue: 1.5, // Increased from 0.7
        layoffPenaltyValue: -4.0, // Increased penalty from -2.0
        courseFormWeight: 2.5 // Increased from 1.2
    }
};


/**
 * Calculates a custom score for a given runner based on dynamic weights.
 * @param {object} r - The runner object.
 * @param {object} weights - The current set of weights from sliders or presets.
 * @returns {number} The calculated custom score, rounded to two decimal places.
 */
function calculateCustomScore(r, weights) {
    // Debugging: Log the horse name and raw data for key properties
    console.log(`--- Calculating score for: ${r.horse || 'Unknown Horse'} (ID: ${r.horse_id || 'N/A'}) ---`);
    console.log('Raw data for horse:', r);

    // Ensure these are numbers, defaulting to 0 if not present or invalid
    const rpr = Number.parseInt(r.rpr) || 0;
    const ts = Number.parseInt(r.ts) || Number.parseInt(r.tsr) || 0; // Check both 'ts' and 'tsr'
    const or = Number.parseInt(r.ofr) || 0;
    const lastRun = Number.parseInt(r.last_run);
    const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99; // Default to 99 if missing/invalid

    let wins = 0, places = 0;
    if (typeof r.form === 'string') {
        wins = (r.form.match(/1/g) || []).length;
        places = (r.form.match(/[23]/g) || []).length;
    }

    const trainerPercent = Number.parseFloat(r.trainer_14_days?.percent) || 0;
    const trainerWins = Number.parseInt(r.trainer_14_days?.wins) || 0;

    // Assuming 'course_form' exists and is a string like 'form' (e.g., "1-2")
    const courseFormWins = (r.course_form?.match(/1/g) || []).length;

    // Debugging: Log the parsed values *before* multiplication
    console.log(`  Parsed values: RPR=${rpr}, TS=${ts}, OR=${or}, Wins=${wins}, Places=${places}, LastRunDays=${lastRunVal}`);
    console.log(`  Trainer 14d: Percent=${trainerPercent}, Wins=${trainerWins}`);
    console.log(`  Course Form Wins: ${courseFormWins}`);
    console.log('  Current weights:', weights);

    let score = 0;
    score += weights.rprWeight * rpr;
    score += weights.tsWeight * ts;
    score += weights.orWeight * or;
    score += weights.winsWeight * wins;
    score += weights.placesWeight * places;

    // Apply last run penalty/bonus based on days since last run
    if (lastRunVal > 50) {
        score += (lastRunVal - 50) * weights.lastRunPenaltyWeight;
    } else if (lastRunVal <= 50) { // Apply bonus for runs within 50 days (can be adjusted)
        score += (50 - lastRunVal) * weights.lastRunBonusWeight;
    }

    score += weights.trainerPercentWeight * trainerPercent;
    score += weights.trainerWinsWeight * trainerWins;
    // Apply trainer bonus if their recent win percentage is high (20% or more)
    score += (trainerPercent >= 20 ? weights.trainerBonusValue : 0);
    // Apply layoff penalty if no wins AND a significant layoff (over 50 days)
    score += (wins === 0 && lastRunVal > 50) ? weights.layoffPenaltyValue : 0;
    score += weights.courseFormWeight * courseFormWins;

    // Clamp score to prevent extreme negative values, or ensure it's finite
    // The clamping here ensures scores don't go too far negative, allowing for more distinct separation.
    if (score < -12) score = -12 + (score + 12) * 0.4;
    if (!Number.isFinite(score)) score = 0;

    // Debugging: Log the final calculated score
    console.log(`  Final Score for ${r.horse || 'Unknown Horse'}: ${Math.round(score * 100) / 100}`);
    console.log('----------------------------------------------------');

    return Math.round(score * 100) / 100;
}

/**
 * Checks if a runner is a non-runner.
 * @param {object} r - The runner object.
 * @returns {boolean} True if the runner is a non-runner, false otherwise.
 */
function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

/**
 * Converts fractional odds string (e.g., "7/4") to a decimal number.
 * @param {string} fraction - The fractional odds string.
 * @returns {number} The decimal odds, or Infinity if invalid.
 */
function fractionToDecimalOdds(fraction) {
    if (!fraction || typeof fraction !== 'string') return Infinity;
    const parts = fraction.split('/');
    if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (denominator !== 0 && Number.isFinite(numerator) && Number.isFinite(denominator)) {
            return (numerator / denominator) + 1;
        }
    }
    const decimalValue = parseFloat(fraction);
    if (Number.isFinite(decimalValue)) {
        return decimalValue;
    }
    return Infinity;
}


/**
 * Renders the detailed "More Info" section content for a single runner.
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


/**
 * Populates the race selection dropdown with available races sorted by time.
 */
function populateRaceDropdown() {
    const allRaces = window.racecardsData?.racecards; // Use optional chaining
    if (!allRaces || allRaces.length === 0) {
        raceSelector.innerHTML = '<option value="">No races available</option>';
        raceSelector.disabled = true;
        console.warn('custom-score.js: No racecardsData found or it is empty.');
        return;
    }

    // Sort races by date and time to ensure a logical order in the dropdown
    allRaces.sort((a, b) => {
        const dateA = new Date(a.off_dt);
        const dateB = new Date(b.off_dt);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
        }
        // If dates are the same, sort by time (e.g., "14:30")
        const timeA = a.off_time.split(':').map(Number);
        const timeB = b.off_time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    raceSelector.innerHTML = ''; // Clear existing options
    allRaces.forEach((race) => {
        const option = document.createElement('option');
        option.value = race._id; // Use unique race ID as value
        option.textContent = `${race.course} - ${race.off_time} (${race.race_name})`;
        raceSelector.appendChild(option);
    });

    // Set the current selected race to the first one in the sorted list
    currentSelectedRace = allRaces[0];
    if (currentSelectedRace) {
        raceSelector.value = currentSelectedRace._id; // Set dropdown to match
        console.log('custom-score.js: Initial race selected:', currentSelectedRace.race_name);
    } else {
        raceSelector.disabled = true;
        console.warn('custom-score.js: No races available to set as initial selected race.');
    }
}

/**
 * Updates the values of all range sliders and their corresponding display spans.
 * @param {object} weights - An object containing the weights for each scoring factor.
 */
function updateSliderValues(weights) {
    rprWeightInput.value = weights.rprWeight;
    rprWeightValue.textContent = weights.rprWeight.toFixed(2);
    tsWeightInput.value = weights.tsWeight;
    tsWeightValue.textContent = weights.tsWeight.toFixed(2);
    orWeightInput.value = weights.orWeight;
    orWeightValue.textContent = weights.orWeight.toFixed(2);
    winsWeightInput.value = weights.winsWeight;
    winsWeightValue.textContent = weights.winsWeight.toFixed(2);
    placesWeightInput.value = weights.placesWeight;
    placesWeightValue.textContent = weights.placesWeight.toFixed(2);
    lastRunPenaltyWeightInput.value = weights.lastRunPenaltyWeight;
    lastRunPenaltyWeightValue.textContent = weights.lastRunPenaltyWeight.toFixed(2);
    lastRunBonusWeightInput.value = weights.lastRunBonusWeight;
    lastRunBonusWeightValue.textContent = weights.lastRunBonusWeight.toFixed(2);
    trainerPercentWeightInput.value = weights.trainerPercentWeight;
    trainerPercentWeightValue.textContent = weights.trainerPercentWeight.toFixed(2);
    trainerWinsWeightInput.value = weights.trainerWinsWeight;
    trainerWinsWeightValue.textContent = weights.trainerWinsWeight.toFixed(2);
    trainerBonusValueInput.value = weights.trainerBonusValue;
    trainerBonusValueDisplay.textContent = weights.trainerBonusValue.toFixed(1);
    layoffPenaltyValueInput.value = weights.layoffPenaltyValue;
    layoffPenaltyValueDisplay.textContent = weights.layoffPenaltyValue.toFixed(1);
    courseFormWeightInput.value = weights.courseFormWeight;
    courseFormWeightValue.textContent = weights.courseFormWeight.toFixed(2);
}

/**
 * Checks if all current slider weights are effectively zero (matching the "Default" preset).
 * @returns {boolean} True if all weights are zero, false otherwise.
 */
function areAllWeightsZero() {
    const currentWeights = {
        rprWeight: parseFloat(rprWeightInput.value),
        tsWeight: parseFloat(tsWeightInput.value),
        orWeight: parseFloat(orWeightInput.value),
        winsWeight: parseFloat(winsWeightInput.value),
        placesWeight: parseFloat(placesWeightInput.value),
        lastRunPenaltyWeight: parseFloat(lastRunPenaltyWeightInput.value),
        lastRunBonusWeight: parseFloat(lastRunBonusWeightInput.value),
        trainerPercentWeight: parseFloat(trainerPercentWeightInput.value),
        trainerWinsWeight: parseFloat(trainerWinsWeightInput.value),
        trainerBonusValue: parseFloat(trainerBonusValueInput.value),
        layoffPenaltyValue: parseFloat(layoffPenaltyValueInput.value),
        courseFormWeight: parseFloat(courseFormWeightInput.value)
    };

    // Compare with the Default preset's weights
    for (const key in weightPresets.Default) {
        if (Math.abs(currentWeights[key] - weightPresets.Default[key]) > 0.001) { // Use a small epsilon for float comparison
            return false;
        }
    }
    return true;
}


/**
 * Renders the list of runners for the currently selected race with their custom scores.
 * Sorts runners by custom score (or by odds if all weights are zero/default).
 */
function renderCustomScoredRunners() {
    if (!currentSelectedRace) {
        customRunnersListDiv.innerHTML = '<p class="error-message">No race data available. Please select a race.</p>';
        currentRaceDisplay.textContent = '';
        currentRaceDetails.textContent = '';
        console.warn('custom-score.js: No currentSelectedRace to render.');
        return;
    }

    currentRaceDisplay.textContent = `${currentSelectedRace.course} ${currentSelectedRace.off_time}`;
    currentRaceDetails.textContent = `${currentSelectedRace.race_name} • ${currentSelectedRace.distance} • ${currentSelectedRace.going}`;

    // Get current weights from the sliders
    const currentWeights = {
        rprWeight: parseFloat(rprWeightInput.value),
        tsWeight: parseFloat(tsWeightInput.value),
        orWeight: parseFloat(orWeightInput.value),
        winsWeight: parseFloat(winsWeightInput.value),
        placesWeight: parseFloat(placesWeightInput.value),
        lastRunPenaltyWeight: parseFloat(lastRunPenaltyWeightInput.value),
        lastRunBonusWeight: parseFloat(lastRunBonusWeightInput.value),
        trainerPercentWeight: parseFloat(trainerPercentWeightInput.value),
        trainerWinsWeight: parseFloat(trainerWinsWeightInput.value),
        trainerBonusValue: parseFloat(trainerBonusValueInput.value),
        layoffPenaltyValue: parseFloat(layoffPenaltyValueInput.value),
        courseFormWeight: parseFloat(courseFormWeightInput.value)
    };

    // Deep copy runners to avoid modifying the original global data object
    const runnersToProcess = JSON.parse(JSON.stringify(currentSelectedRace.runners));

    // Calculate custom score for each runner
    runnersToProcess.forEach(r => {
        r.customScore = calculateCustomScore(r, currentWeights);
    });

    const nonRunners = runnersToProcess.filter(isNonRunner);
    let activeRunners = runnersToProcess.filter(r => !isNonRunner(r));

    // Sort active runners based on weights or odds
    if (areAllWeightsZero()) {
        // If all weights are zero, sort by odds (lowest odds first)
        activeRunners.sort((a, b) => {
            const oddsA = fractionToDecimalOdds(a.odds?.[0]?.fractional);
            const oddsB = fractionToDecimalOdds(b.odds?.[0]?.fractional);
            return oddsA - oddsB;
        });
        console.log('custom-score.js: Sorting active runners by odds (default behavior).');
    } else {
        // Otherwise, sort by custom score (highest score first)
        activeRunners.sort((a, b) => (b.customScore ?? -Infinity) - (a.customScore ?? -Infinity));
        console.log('custom-score.js: Sorting active runners by custom score.');
    }

    // Combine active runners and non-runners (non-runners at the bottom)
    const sortedRunners = [...activeRunners, ...nonRunners];

    // Render the runners list HTML
    customRunnersListDiv.innerHTML = sortedRunners.map((r, i) => `
        <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}" data-index="${i}">
            <div class="runner-num-draw">
                <span class="runner-num">${r.number || i+1}</span>
                <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
                <span class="runner-score">${typeof r.customScore === 'number' ? r.customScore.toFixed(2) : ''}</span>
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
    `).join('');

    // Attach event listeners for "More info" buttons after content is rendered
    document.querySelectorAll('.runner-more-btn').forEach(button => {
        // Remove existing listeners to prevent duplicates if render runs multiple times
        button.removeEventListener('click', toggleMoreInfo);
        // Add new listener
        button.addEventListener('click', toggleMoreInfo);
    });
    console.log('custom-score.js: Runners rendered and more info buttons attached.');
}

/**
 * Toggles the visibility of the "More info" section within a runner card.
 * @param {Event} e - The click event object from the "More info" button.
 */
function toggleMoreInfo(e) {
    console.log("More info button clicked!");
    const card = e.target.closest('.runner-card'); // Find the parent runner card
    if (card) {
        card.classList.toggle('expanded'); // Toggle the 'expanded' class
        // Update button text and arrow
        if (card.classList.contains('expanded')) {
            e.target.textContent = 'Less info ▲';
            console.log("Card expanded.");
        } else {
            e.target.textContent = 'More info ▼';
            console.log("Card collapsed.");
        }
    } else {
        console.error("Could not find .runner-card parent for the clicked button.");
    }
}

// --- Event Listeners for Sliders ---
// Attach input event listeners to all slider inputs to update value display and re-render runners
const sliderInputs = [
    rprWeightInput, tsWeightInput, orWeightInput, winsWeightInput, placesWeightInput,
    lastRunPenaltyWeightInput, lastRunBonusWeightInput, trainerPercentWeightInput,
    trainerWinsWeightInput, trainerBonusValueInput, layoffPenaltyValueInput, courseFormWeightInput
];
const sliderValueSpans = {
    rprWeight: rprWeightValue, tsWeight: tsWeightValue, orWeight: orWeightValue,
    winsWeight: winsWeightValue, placesWeight: placesWeightValue,
    lastRunPenaltyWeight: lastRunPenaltyWeightValue, lastRunBonusWeight: lastRunBonusWeightValue,
    trainerPercentWeight: trainerPercentWeightValue, trainerWinsWeight: trainerWinsWeightValue,
    trainerBonusValue: trainerBonusValueDisplay, layoffPenaltyValue: layoffPenaltyValueDisplay,
    courseFormWeight: courseFormWeightValue
};

sliderInputs.forEach(input => {
    input.addEventListener('input', () => {
        // Update the corresponding span with the current slider value
        sliderValueSpans[input.id].textContent = parseFloat(input.value).toFixed(input.step === '0.1' ? 1 : 2);
        renderCustomScoredRunners(); // Re-render runners with new weights
    });
});


// --- Event listener for Race Selection Change ---
raceSelector.addEventListener('change', () => {
    const allRaces = window.racecardsData?.racecards;
    if (allRaces) {
        const selectedRaceId = raceSelector.value;
        currentSelectedRace = allRaces.find(r => r._id === selectedRaceId);
        renderCustomScoredRunners();
        // Scroll to the race header for better UX
        const targetElement = document.querySelector('.custom-race-header');
        if (targetElement) {
                // Ensure the element is scrolled into view, accounting for the fixed navbar.
                // The 'block: "start"' option scrolls the element to the top of the visible area.
                // You might need to adjust `scroll-margin-top` CSS property on `.custom-race-header`
                // if the navbar is still obscuring the title after scrolling.
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        console.error('custom-score.js: Race data not available for selection change.');
    }
});

// --- Event Listeners for Preset Buttons ---
document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        const presetWeights = weightPresets[presetName];
        if (presetWeights) {
            updateSliderValues(presetWeights); // Apply preset weights to sliders
            renderCustomScoredRunners(); // Re-render runners with new preset weights
            // Scroll to the race header for better UX
            const targetElement = document.querySelector('.custom-race-header');
            if (targetElement) {
                // Ensure the element is scrolled into view, accounting for the fixed navbar.
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            console.error('custom-score.js: Preset weights not found for:', presetName);
        }
    });
});

// --- Initial setup when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('custom-score.js: DOMContentLoaded event fired. Initial setup starting.');
    // Ensure racecardsData is loaded before attempting to populate dropdown
    if (window.racecardsData && window.racecardsData.racecards && window.racecardsData.racecards.length > 0) {
        populateRaceDropdown(); // Populate dropdown with available races
        // Set initial selected race (already handled by populateRaceDropdown picking the first)
        // Apply default weights and render runners
        updateSliderValues(weightPresets.Default);
        renderCustomScoredRunners();
    } else {
        console.error('custom-score.js: window.racecardsData is not available or empty on DOMContentLoaded. Cannot initialize page.');
        // Display a user-friendly message if data is missing
        const mainContent = document.querySelector('main.container');
        if (mainContent) {
            mainContent.innerHTML = `
                <h1 class="page-title">Custom Race Scoring</h1>
                <p class="error-message" style="text-align: center; color: #e55; font-size: 1.1em;">
                    Error: Race data could not be loaded. Please ensure 'data.js' is correct and accessible.
                </p>
                <div class="race-selector-container">
                    <label for="raceSelector">Select a Race:</label>
                    <select id="raceSelector" class="race-selector-dropdown" disabled>
                        <option value="">No races available</option>
                    </select>
                </div>
            `;
        }
    }
    console.log('custom-score.js finished initial DOMContentLoaded setup.');
});
