const CSV_PATH = 'data/roi_full_breakdown.csv';

// === Detect and Parse CSV, same as before ===
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const commaCount = firstLine.split(',').length;
  const tabCount = firstLine.split('\t').length;
  return tabCount > commaCount ? '\t' : ',';
}

function splitCSVRow(row, delim) {
  const cells = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        curr += '"'; i++;
      } else { inQuotes = !inQuotes; }
    } else if (char === delim && !inQuotes) {
      cells.push(curr); curr = '';
    } else { curr += char; }
  }
  cells.push(curr);
  return cells;
}

function parseCSV(text) {
  const delim = detectDelimiter(text);
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSVRow(lines[0], delim).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = splitCSVRow(line, delim);
    let obj = {};
    headers.forEach((h, i) => obj[h] = (cells[i] ?? '').trim());
    return obj;
  });
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => {
    (acc[x[key]] = acc[x[key]] || []).push(x);
    return acc;
  }, {});
}

function getTipPosition(r) {
  if (!r.tip_position) return null;
  const posStr = String(r.tip_position).trim();
  const posNum = parseFloat(posStr);
  return isNaN(posNum) ? null : posNum;
}

function getWinReturn(r) {
  const val = parseFloat(r.win_return);
  return isNaN(val) ? 0 : val;
}

// --- Get yesterday's date in your local time (UK BST/GMT safe) ---
function getYesterday() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
}

