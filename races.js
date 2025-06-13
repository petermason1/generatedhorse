function padTime(t) {
    if (!t) return '';
    let [h, m] = t.split(':');
    h = String(h).padStart(2, '0');
    m = String(m).padStart(2, '0');
    return `${h}:${m}`;
}

(function () {
    const data = document.getElementById('races-data');
    if (!data) return;
    let races = JSON.parse(data.textContent).slice();

    // Sort by UTC datetime string
    races.sort((a, b) => a.race_datetime.localeCompare(b.race_datetime));

    // Device time in UTC as ISO string
    const now = new Date();
    const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const nowISO = nowUTC.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'

    // Mark races as past using UTC datetimes
    races.forEach(r => {
        r.isPast = r.race_datetime < nowISO;
    });

    // Get next 6 races (not in the past)
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);
    if (nextRaces.length < 6) {
        const prev = races.filter(r => r.isPast).slice(-1 * (6 - nextRaces.length));
        nextRaces = nextRaces.concat(prev);
    }

    // Render next 6 bar
    let bar = document.getElementById('next6-races');
    if (!bar) return;
    bar.innerHTML =
        `<div class="next6-title">Next 6 Races</div>` +
        nextRaces.map(r =>
            `<a href="race-${r._id}.html" class="next6-btn${r.isPast ? ' past' : ''}">
        <span class="next6-course">${r.course}</span>
        <span class="next6-time">${padTime(r.off_time)}</span>
      </a>`
        ).join('');

    // Strike-through all past races in the main index list
    document.querySelectorAll('.race-time-btn').forEach(el => {
        let raceId = el.getAttribute('href').replace(/^race-|\.html$/g, '');
        let found = races.find(r => r._id == raceId);
        if (found && found.isPast) el.classList.add('past');
    });
})();
