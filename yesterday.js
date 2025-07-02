const CSV_PATH = 'data/roi_full_breakdown.csv';

// Auto-detect delimiter (comma or tab)
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const commaCount = firstLine.split(',').length;
  const tabCount = firstLine.split('\t').length;
  return tabCount > commaCount ? '\t' : ',';
}

// Robust CSV parser: handles quoted commas (so "race" fields don't break things!)
function splitCSVRow(row, delim) {
  const cells = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        curr += '"'; // double quote inside quotes
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delim && !inQuotes) {
      cells.push(curr);
      curr = '';
    } else {
      curr += char;
    }
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

fetch(CSV_PATH)
  .then(resp => resp.text())
  .then(text => {
    const data = parseCSV(text);

    // Normalize class for grouping (removes weird labels)
    data.forEach(row => {
      if (row['class']) {
        const c = String(row['class']).toLowerCase().replace(/[^\d]/g, '');
        row['class'] = c ? c : row['class'];
      }
    });

    // -------- ROI SUMMARY --------
    const totalRaces = data.length;
    const totalStaked = data.reduce((a, r) => a + (parseFloat(r['staked']||'1') || 0), 0);
    const totalReturned = data.reduce((a, r) => a + (parseFloat(r['win_return']||'0') || 0), 0);
    const roiAll = totalStaked ? (((totalReturned - totalStaked) / totalStaked) * 100).toFixed(2) : '0.00';

    // Update elements in the new summary-grid structure
    document.getElementById('total-races').textContent = totalRaces;
    document.getElementById('total-staked').textContent = '£' + totalStaked.toFixed(2);
    document.getElementById('total-returned').textContent = '£' + totalReturned.toFixed(2);
    document.getElementById('roi-all').textContent = roiAll; // No '%' here, as it's in the HTML now


    // -------- ROI BY COURSE --------
   let courseData = groupBy(data, 'course');
let html = `<tr><th>Course</th><th>Races</th><th>Staked</th><th>Returned</th><th>ROI (%)</th></tr>`;

// Calculate and collect course rows
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
    roi: parseFloat(roi), // for sorting
    html: `<tr${roi > 0 ? ' class="win-row"' : ''}><td>${course}</td><td>${races}</td><td>£${staked.toFixed(2)}</td><td>£${returned.toFixed(2)}</td><td>${roi}</td></tr>`
  };
});

// Split into winning and losing, sort each, then concat
const positive = rowsArr.filter(r => r.roi > 0).sort((a, b) => a.course.localeCompare(b.course));
const negative = rowsArr.filter(r => r.roi <= 0).sort((a, b) => a.course.localeCompare(b.course));

// Combine and build HTML
[...positive, ...negative].forEach(r => { html += r.html; });

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
    const winners = data.filter(r => r.tip_position === '1' || r.tip_position === '1.0' || parseFloat(r.win_return) > 0);
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
