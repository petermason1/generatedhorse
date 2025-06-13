function parseTime(t) {
    if (!t) return 9999;
    let [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
function padTime(t) {
    let [h, m] = t.split(':');
    h = String(h).padStart(2, '0');
    m = String(m).padStart(2, '0');
    return `${h}:${m}`;
}
(function () {
    const data = document.getElementById('races-data');
    if (!data) return;
    let races = JSON.parse(data.textContent).slice(); // Copy, in case

    // Sort by off_time in case not already sorted
    races.sort((a, b) => parseTime(a.off_time) - parseTime(b.off_time));

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // Mark races as past
    races.forEach(r => { r.isPast = parseTime(r.off_time) < nowMins; });

    // Get next 6 upcoming, then fill with latest previous if <6
    let nextRaces = races.filter(r => !r.isPast).slice(0, 6);
    if (nextRaces.length < 6) {
        // Fill up with most recent past races, but keep full list <= 6
        const prev = races.filter(r => r.isPast).slice(-1 * (6 - nextRaces.length));
        nextRaces = nextRaces.concat(prev);
    }

    // Render
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
})();
