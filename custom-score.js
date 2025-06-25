console.log('custom-score.js loaded');

// --- Instructions toggle logic ---
const toggleBtn = document.getElementById('toggleHowTo');
const howToSection = document.getElementById('howToSection');
if (toggleBtn && howToSection) {
  toggleBtn.addEventListener('click', function () {
    if (howToSection.classList.contains('hidden')) {
      howToSection.classList.remove('hidden');
      toggleBtn.textContent = "Hide Instructions ▲";
    } else {
      howToSection.classList.add('hidden');
      toggleBtn.textContent = "Show Instructions ▼";
    }
  });
}

// --- Grabbing references ---
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
const raceSelector = document.getElementById('raceSelector');
const showResultsBtn = document.getElementById('showResultsBtn'); // <- ADD THIS BUTTON IN YOUR HTML
let currentSelectedRace = null;
let selectedPresetName = "Default";

// --- Weight presets ---
const weightPresets = {
  "Default": {
      rprWeight: 0.0, tsWeight: 0.0, orWeight: 0.0, winsWeight: 0.0, placesWeight: 0.0,
      lastRunPenaltyWeight: 0.0, lastRunBonusWeight: 0.0, trainerPercentWeight: 0.0, trainerWinsWeight: 0.0,
      trainerBonusValue: 0.0, layoffPenaltyValue: 0.0, courseFormWeight: 0.0
  },
  "Speed Focus": {
      rprWeight: 4.0, tsWeight: 2.5, orWeight: 1.0, winsWeight: 2.0, placesWeight: 1.0,
      lastRunPenaltyWeight: -0.5, lastRunBonusWeight: 0.4, trainerPercentWeight: 0.8, trainerWinsWeight: 1.2,
      trainerBonusValue: 0.5, layoffPenaltyValue: -2.0, courseFormWeight: 1.0
  },
  "Form Focus": {
      rprWeight: 1.5, tsWeight: 0.6, orWeight: 0.4, winsWeight: 8.0, placesWeight: 5.0,
      lastRunPenaltyWeight: -0.2, lastRunBonusWeight: 0.2, trainerPercentWeight: 3.0, trainerWinsWeight: 4.0,
      trainerBonusValue: 2.0, layoffPenaltyValue: -8.0, courseFormWeight: 2.0
  },
  "Trainer Focus": {
      rprWeight: 1.0, tsWeight: 0.6, orWeight: 0.2, winsWeight: 2.0, placesWeight: 1.0,
      lastRunPenaltyWeight: -0.2, lastRunBonusWeight: 0.2, trainerPercentWeight: 4.0, trainerWinsWeight: 4.0,
      trainerBonusValue: 4.0, layoffPenaltyValue: -2.0, courseFormWeight: 0.6
  },
  "Outsider Value": {
      rprWeight: 2.5, tsWeight: 2.0, orWeight: 2.0, winsWeight: 1.0, placesWeight: 1.5,
      lastRunPenaltyWeight: -0.2, lastRunBonusWeight: 0.3, trainerPercentWeight: 1.4, trainerWinsWeight: 1.8,
      trainerBonusValue: 0.6, layoffPenaltyValue: -1.0, courseFormWeight: 1.4
  },
  "Consistency Focus": {
      rprWeight: 1.4, tsWeight: 1.0, orWeight: 0.8, winsWeight: 3.0, placesWeight: 6.0,
      lastRunPenaltyWeight: -0.3, lastRunBonusWeight: 0.5, trainerPercentWeight: 2.0, trainerWinsWeight: 2.0,
      trainerBonusValue: 1.5, layoffPenaltyValue: -4.0, courseFormWeight: 2.5
  }
};

// --- Helper for current weights ---
function getCurrentWeights() {
  return {
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
  }
}

// --- Event logging stub (replace with analytics/your own system) ---
function logEvent(action, details) {
  // If you want Google Analytics: gtag('event', action, details);
  // Otherwise POST to your server here
  console.log('EVENT LOGGED:', action, details);
}

// --- Main render function (same as before) ---
function renderCustomScoredRunners() {
  if (!currentSelectedRace) {
    customRunnersListDiv.innerHTML = '<p class="error-message">No race data available. Please select a race.</p>';
    currentRaceDisplay.textContent = '';
    currentRaceDetails.textContent = '';
    return;
  }
  currentRaceDisplay.textContent = `${currentSelectedRace.course} ${currentSelectedRace.off_time}`;
  currentRaceDetails.textContent = `${currentSelectedRace.race_name} • ${currentSelectedRace.distance} • ${currentSelectedRace.going}`;

  const currentWeights = getCurrentWeights();

  const runnersToProcess = JSON.parse(JSON.stringify(currentSelectedRace.runners));
  runnersToProcess.forEach(r => {
    r.customScore = calculateCustomScore(r, currentWeights);
  });
  const nonRunners = runnersToProcess.filter(isNonRunner);
  let activeRunners = runnersToProcess.filter(r => !isNonRunner(r));
  if (areAllWeightsZero()) {
    activeRunners.sort((a, b) => {
      const oddsA = fractionToDecimalOdds(a.odds?.[0]?.fractional);
      const oddsB = fractionToDecimalOdds(b.odds?.[0]?.fractional);
      return oddsA - oddsB;
    });
  } else {
    activeRunners.sort((a, b) => (b.customScore ?? -Infinity) - (a.customScore ?? -Infinity));
  }
  const sortedRunners = [...activeRunners, ...nonRunners];
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

  document.querySelectorAll('.runner-more-btn').forEach(button => {
    button.addEventListener('click', function (e) {
      const card = e.target.closest('.runner-card');
      if (card) {
        card.classList.toggle('expanded');
        e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
      }
    });
  });
}

