console.log('racecard.js loaded');
console.log(window.racecardsData);

// ========== Scoring System (Tweak this for your best results) ==========
function scoreRunner(r) {
  let score = 0;
  // Robust parsing so no NaN
  const rpr = parseInt(r.rpr) || 0;
  const ts = parseInt(r.ts) || 0;
  const or = parseInt(r.ofr) || 0;
  const lastRun = parseInt(r.last_run) || 99; // If missing, treat as not fresh

  let oddsDec = 0;
  if (r.odds?.[0]?.decimal) {
    oddsDec = parseFloat(r.odds[0].decimal);
    if (isNaN(oddsDec)) oddsDec = 0;
  }

  // --- Form parsing ---
  let wins = 0, places = 0;
  if (typeof r.form === 'string') {
    wins = (r.form.match(/1/g) || []).length;
    places = (r.form.match(/[23]/g) || []).length;
  }

  // --- Trainer/Jockey 14 day stats ---
  let trainerPercent = r.trainer_14_days?.percent ? parseFloat(r.trainer_14_days.percent) : 0;
  let trainerWins = r.trainer_14_days?.wins ? parseInt(r.trainer_14_days.wins) : 0;
  let trainerRuns = r.trainer_14_days?.runs ? parseInt(r.trainer_14_days.runs) : 0;
  // Jockey could be handled similarly if your data has it

  // === Core Scoring (adjust weights as needed) ===
  score += rpr;
  score += 0.5 * ts;
  score += 0.3 * or;
  score += 3 * wins + 1 * places;
  if (lastRun > 60) score -= (lastRun - 60) * 0.5;
  score += Math.max(0, 60 - lastRun) * 0.08;

  // Trainer impact
  score += 0.9 * trainerPercent;
  score += 1.2 * trainerWins;
  // Add Jockey impact if you have the fields

  // Odds penalty/bonus as before
  if (oddsDec >= 8) score -= (oddsDec - 7) * 3;
  if (oddsDec >= 15) score -= (oddsDec - 14) * 6;
  if (oddsDec >= 26) score -= (oddsDec - 25) * 10;
  if (oddsDec > 0 && oddsDec <= 7) score += 8 / oddsDec;

  // **If all else fails, give a score based just on odds**
  if (score === 0 && oddsDec > 0) {
    score = 12 / oddsDec;
  }

  score = Math.max(score, 0);
  return Math.round(score * 10) / 10;
}



// ========== Helper to get race_id from URL ==========
function getRaceId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('race_id');
}

// ========== Main Logic ==========
const main = document.getElementById('main');
const allRaces = window.racecardsData.racecards;
const raceId = getRaceId();

let race = null;
if (raceId) race = allRaces.find(r => r._id === raceId);
if (!race) race = allRaces[0];
if (!race) {
  main.innerHTML = '<p style="color: #e54c47;">No race found.</p>';
  throw new Error('No race found!');
}

// Score and sort runners
race.runners.forEach(r => r.score = scoreRunner(r));
race.runners.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

// Top 3 picks summary
function renderTopPicks(race) {
  let top = race.runners.slice(0, 3);
  return `
    <div class="top-picks" style="margin-bottom:15px;">
      <div style="font-weight:700; font-size:1.07em; color:#ffc900; margin-bottom:3px;">
        Top Picks
      </div>
      <div>
        ${top.map((r, i) => `
          <span style="display:inline-block; margin-right:13px;">
            <b>${i+1}.</b> <span style="color:#32dd99;">${r.horse}</span>
            <span style="font-weight:600; color:#fff;">(${r.score})</span>
            <span style="color:#ffe564; margin-left:2px;">${r.odds?.[0]?.fractional||''}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRace(race) {
  main.innerHTML = `
    <section class="race-header">
      <h1>${race.course} <span style="font-weight: 600;">${race.off_time}</span></h1>
      <div class="race-meta">
        <strong>${race.race_name}</strong>
        <div>
          Prize: <b>${race.prize.replace(/\u00a3/, '£')}</b>
          • Runners: <b>${race.field_size}</b>
          • Age/Sex: <b>${race.age_band||'-'}</b>
          • Pattern: <b>${race.pattern||race.race_class||''}</b>
          • Region: <b>${race.region}</b>
        </div>
      </div>
      <div class="race-details">
        Class ${race.race_class.replace('Class ','')} • ${race.distance} • ${race.going}
      </div>
    </section>
    ${renderTopPicks(race)}
    <div class="runners-list">
      ${race.runners.map((r, i) => `
        <div class="runner-card" data-i="${i}">
          <div class="runner-num-draw">
            <span class="runner-num">${r.number || i+1}</span>
            <span class="runner-draw">${(r.draw && r.draw !== r.number) ? `(${r.draw})` : ''}</span>
            <span class="runner-score" style="display:block;font-size:0.93em;color:#32dd99;font-weight:700;">${typeof r.score === 'number' ? r.score : ''}</span>
          </div>
          <img class="runner-silk" src="${r.silk_url||''}" alt="silks" />
          <div class="runner-main">
            <div class="runner-horse">${r.horse || ''}</div>
            <div class="runner-meta">
              ${r.jockey || ''} <span style="opacity:.5;">|</span> ${r.trainer || ''}
              <span class="runner-form">${r.form || ''}</span>
            </div>
            <div class="runner-info">
              Age <b>${r.age || '-'}</b>
              • Weight <b>${r.lbs || '-'}</b>
              • RPR <b>${r.rpr || '-'}</b>
              • OR <b>${r.ofr || '-'}</b>
              • TS <b>${r.ts || '-'}</b>
              ${r.headgear ? `• Headgear <b>${r.headgear}</b>` : ''}
              ${r.last_run ? `• Last run <b>${r.last_run}d</b>` : ''}
            </div>
            <button class="runner-more-btn" type="button">More info ▼</button>
            <div class="runner-more">
              <b>Comment:</b> ${r.comment || '<span style="color:#888">No comment</span>'}<br>
              <b>Spotlight:</b> ${r.spotlight || '<span style="color:#888">No spotlight</span>'}<br>
              <b>Breeding:</b> ${r.sire || '-'} / ${r.dam || '-'}<br>
              <b>Owner:</b> ${r.owner || '-'}<br>
              <b>Jockey/Trainer last 14d:</b>
                ${r.trainer_14_days?.wins || '-'} wins from ${r.trainer_14_days?.runs || '-'} runs (${r.trainer_14_days?.percent || '-'}%)
              <br>
              <b>Prev Trainers:</b> ${r.prev_trainers?.map(pt=>pt.trainer).join(', ') || '-'}<br>
              <b>Prev Owners:</b> ${r.prev_owners?.map(po=>po.owner).join(', ') || '-'}<br>
              <b>Quotes:</b> <ul>${r.quotes?.map(q=>`<li><b>${q.date}:</b> ${q.quote}</li>`).join('') || '-'}</ul>
              <b>Stable Tour:</b> <ul>${r.stable_tour?.map(st=>`<li>${st.quote}</li>`).join('') || '-'}</ul>
            </div>
          </div>
          <span class="runner-odds">${r.odds?.[0]?.fractional || ''}</span>
        </div>
      `).join('')}
    </div>
  `;
}

renderRace(race);

// Toggle the more-info section for each runner
main.addEventListener('click', (e) => {
  if (e.target.classList.contains('runner-more-btn')) {
    const card = e.target.closest('.runner-card');
    card.classList.toggle('expanded');
    e.target.textContent = card.classList.contains('expanded') ? 'Less info ▲' : 'More info ▼';
  }
});
