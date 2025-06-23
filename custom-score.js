console.log('custom-score.js loaded');
console.log(window.racecardsData);

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

const rprWeightValue = document.getElementById('rprWeightValue');
const tsWeightValue = document.getElementById('tsWeightValue');
const orWeightValue = document.getElementById('orWeightValue');
const winsWeightValue = document.getElementById('winsWeightValue');
const placesWeightValue = document.getElementById('placesWeightValue');
const lastRunPenaltyWeightValue = document.getElementById('lastRunPenaltyWeightValue');
const lastRunBonusWeightValue = document.getElementById('lastRunBonusWeightValue');
const trainerPercentWeightValue = document.getElementById('trainerPercentWeightValue');
const trainerWinsWeightValue = document.getElementById('trainerWinsWeightValue');
const trainerBonusValue = document.getElementById('trainerBonusValue');
const layoffPenaltyValue = document.getElementById('layoffPenaltyValue');

const customRunnersListDiv = document.getElementById('customRunnersList');
const currentRaceDisplay = document.getElementById('currentRaceDisplay');
const currentRaceDetails = document.getElementById('currentRaceDetails');

// Race selection elements
const raceSelector = document.getElementById('raceSelector');
let currentSelectedRace = null; // To hold the currently displayed race object

// Define weight presets
const weightPresets = {
    "Default": {
        rprWeight: 1.1,
        tsWeight: 0.6,
        orWeight: 0.32,
        winsWeight: 2.1,
        placesWeight: 1.1,
        lastRunPenaltyWeight: -0.19,
        lastRunBonusWeight: 0.13,
        trainerPercentWeight: 0.8,
        trainerWinsWeight: 1.2,
        trainerBonusValue: 0.5,
        layoffPenaltyValue: -2.5
    },
    "Speed Focus": {
        rprWeight: 2.5, // Higher RPR
        tsWeight: 1.5,  // Higher TS
        orWeight: 0.5,
        winsWeight: 1.0,
        placesWeight: 0.5,
        lastRunPenaltyWeight: -0.25, // More penalty for long layoffs
        lastRunBonusWeight: 0.2,    // More bonus for recent speed
        trainerPercentWeight: 0.4,
        trainerWinsWeight: 0.6,
        trainerBonusValue: 0.2,
        layoffPenaltyValue: -1.0
    },
    "Form Focus": {
        rprWeight: 0.8,
        tsWeight: 0.3,
        orWeight: 0.2,
        winsWeight: 4.0, // Much higher wins
        placesWeight: 2.5, // Much higher places
        lastRunPenaltyWeight: -0.1,
        lastRunBonusWeight: 0.1,
        trainerPercentWeight: 1.5, // More emphasis on trainer form
        trainerWinsWeight: 2.0,    // More emphasis on trainer wins
        trainerBonusValue: 1.0,    // Stronger trainer bonus
        layoffPenaltyValue: -4.0   // Stronger layoff penalty
    },
    "Trainer Focus": {
        rprWeight: 0.5,
        tsWeight: 0.3,
        orWeight: 0.1,
        winsWeight: 1.0,
        placesWeight: 0.5,
        lastRunPenaltyWeight: -0.1,
        lastRunBonusWeight: 0.1,
        trainerPercentWeight: 2.5, // Strong emphasis on trainer %
        trainerWinsWeight: 2.5,    // Strong emphasis on trainer wins
        trainerBonusValue: 2.0,    // Very strong trainer bonus
        layoffPenaltyValue: -1.0
    }
};


// Function to calculate custom score based on dynamic weights
function calculateCustomScore(r, weights) {
    const rpr = Number.parseInt(r.rpr) || 0;
    const ts = Number.parseInt(r.ts) || 0;
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

    // Apply weights from sliders
    let score = 0;
    score += weights.rprWeight * rpr;
    score += weights.tsWeight * ts;
    score += weights.orWeight * or;
    score += weights.winsWeight * wins;
    score += weights.placesWeight * places;

    if (lastRunVal > 50) {
        score += (lastRunVal - 50) * weights.lastRunPenaltyWeight; // Negative weight for penalty
    } else {
        score += (50 - lastRunVal) * weights.lastRunBonusWeight; // Positive weight for bonus
    }

    score += weights.trainerPercentWeight * trainerPercent;
    score += weights.trainerWinsWeight * trainerWins;
    score += (trainerPercent >= 20 ? weights.trainerBonusValue : 0); // Trainer bonus applied as a flat value
    score += (wins === 0 && lastRunVal > 50) ? weights.layoffPenaltyValue : 0; // Layoff penalty applied as a flat value

    if (score < -12) score = -12 + (score + 12) * 0.4;
    if (!Number.isFinite(score)) score = 0;
    return Math.round(score * 100) / 100;
}

// ========== Helper: Is Non-Runner ==========
function isNonRunner(r) {
  if (typeof r.form === 'string' && r.form.match(/\bNR\b/i)) return true;
  if (r.status && r.status.toUpperCase() === 'NR') return true;
  if (r.non_runner === true) return true;
  return false;
}

// --- More Info Table (re-used from racecard.js) ---
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