// --- Utility functions ---

function calculateCustomScore(r, weights) {
  const rpr = Number.parseInt(r.rpr) || 0;
  const ts = Number.parseInt(r.ts) || Number.parseInt(r.tsr) || 0;
  const or = Number.parseInt(r.ofr) || 0;
  const lastRun = Number.parseInt(r.last_run);
  const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99;
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
      wins = (r.form.match(/1/g) || []).length;
      places = (r.form.match(/[23]/g) || []).length;
  }
  const trainerPercent = Number.parseFloat(r.trainer_14_days?.percent) || 0;
  const trainerWins = Number.parseInt(r.trainer_14_days?.wins) || 0;
  const courseFormWins = (r.course_form?.match(/1/g) || []).length;

  let score = 0;
  score += weights.rprWeight * rpr;
  score += weights.tsWeight * ts;
  score += weights.orWeight * or;
  score += weights.winsWeight * wins;
  score += weights.placesWeight * places;

  if (lastRunVal > 50) {
      score += (lastRunVal - 50) * weights.lastRunPenaltyWeight;
  } else if (lastRunVal <= 50) {
      score += (50 - lastRunVal) * weights.lastRunBonusWeight;
  }
  score += weights.trainerPercentWeight * trainerPercent;
  score += weights.trainerWinsWeight * trainerWins;
  score += (trainerPercent >= 20 ? weights.trainerBonusValue : 0);
  score += (wins === 0 && lastRunVal > 50) ? weights.layoffPenaltyValue : 0;
  score += weights.courseFormWeight * courseFormWins;
  if (score < -12) score = -12 + (score + 12) * 0.4;
  if (!Number.isFinite(score)) score = 0;
  return Math.round(score * 100) / 100;
}

function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

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

function renderRunnerMore(r) {
  // (same as before)
  // ... [omitted for brevity, copy from your code]
}

function areAllWeightsZero() {
  const currentWeights = getCurrentWeights();
  for (const key in weightPresets.Default) {
    if (Math.abs(currentWeights[key] - weightPresets.Default[key]) > 0.001) {
      return false;
    }
  }
  return true;
}

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

// --- UI Setup: sliders just update value number, but DO NOT show results immediately ---
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
    if (!input) return;
    input.addEventListener('input', () => {
        sliderValueSpans[input.id].textContent = parseFloat(input.value).toFixed(input.step === '0.1' ? 1 : 2);
        // NO auto results!
    });
});

// --- Preset buttons ---
document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        const presetWeights = weightPresets[presetName];
        if (presetWeights) {
            selectedPresetName = presetName;
            updateSliderValues(presetWeights);
            customRunnersListDiv.innerHTML = '<p class="info-message">Adjust weights and press <b>Show Results</b> to view the sorted runners.</p>';
        }
    });
});

// --- Race selector ---
if (raceSelector) {
  raceSelector.addEventListener('change', () => {
    const allRaces = window.racecardsData?.racecards;
    if (allRaces) {
        const selectedRaceId = raceSelector.value;
        currentSelectedRace = allRaces.find(r => r._id === selectedRaceId);
        customRunnersListDiv.innerHTML = '<p class="info-message">Adjust weights and press <b>Show Results</b> to view the sorted runners.</p>';
        currentRaceDisplay.textContent = '';
        currentRaceDetails.textContent = '';
    }
  });
}

// --- Show Results button (main trigger) ---
if (showResultsBtn) {
  showResultsBtn.addEventListener('click', () => {
      renderCustomScoredRunners();

      // LOG USAGE:
      logEvent('show_results', {
        event_category: 'Custom Scoring',
        event_label: raceSelector.value,
        weights: JSON.stringify(getCurrentWeights()),
        preset: selectedPresetName
      });
  });
}

// --- Populate races ---
function populateRaceDropdown() {
  const allRaces = window.racecardsData?.racecards;
  if (!allRaces || allRaces.length === 0) {
    raceSelector.innerHTML = '<option value="">No races available</option>';
    raceSelector.disabled = true;
    return;
  }
  allRaces.sort((a, b) => {
    const dateA = new Date(a.off_dt);
    const dateB = new Date(b.off_dt);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    const timeA = a.off_time.split(':').map(Number);
    const timeB = b.off_time.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });
  raceSelector.innerHTML = '';
  allRaces.forEach((race) => {
    const option = document.createElement('option');
    option.value = race._id;
    option.textContent = `${race.course} - ${race.off_time} (${race.race_name})`;
    raceSelector.appendChild(option);
  });
  currentSelectedRace = allRaces[0];
  if (currentSelectedRace) {
    raceSelector.value = currentSelectedRace._id;
  } else {
    raceSelector.disabled = true;
  }
}

// --- INITIAL SETUP ---
if (window.racecardsData && window.racecardsData.racecards && window.racecardsData.racecards.length > 0) {
    populateRaceDropdown();
    updateSliderValues(weightPresets.Default);
    customRunnersListDiv.innerHTML = '<p class="info-message">Adjust weights and press <b>Show Results</b> to view the sorted runners.</p>';
} else {
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
