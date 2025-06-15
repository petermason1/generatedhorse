(function () {
    function localISODateTimeString(date) {
      function pad(n) { return String(n).padStart(2, '0'); }
      return date.getFullYear() + '-' +
             pad(date.getMonth()+1) + '-' +
             pad(date.getDate()) + 'T' +
             pad(date.getHours()) + ':' +
             pad(date.getMinutes());
    }

    const data = document.getElementById('races-data');
    if (!data) return;
    let races = JSON.parse(data.textContent).slice();

    // Sort by local datetime string for accuracy
    races.sort((a, b) => a.race_datetime.localeCompare(b.race_datetime));

    // Device time in LOCAL ISO string (YYYY-MM-DDTHH:MM)
    const nowISO = localISODateTimeString(new Date());

    // Mark races as past (compare local to local)
    races.forEach(r => {
        r.isPast = r.race_datetime < nowISO;
    });

    // Next 6 races (future), fill with most recent past races if fewer than 6 left
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);
    if (nextRaces.length < 6) {
        const prev = races.filter(r => r.isPast).slice(-1 * (6 - nextRaces.length));
        nextRaces = nextRaces.concat(prev);
    }

    // Render the next 6 bar
    let bar = document.getElementById('next6-races');
    if (!bar) return;
    bar.innerHTML =
        `<span class="next6-title">Next 6 Races</span>
        <div class="next6-pill-group">` +
        nextRaces.map(r =>
            `<div class="next6-pill">
                <div class="next6-course" title="${r.course}">${r.course}</div>
                <a href="race-${r._id}.html" class="next6-time-btn${r.isPast ? ' past' : ''}">${r.off_time}</a>
            </div>`
        ).join('') +
        `</div>`;

    // Mark past races in main card if present
    const lookup = {};
    races.forEach(r => lookup[r._id] = r);

    document.querySelectorAll('.race-time-btn').forEach(el => {
        let raceId = el.getAttribute('data-race-id');
        let r = lookup[raceId];
        if (r && r.isPast) {
            el.classList.add('past');
        }
    });
})();