fetch(CSV_PATH)
  .then(resp => resp.text())
  .then(text => {
    const data = parseCSV(text);

    // Normalize class for grouping
    data.forEach(row => {
      if (row['class']) {
        const c = String(row['class']).toLowerCase().replace(/[^\d]/g, '');
        row['class'] = c ? c : row['class'];
      }
    });

    // --------- ALL-TIME SUMMARY ---------
    const totalRaces = data.length;
    const totalStaked = data.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
    const totalReturned = data.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
    const roiAll = totalStaked ? (((totalReturned - totalStaked) / totalStaked) * 100).toFixed(2) : '0.00';

const topPickWins = data.filter(r =>
  getTipPosition(r) === 1 ||
  getWinReturn(r) > 0
).length;
    const topPickPlaces = data.filter(r => {
      const pos = getTipPosition(r);
      return pos !== null && pos >= 1 && pos <= 3;
    }).length;

    const winPercent = totalRaces ? ((topPickWins / totalRaces) * 100).toFixed(1) : '0.0';
    const placePercent = totalRaces ? ((topPickPlaces / totalRaces) * 100).toFixed(1) : '0.0';

    // --- Add ALL-TIME to DOM ---
    document.getElementById('total-races').textContent = totalRaces;
    document.getElementById('total-staked').textContent = '£' + totalStaked.toFixed(2);
    document.getElementById('total-returned').textContent = '£' + totalReturned.toFixed(2);
    document.getElementById('roi-all').textContent = roiAll;
    document.getElementById('top-pick-wins').textContent = `${topPickWins} (${winPercent}%)`;

    // ========= YESTERDAY'S ROI =========
    const yestStr = getYesterday();
    const yestRows = data.filter(r => (r.date||'').startsWith(yestStr));
    const yestRaces = yestRows.length;
    const yestStaked = yestRows.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
    const yestReturned = yestRows.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
    const yestROI = yestStaked ? (((yestReturned - yestStaked) / yestStaked) * 100).toFixed(2) : '0.00';
    const yestWins = yestRows.filter(r => getTipPosition(r) === 1 || getWinReturn(r) > 0).length;
    const yestPlaces = yestRows.filter(r => {
      const pos = getTipPosition(r);
      return pos !== null && pos >= 1 && pos <= 3;
    }).length;
    const yestWinPct = yestRaces ? ((yestWins / yestRaces) * 100).toFixed(1) : '0.0';
    const yestPlacePct = yestRaces ? ((yestPlaces / yestRaces) * 100).toFixed(1) : '0.0';

    // --- You need to add these <span> IDs in your HTML for yesterday's summary! ---
    document.getElementById('yest-races').textContent = yestRaces;
    document.getElementById('yest-staked').textContent = '£' + yestStaked.toFixed(2);
    document.getElementById('yest-returned').textContent = '£' + yestReturned.toFixed(2);
    document.getElementById('yest-roi').textContent = yestROI;
    document.getElementById('yest-wins').textContent = `${yestWins} (${yestWinPct}%)`;
    document.getElementById('yest-places').textContent = `${yestPlaces} (${yestPlacePct}%)`;

    // ========= ROI BY COURSE (sort by returned DESC) =========
    let courseData = groupBy(data, 'course');
    let html = `<tr><th>Course</th><th>Races</th><th>Staked</th><th>Returned</th><th>ROI (%)</th></tr>`;

    const rowsArr = Object.entries(courseData).map(([course, rows]) => {
      const races = rows.length;
      const staked = rows.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
      const returned = rows.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
      const roi = staked ? (((returned - staked) / staked) * 100).toFixed(2) : '0.00';
      return {
        course,
        races,
        staked,
        returned,
        roi: parseFloat(roi),
        html: `<tr${roi > 0 ? ' class="win-row"' : ''}><td>${course}</td><td>${races}</td><td>£${staked.toFixed(2)}</td><td>£${returned.toFixed(2)}</td><td>${roi}</td></tr>`
      };
    });

    // SORT BY "RETURNED" (DESC)
    rowsArr.sort((a, b) => b.returned - a.returned);

    rowsArr.forEach(r => { html += r.html; });
    document.getElementById('roi-by-course').innerHTML = html;

    // -------- ROI BY TYPE --------
    let typeData = groupBy(data, 'type');
    html = `<tr><th>Type</th><th>Races</th><th>Staked</th><th>Returned</th><th>ROI (%)</th></tr>`;
    Object.entries(typeData).forEach(([type, rows]) => {
      const races = rows.length;
      const staked = rows.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
      const returned = rows.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
      const roi = staked ? (((returned - staked) / staked) * 100).toFixed(2) : '0.00';
      html += `<tr${roi > 0 ? ' class="win-row"' : ''}><td>${type}</td><td>${races}</td><td>£${staked.toFixed(2)}</td><td>£${returned.toFixed(2)}</td><td>${roi}</td></tr>`;
    });
    document.getElementById('roi-by-type').innerHTML = html;

    // -------- ROI BY CLASS --------
    let classData = groupBy(data, 'class');
    html = `<tr><th>Class</th><th>Races</th><th>Staked</th><th>Returned</th><th>ROI (%)</th></tr>`;
    Object.entries(classData).forEach(([cls, rows]) => {
      const races = rows.length;
      const staked = rows.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
      const returned = rows.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
      const roi = staked ? (((returned - staked) / staked) * 100).toFixed(2) : '0.00';
      html += `<tr${roi > 0 ? ' class="win-row"' : ''}><td>${cls}</td><td>${races}</td><td>£${staked.toFixed(2)}</td><td>£${returned.toFixed(2)}</td><td>${roi}</td></tr>`;
    });
    document.getElementById('roi-by-class').innerHTML = html;

    // -------- WINNERS TABLE --------
    const winners = data.filter(r =>
      getTipPosition(r) === 1 || getWinReturn(r) > 0
    );
    winners.sort((a, b) => new Date(b.date) - new Date(a.date) || a.course.localeCompare(b.course));
    let winHtml = '';
    winners.forEach(r => {
      winHtml += `<tr class="win-row">
        <td>${r.date}</td>
        <td>${r.course}</td>
        <td>${r.off_time || ''}</td>
        <td>${r.tip}</td>
        <td>${r.tip_odds}</td>
        <td>${r.sp_dec || ''}</td>
        <td>£${parseFloat(r.win_return||0).toFixed(2)}</td>
      </tr>`;
    });
    document.getElementById('winners-rows').innerHTML = winHtml;
  })
  .catch(err => {
    document.querySelector('.container').innerHTML = `<h1>Error</h1><p>Could not load <code>${CSV_PATH}</code>: ${err}</p>`;
  });
