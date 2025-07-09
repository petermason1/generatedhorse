console.log('custom-score.js loaded (score default mode)');

// --- DOM Refs ---
const raceSelector = document.getElementById('raceSelector');
const customRunnersListDiv = document.getElementById('customRunnersList');
const currentRaceDisplay = document.getElementById('currentRaceDisplay');
const currentRaceDetails = document.getElementById('currentRaceDetails');

// --- Weight Controls ---
const sliders = [
  'rprWeight', 'tsWeight', 'orWeight', 'winsWeight', 'placesWeight',
  'lastRunPenaltyWeight', 'lastRunBonusWeight', 'trainerPercentWeight',
  'trainerWinsWeight', 'trainerBonusValue', 'layoffPenaltyValue', 'courseFormWeight'
].reduce((acc, id) => { acc[id] = document.getElementById(id); return acc; }, {});

const sliderValues = [
  'rprWeightValue', 'tsWeightValue', 'orWeightValue', 'winsWeightValue', 'placesWeightValue',
  'lastRunPenaltyWeightValue', 'lastRunBonusWeightValue', 'trainerPercentWeightValue',
  'trainerWinsWeightValue', 'trainerBonusValueDisplay', 'layoffPenaltyValueDisplay', 'courseFormWeightValue'
].reduce((acc, id) => { acc[id] = document.getElementById(id); return acc; }, {});

// --- Preset weights ---
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

let selectedPresetName = "Default";
let currentSelectedRace = null;

// --- Helpers ---
function getCurrentWeights() {
  return {
    rprWeight: parseFloat(sliders.rprWeight.value),
    tsWeight: parseFloat(sliders.tsWeight.value),
    orWeight: parseFloat(sliders.orWeight.value),
    winsWeight: parseFloat(sliders.winsWeight.value),
    placesWeight: parseFloat(sliders.placesWeight.value),
    lastRunPenaltyWeight: parseFloat(sliders.lastRunPenaltyWeight.value),
    lastRunBonusWeight: parseFloat(sliders.lastRunBonusWeight.value),
    trainerPercentWeight: parseFloat(sliders.trainerPercentWeight.value),
    trainerWinsWeight: parseFloat(sliders.trainerWinsWeight.value),
    trainerBonusValue: parseFloat(sliders.trainerBonusValue.value),
    layoffPenaltyValue: parseFloat(sliders.layoffPenaltyValue.value),
    courseFormWeight: parseFloat(sliders.courseFormWeight.value)
  };
}
function allWeightsZero(weights) {
  return Object.values(weights).every(v => Math.abs(v) < 0.001);
}
function isNonRunner(r) {
  if (!r) return true;
  if (typeof r.form === 'string' && /\bNR\b/i.test(r.form)) return true;
  if (r.status && typeof r.status === 'string' && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}
function calculateCustomScore(r, weights) {
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run);
  const lastRunVal = Number.isFinite(lastRun) ? lastRun : 99;
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/[23]/g) || []).length;
  }
  const trainerPercent = parseFloat(r.trainer_14_days?.percent) || 0;
  const trainerWins = parseInt(r.trainer_14_days?.wins) || 0;
  const courseFormWins = (r.course_form?.match(/1/g) || []).length;

  let score = 0;
  score += weights.rprWeight * rpr;
  score += weights.tsWeight * ts;
  score += weights.orWeight * or;
  score += weights.winsWeight * wins;
  score += weights.placesWeight * places;
  if (lastRunVal > 50) score += (lastRunVal - 50) * weights.lastRunPenaltyWeight;
  else score += (50 - lastRunVal) * weights.lastRunBonusWeight;
  score += weights.trainerPercentWeight * trainerPercent;
  score += weights.trainerWinsWeight * trainerWins;
  score += (trainerPercent >= 20 ? weights.trainerBonusValue : 0);
  score += (wins === 0 && lastRunVal > 50) ? weights.layoffPenaltyValue : 0;
  score += weights.courseFormWeight * courseFormWins;
  if (score < -12) score = -12 + (score + 12) * 0.4;
  if (!Number.isFinite(score)) score = 0;
  return Math.round(score * 100) / 100;
}
function findRaceById(races, val) {
  return races.find(r =>
    (r._id && r._id.toString() === val) ||
    (r.race_id && r.race_id.toString() === val)
  );
}

