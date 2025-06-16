(function () {
    // Helper to get the correct Date object for each race
    function getRaceDate(r) {
        if (r.off_dt) {
            // ISO8601 with timezone, safest!
            return new Date(r.off_dt);
        }
        if (r.race_datetime) {
            // Fallback: often "YYYY-MM-DDTHH:MM" (local, no tz)
            // Parse as local
            return new Date(r.race_datetime);
        }
        if (r.off_time && r.date) {
            // Last-ditch: combine fields to build a date string
            return new Date(r.date + "T" + r.off_time);
        }
        // Absolute fallback: now
        return new Date();
    }

    const data = document.getElementById('races-data');
    if (!data) return;
    let races = JSON.parse(data.textContent).slice();

    // Sort races by actual time
    races.sort((a, b) => getRaceDate(a) - getRaceDate(b));

    // Device time now
    const now = new Date();

    // Mark races as past or future
    races.forEach(r => {
        r.isPast = getRaceDate(r) < now;
    });

    // Next 6 races that are not past
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);

    // Get the bar element
    let bar = document.getElementById('next6-races');
    if (!bar) return;

    if (nextRaces.length === 0) {
        bar.innerHTML = '<span class="next6-title">No more races today</span>';
        return;
    }

    // Render the Next 6 Races bar
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

    // Mark past races in any clickable list if needed (eg. main card)
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
