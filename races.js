// Converts "13:05" => "1:05", "00:55" => "12:55"
function to12hr(t) {
    if (!t) return '';
    let [h, m] = t.split(':').map(Number);
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')}`;
}

(function () {
    const data = document.getElementById('races-data');
    if (!data) return;
    let races = JSON.parse(data.textContent).slice();

    // Sort by UTC datetime string for accuracy
    races.sort((a, b) => a.race_datetime.localeCompare(b.race_datetime));

    // Device time in UTC as ISO string (YYYY-MM-DDTHH:MM)
    const now = new Date();
    const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const nowISO = nowUTC.toISOString().slice(0, 16);

    // Mark races as past
    races.forEach(r => {
        r.isPast = r.race_datetime < nowISO;
    });

    // Next 6 races (future), fill with most recent past races if fewer than 6 left
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);
    if (nextRaces.length < 6) {
        const prev = races.filter(r => r.isPast).slice(-1 * (6 - nextRaces.length));
        nextRaces = nextRaces.concat(prev);
    }

    // Render the next 6 bar: course name above, time as 12-hour no am/pm
    let bar = document.getElementById('next6-races');
    if (!bar) return;
    bar.innerHTML =
        `<span class="next6-title">Next 6 Races</span>
        <div class="next6-pill-group">` +
        nextRaces.map(r =>
            `<div class="next6-pill">
                <div class="next6-course" title="${r.course}">${r.course}</div>
                <a href="race-${r._id}.html" class="next6-time-btn${r.isPast ? ' past' : ''}">${to12hr(r.off_time)}</a>
            </div>`
        ).join('') +
        `</div>`;

    // (Optional) Strike-through all past races in the main index list
    document.querySelectorAll('.race-time-btn').forEach(el => {
        let raceId = el.getAttribute('href').replace(/^race-|\.html$/g, '');
        let found = races.find(r => r._id == raceId);
        if (found && found.isPast) el.classList.add('past');
    });
})();
