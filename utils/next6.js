// utils/next6.js
// Usage: window.renderNext6Bar(allRaces, activeRaceId, day)
window.renderNext6Bar = function(allRaces, activeRaceId, day) {
  const now = new Date();
  const next6 = allRaces
    .filter(r => new Date(r.off_dt) > now)
    .sort((a, b) => new Date(a.off_dt) - new Date(b.off_dt))
    .slice(0, 6);

  if (!next6.length) {
    return `<span class="next6-title">No races left today</span>`;
  }

  return next6.map(r => `
    <div class="next6-pill">
      <span class="next6-course">${r.course.length > 10 ? r.course.slice(0,10)+'…' : r.course}</span>
      <a href="racecard.html?date=${day}&race_id=${r._id}" class="next6-time-btn${r._id === activeRaceId ? ' active' : ''}">
        ${r.off_time}
      </a>
    </div>
  `).join('');
};