// Function to populate the race selection dropdown
function populateRaceDropdown() {
    const allRaces = window.racecardsData.racecards;
    if (!allRaces || allRaces.length === 0) {
        raceSelector.innerHTML = '<option value="">No races available</option>';
        raceSelector.disabled = true;
        return;
    }

    // Sort races by date and time
    allRaces.sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt));

    raceSelector.innerHTML = ''; // Clear existing options
    allRaces.forEach((race, index) => {
        const option = document.createElement('option');
        option.value = race._id;
        option.textContent = `${race.course} - ${race.off_time} (${race.race_name})`;
        raceSelector.appendChild(option);
    });

    // Set the initial selected race to the first one, or based on a URL parameter if needed
    // For this example, we'll just select the first race initially
    currentSelectedRace = allRaces[0];
    if (currentSelectedRace) {
        raceSelector.value = currentSelectedRace._id;
    } else {
        raceSelector.disabled = true;
    }
}

// Function to update slider values and their display spans
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
    trainerBonusValue.textContent = weights.trainerBonusValue.toFixed(1);
    layoffPenaltyValueInput.value = weights.layoffPenaltyValue;
    layoffPenaltyValue.textContent = weights.layoffPenaltyValue.toFixed(1);
}

// Main function to render runners with custom scores
function renderCustomScoredRunners() {
    if (!currentSelectedRace) {
        customRunnersListDiv.innerHTML = '<p class="error-message">Please select a race.</p>';
        currentRaceDisplay.textContent = '';
        currentRaceDetails.textContent = '';
        return;
    }

    // Update current race display
    currentRaceDisplay.textContent = `${currentSelectedRace.course} ${currentSelectedRace.off_time}`;
    currentRaceDetails.textContent = `${currentSelectedRace.race_name} • ${currentSelectedRace.distance} • ${currentSelectedRace.going}`;

    // Get current weights from sliders
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
        layoffPenaltyValue: parseFloat(layoffPenaltyValueInput.value)
    };

    // Calculate scores for each runner using custom weights
    currentSelectedRace.runners.forEach(r => {
        r.customScore = calculateCustomScore(r, currentWeights);
    });

    // Sort runners by custom score (non-runners to bottom)
    const nrs = currentSelectedRace.runners.filter(isNonRunner);
    const activeRunners = currentSelectedRace.runners.filter(r => !isNonRunner(r));
    activeRunners.sort((a, b) => (b.customScore ?? -9999) - (a.customScore ?? -9999));
    const sortedRunners = [...activeRunners, ...nrs];

    // Render the runners list
    customRunnersListDiv.innerHTML = sortedRunners.map((r, i) => `
        <div class="runner-card${isNonRunner(r) ? ' runner-nr' : ''}" data-i="${i}">
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

    // Re-attach event listeners for "More info" buttons after content is rendered
    document.querySelectorAll('.runner-more-btn').forEach(button => {
        button.removeEventListener('click', toggleMoreInfo); // Prevent duplicate listeners
        button.addEventListener('click', toggleMoreInfo);
    });
}

// Function to toggle more info section (copied from racecard.js)
function toggleMoreInfo(e) {
    const card = e.target.closest('.runner-card');
    card.classList.toggle('expanded');
    e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
}


// Event listeners for slider changes
rprWeightInput.addEventListener('input', () => {
    rprWeightValue.textContent = parseFloat(rprWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
tsWeightInput.addEventListener('input', () => {
    tsWeightValue.textContent = parseFloat(tsWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
orWeightInput.addEventListener('input', () => {
    orWeightValue.textContent = parseFloat(orWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
winsWeightInput.addEventListener('input', () => {
    winsWeightValue.textContent = parseFloat(winsWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
placesWeightInput.addEventListener('input', () => {
    placesWeightValue.textContent = parseFloat(placesWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
lastRunPenaltyWeightInput.addEventListener('input', () => {
    lastRunPenaltyWeightValue.textContent = parseFloat(lastRunPenaltyWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
lastRunBonusWeightInput.addEventListener('input', () => {
    lastRunBonusWeightValue.textContent = parseFloat(lastRunBonusWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
trainerPercentWeightInput.addEventListener('input', () => {
    trainerPercentWeightValue.textContent = parseFloat(trainerPercentWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
trainerWinsWeightInput.addEventListener('input', () => {
    trainerWinsWeightValue.textContent = parseFloat(trainerWinsWeightInput.value).toFixed(2);
    renderCustomScoredRunners();
});
trainerBonusValueInput.addEventListener('input', () => {
    trainerBonusValue.textContent = parseFloat(trainerBonusValueInput.value).toFixed(1);
    renderCustomScoredRunners();
});
layoffPenaltyValueInput.addEventListener('input', () => {
    layoffPenaltyValue.textContent = parseFloat(layoffPenaltyValueInput.value).toFixed(1);
    renderCustomScoredRunners();
});

// Event listener for race selection change
raceSelector.addEventListener('change', () => {
    const allRaces = window.racecardsData.racecards;
    const selectedRaceId = raceSelector.value;
    currentSelectedRace = allRaces.find(r => r._id === selectedRaceId);
    renderCustomScoredRunners();
});

// Event listeners for preset buttons
document.querySelectorAll('.preset-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        const presetWeights = weightPresets[presetName];
        if (presetWeights) {
            updateSliderValues(presetWeights);
            renderCustomScoredRunners();
        }
    });
});

// Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    populateRaceDropdown(); // Populate dropdown first
    if (window.racecardsData && window.racecardsData.racecards && window.racecardsData.racecards.length > 0) {
        currentSelectedRace = window.racecardsData.racecards[0]; // Set initial race (first in sorted list)
    }
    renderCustomScoredRunners(); // Render runners with initial (or default) weights
});

console.log('custom-score.js finished.');
