const sampleCsv = `state,year,indicator,value
Maharashtra,2021,Literacy Rate,86.7
Maharashtra,2022,Literacy Rate,87.1
Karnataka,2021,Literacy Rate,82.3
Karnataka,2022,Literacy Rate,82.9
Tamil Nadu,2021,Literacy Rate,82.5
Tamil Nadu,2022,Literacy Rate,83.1
Gujarat,2021,Literacy Rate,79.5
Gujarat,2022,Literacy Rate,80.2
West Bengal,2021,Literacy Rate,77.1
West Bengal,2022,Literacy Rate,77.8
Uttar Pradesh,2021,Literacy Rate,70.3
Uttar Pradesh,2022,Literacy Rate,71.2`;

const statusNode = document.getElementById('status');
const kpiNode = document.getElementById('kpis');
const yearBarsNode = document.getElementById('yearBars');
const stateBarsNode = document.getElementById('stateBars');
const tableBody = document.querySelector('#dataTable tbody');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['state', 'year', 'indicator', 'value'];
  const missing = required.filter((name) => !headers.includes(name));

  if (missing.length) {
    throw new Error(`CSV missing required columns: ${missing.join(', ')}`);
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
    return {
      state: row.state,
      year: Number(row.year),
      indicator: row.indicator,
      value: Number(row.value),
    };
  }).filter((row) => row.state && Number.isFinite(row.year) && Number.isFinite(row.value));
}

function numberFmt(value, fraction = 1) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: fraction }).format(value);
}

function renderBars(node, pairs) {
  node.innerHTML = '';
  if (!pairs.length) {
    node.innerHTML = '<p>No rows to display.</p>';
    return;
  }

  const maxValue = Math.max(...pairs.map(([, value]) => value));

  pairs.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${label}</span>
      <div class="track"><div class="fill" style="width:${(value / maxValue) * 100}%"></div></div>
      <strong>${numberFmt(value)}</strong>
    `;
    node.appendChild(row);
  });
}

function groupAverage(rows, key) {
  const agg = new Map();

  rows.forEach((row) => {
    const current = agg.get(row[key]) || { sum: 0, count: 0 };
    current.sum += row.value;
    current.count += 1;
    agg.set(row[key], current);
  });

  return Array.from(agg.entries())
    .map(([name, { sum, count }]) => [name, sum / count])
    .sort((a, b) => b[1] - a[1]);
}

function renderTable(rows) {
  tableBody.innerHTML = '';
  rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.state}</td>
      <td>${row.year}</td>
      <td>${row.indicator}</td>
      <td>${numberFmt(row.value)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderDashboard(rows, label) {
  const states = new Set(rows.map((r) => r.state)).size;
  const years = new Set(rows.map((r) => r.year)).size;
  const indicators = new Set(rows.map((r) => r.indicator)).size;
  const avg = rows.reduce((sum, row) => sum + row.value, 0) / rows.length;

  kpiNode.innerHTML = `
    <article class="kpi"><p class="label">Rows</p><p class="value">${numberFmt(rows.length, 0)}</p></article>
    <article class="kpi"><p class="label">States</p><p class="value">${numberFmt(states, 0)}</p></article>
    <article class="kpi"><p class="label">Indicators</p><p class="value">${numberFmt(indicators, 0)}</p></article>
    <article class="kpi"><p class="label">Average Value</p><p class="value">${numberFmt(avg)}</p></article>
    <article class="kpi"><p class="label">Years Covered</p><p class="value">${numberFmt(years, 0)}</p></article>
  `;

  renderBars(yearBarsNode, groupAverage(rows, 'year').slice(0, 8));
  renderBars(stateBarsNode, groupAverage(rows, 'state').slice(0, 8));
  renderTable(rows);

  statusNode.textContent = `Showing ${rows.length} records from ${label}.`; 
}

async function loadFromUrl() {
  const url = document.getElementById('csvUrl').value.trim();
  if (!url) {
    statusNode.textContent = 'Add a CSV URL first.';
    return;
  }

  try {
    statusNode.textContent = 'Loading URL...';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const rows = parseCsv(text);
    renderDashboard(rows, 'URL CSV');
  } catch (error) {
    statusNode.textContent = `Failed to load URL: ${error.message}`;
  }
}

function loadFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseCsv(String(reader.result));
      renderDashboard(rows, file.name);
    } catch (error) {
      statusNode.textContent = `File error: ${error.message}`;
    }
  };
  reader.readAsText(file);
}

document.getElementById('loadUrlBtn').addEventListener('click', loadFromUrl);
document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

renderDashboard(parseCsv(sampleCsv), 'built-in NDAP sample dataset');
