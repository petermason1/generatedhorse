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

    // Sort by datetime
    races.sort((a, b) => a.race_datetime.localeCompare(b.race_datetime));

    const now = new Date();
    // Use local time (UK time if in UK, else local)
    const nowISO = now.toISOString().slice(0, 16); // e.g. '2025-06-13T18:35'

    // Mark races as past using datetime
    races.forEach(r => {
        // If the race_datetime is < nowISO, it's in the past
        r.isPast = r.race_datetime < nowISO;
    });

    // Get next 6 races (not in the past)
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);
    if (nextRaces.length < 6) {
        // Fill up with latest past races to always show 6
        const prev = races.filter(r => r.isPast).slice(-1 * (6 - nextRaces.length));
        nextRaces = nextRaces.concat(prev);
    }

    // Render bar
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