// --- Runners view ---
function renderCustomScoredRunners(race, weights) {
  if (!race) {
    customRunnersListDiv.innerHTML = '<p>No race data. Please select a race.</p>';
    return;
  }
  currentRaceDisplay.textContent = `${race.course} ${race.off_time}`;
  currentRaceDetails.textContent = `${race.race_name} • ${race.distance} • ${race.going}`;

  // Clone to avoid mutating original
  const runners = race.runners ? race.runners.map(r => ({...r})) : [];

  runners.forEach(r => {
    if (allWeightsZero(weights)) {
      r.customScore = typeof r.score === 'number' ? r.score : 0;
    } else {
      r.customScore = calculateCustomScore(r, weights);
    }
  });

  const nonRunners = runners.filter(isNonRunner);
  let activeRunners = runners.filter(r => !isNonRunner(r));

  activeRunners.sort((a, b) => (b.customScore ?? -Infinity) - (a.customScore ?? -Infinity));
  const sorted = [...activeRunners, ...nonRunners];

  customRunnersListDiv.innerHTML = sorted.map((r, i) => `
    <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}">
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
      </div>
      <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
    </div>
  `).join('');
}

// --- Dropdown setup ---
function populateRaceDropdown(allRaces) {
  if (!allRaces || !allRaces.length) {
    raceSelector.innerHTML = '<option value="">No races available</option>';
    raceSelector.disabled = true;
    return;
  }
  raceSelector.innerHTML = '';
  allRaces.forEach(race => {
    const idVal = race._id || race.race_id;
    const opt = document.createElement('option');
    opt.value = idVal;
    opt.textContent = `${race.course} - ${race.off_time} (${race.race_name})`;
    raceSelector.appendChild(opt);
  });
  raceSelector.disabled = false;
}

function updateSlidersUI(weights) {
  for (const key in weights) {
    if (sliders[key]) sliders[key].value = weights[key];
    const spanId = key + 'Value';
    if (sliderValues[spanId]) sliderValues[spanId].textContent = (typeof weights[key] === 'number' ? weights[key].toFixed(2) : '');
  }
}

// --- SLIDERS: Live update as you move any slider ---
function setupSliderEvents() {
  for (const key in sliders) {
    sliders[key].addEventListener('input', () => {
      const val = parseFloat(sliders[key].value);
      const spanId = key + 'Value';
      if (sliderValues[spanId]) sliderValues[spanId].textContent = val.toFixed(2);
      // Live update runners:
      if (currentSelectedRace) {
        renderCustomScoredRunners(currentSelectedRace, getCurrentWeights());
      }
    });
  }
}

// --- Main init ---
const allRaces = window.racecardsData && window.racecardsData.racecards ? window.racecardsData.racecards : [];
if (allRaces.length) {
  populateRaceDropdown(allRaces);
  setupSliderEvents();
  updateSlidersUI(weightPresets.Default);

  // Initial selection (show default .score)
  currentSelectedRace = allRaces[0];
  raceSelector.value = currentSelectedRace._id || currentSelectedRace.race_id;
  renderCustomScoredRunners(currentSelectedRace, weightPresets.Default);

  // Dropdown change: show selected race, current weights
  raceSelector.addEventListener('change', e => {
    const race = findRaceById(allRaces, raceSelector.value);
    if (race) {
      currentSelectedRace = race;
      renderCustomScoredRunners(race, getCurrentWeights());
    }
  });

  // Preset buttons: set preset weights and update runners
  document.querySelectorAll('.preset-button').forEach(btn => {
    btn.addEventListener('click', e => {
      const preset = btn.dataset.preset;
      if (weightPresets[preset]) {
        selectedPresetName = preset;
        updateSlidersUI(weightPresets[preset]);
        renderCustomScoredRunners(currentSelectedRace, weightPresets[preset]);
      }
    });
  });
} else {
  customRunnersListDiv.innerHTML = '<p>No race data loaded.</p>';
}

console.log('custom-score.js finished (score default mode).');
