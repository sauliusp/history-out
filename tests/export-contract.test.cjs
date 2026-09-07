const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
}).outputText, filename);
const { ExportService } = require('../src/services/ExportService.ts');
const { HistoryService } = require('../src/services/HistoryService.ts');
const { filterHistory } = require('../src/utils/historyUtils.ts');
const exporter = ExportService.getInstance();
const columns = ['order', 'id', 'date', 'time', 'title', 'url', 'visitCount', 'typedCount', 'transition', 'timestamp', 'domain'];
const selected = keys => Object.fromEntries(columns.map(key => [key, keys.includes(key)]));
const row = {
  order: 1, id: '0007', date: '9/7/2026', time: '00:00:01',
  title: '=HYPERLINK("https://example.com", "Šaltinis")\r\nNotes <script>& "quoted"',
  url: 'https://example.com/report?part="one"&note=<two>#anchor',
  visitCount: 0, typedCount: 0, transition: 'typed', timestamp: 1788739201000, domain: 'example.com',
  privateExtraProperty: 'never export this',
};

function parseCSV(csv) {
  const rows = []; let cells = [], value = '', quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const c = csv[index];
    if (c === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index++; } else quoted = !quoted;
    } else if (c === ',' && !quoted) { cells.push(value); value = ''; }
    else if ((c === '\r' || c === '\n') && !quoted) {
      if (c === '\r' && csv[index + 1] === '\n') index++;
      cells.push(value); rows.push(cells); cells = []; value = '';
    } else value += c;
  }
  assert.equal(quoted, false); cells.push(value); rows.push(cells); return rows;
}

function parseHTMLRows(html) {
  const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
  return [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match => [...match[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell =>
    cell[1].replace(/^<a\b[^>]*>([\s\S]*)<\/a>$/, '$1').replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => entities[name])));
}

test('all 2,047 nonempty column selections preserve exact rows across CSV, JSON and HTML', t => {
  const missingOptional = { ...row, order: 2, title: 'Ordinary Unicode: 研究, Šaltinis', url: 'file:///local/history.html' };
  delete missingOptional.timestamp; delete missingOptional.domain;
  const rows = [row, missingOptional]; const unchanged = JSON.stringify(rows);
  for (let mask = 1; mask < 2 ** columns.length; mask++) {
    const keys = columns.filter((_, index) => mask & (1 << index));
    const fields = { ...selected(keys), privateExtraProperty: true };
    const json = JSON.parse(exporter.serializeData(rows, 'json', fields));
    assert.deepEqual(json, rows.map(item => Object.fromEntries(keys.map(key => [key, item[key] ?? '']))));
    const csv = parseCSV(exporter.serializeData(rows, 'csv', fields));
    assert.deepEqual(csv, [keys, ...rows.map((item, index) => keys.map(key =>
      (index === 0 && key === 'title' ? "'" : '') + String(item[key] ?? '')))]);
    const html = exporter.serializeData(rows, 'html', fields);
    assert.deepEqual(parseHTMLRows(html), rows.map(item => keys.map(key => String(item[key] ?? ''))));
    assert.equal((html.match(/<th scope="col"/g) || []).length, keys.length);
    assert.ok(!html.includes('<script>') && !html.includes('href="file:'));
    assert.ok(!html.includes('never export this'));
  }
  assert.equal(JSON.stringify(rows), unchanged);
  t.diagnostic('6,141 serializers checked: all field combinations, missing optional values, zero counts, Unicode, multiline/formula text, hostile markup, and excluded unknown data.');
});

for (const [zone, calendar, expectedStart, expectedEnd, hours] of [
  ['Europe/Vilnius', [2026, 3, 29], '2026-03-29T00:00:00+02:00', '2026-03-29T23:59:59.999+03:00', 23],
  ['Europe/Vilnius', [2026, 10, 25], '2026-10-25T00:00:00+03:00', '2026-10-25T23:59:59.999+02:00', 25],
  ['America/New_York', [2026, 11, 1], '2026-11-01T00:00:00-04:00', '2026-11-01T23:59:59.999-05:00', 25],
  ['Asia/Kathmandu', [2026, 9, 5], '2026-09-05T00:00:00+05:45', '2026-09-05T23:59:59.999+05:45', 24],
  ['UTC', [2026, 9, 5], '2026-09-05T00:00:00Z', '2026-09-05T23:59:59.999Z', 24],
]) {
  test(`custom-day boundaries, later revisits and filtered exports agree in ${zone} on ${calendar.join('-')}`, async () => {
    const originalZone = process.env.TZ, originalNow = Date.now;
    process.env.TZ = zone;
    try {
      const [year, month, day] = calendar;
      const range = { startTime: new Date(year, month - 1, day).getTime(), endTime: new Date(year, month - 1, day, 23, 59, 59, 999).getTime() };
      assert.equal(range.startTime, Date.parse(expectedStart)); assert.equal(range.endTime, Date.parse(expectedEnd));
      assert.equal(range.endTime - range.startTime + 1, hours * 60 * 60 * 1000);
      Date.now = () => range.endTime + 2 * 86400000;
      const urls = ['https://docs.example.com/report?source=old#top', 'https://docs.example.com/report?source=new', 'https://notexample.com/report', 'https://docs.example.com/unrelated'];
      const pages = urls.map((url, index) => ({ id: String(index), url, title: index === 3 ? 'Unrelated' : 'Research', lastVisitTime: range.endTime + 86400000, visitCount: 500, typedCount: 0 }));
      const times = [[range.startTime - 1, range.startTime, range.startTime + 3600000, range.endTime + 1], [range.endTime, range.endTime + 86400000], [range.endTime], [range.startTime]];
      global.chrome = { history: {
        search: async query => pages.filter(page => page.lastVisitTime >= query.startTime && page.lastVisitTime <= query.endTime),
        getVisits: async ({ url }) => times[urls.indexOf(url)].map((visitTime, index) => ({ id: '1', visitId: String(index), visitTime, transition: 'link' })),
      } };
      const history = HistoryService.getInstance();
      const prepared = await history.prepareHistoryItems(await history.getHistory(range), range);
      assert.equal(prepared.length, 5);
      assert.ok(prepared.some(item => item.timestamp === range.startTime));
      assert.ok(prepared.some(item => item.timestamp === range.endTime));
      assert.ok(prepared.every(item => item.timestamp >= range.startTime && item.timestamp <= range.endTime));
      const filtered = filterHistory(prepared, { query: ' research ', domain: 'example.com', uniqueUrls: true, stripQuery: true });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].url, 'https://docs.example.com/report');
      assert.equal(filtered[0].timestamp, range.endTime);
      assert.equal(filtered[0].visitCount, 500);
      assert.equal(filtered[0].date, new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(range.endTime));
      const keys = ['order', 'date', 'time', 'title', 'url', 'visitCount', 'timestamp'];
      const fields = selected(keys);
      const expected = keys.map(key => String(filtered[0][key]));
      assert.deepEqual(parseCSV(exporter.serializeData(filtered, 'csv', fields)), [keys, expected]);
      assert.deepEqual(parseHTMLRows(exporter.serializeData(filtered, 'html', fields)), [expected]);
      assert.deepEqual(JSON.parse(exporter.serializeData(filtered, 'json', fields)), [Object.fromEntries(keys.map(key => [key, filtered[0][key]]))]);
    } finally {
      Date.now = originalNow;
      if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone;
    }
  });
}

function downloadHarness(clickFailure = false) {
  const prior = { document: global.document, timeout: global.setTimeout, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const blobs = [], events = [], timers = [], anchors = [];
  URL.createObjectURL = blob => { blobs.push(blob); return 'blob:fixture'; };
  URL.revokeObjectURL = url => events.push(['revoke', url]);
  global.setTimeout = (fn, delay) => { timers.push({ fn, delay }); return 1; };
  global.document = {
    createElement(tag) { assert.equal(tag, 'a'); const anchor = { click() { events.push(['click']); if (clickFailure) throw new Error('download blocked'); }, remove() { events.push(['remove']); } }; anchors.push(anchor); return anchor; },
    body: { appendChild(anchor) { assert.ok(anchors.includes(anchor)); events.push(['append']); } },
  };
  return { blobs, events, timers, anchors, restore() { global.document = prior.document; global.setTimeout = prior.timeout; URL.createObjectURL = prior.create; URL.revokeObjectURL = prior.revoke; } };
}

test('download payloads use the correct MIME, selected schema and stable filename in every format', async () => {
  for (const format of ['csv', 'json', 'html']) {
    const h = downloadHarness();
    try {
      exporter.exportData([row], format, selected(['title', 'url', 'timestamp']));
      assert.equal(h.blobs.length, 1);
      assert.equal(h.blobs[0].type, { csv: 'text/csv;charset=utf-8', json: 'application/json;charset=utf-8', html: 'text/html;charset=utf-8' }[format]);
      assert.equal(await h.blobs[0].text(), exporter.serializeData([row], format, selected(['title', 'url', 'timestamp'])));
      assert.equal(h.anchors[0].download, `history-export.${format}`);
      assert.equal(h.anchors[0].href, 'blob:fixture');
      assert.deepEqual(h.events, [['append'], ['click'], ['remove']]);
      assert.equal(h.timers.length, 1); assert.equal(h.timers[0].delay, 1000);
      h.timers[0].fn(); assert.deepEqual(h.events.at(-1), ['revoke', 'blob:fixture']);
    } finally { h.restore(); }
  }
});

test('failed download clicks still release the temporary DOM node and Blob URL', () => {
  const h = downloadHarness(true);
  try {
    assert.throws(() => exporter.exportData([row], 'json', selected(['url'])), /download blocked/);
    assert.deepEqual(h.events, [['append'], ['click'], ['remove']]);
    h.timers[0].fn(); assert.deepEqual(h.events.at(-1), ['revoke', 'blob:fixture']);
  } finally { h.restore(); }
});

test('empty field selections and unsupported formats never create a download', () => {
  const h = downloadHarness();
  try {
    for (const format of ['csv', 'json', 'html']) assert.throws(() => exporter.exportData([row], format, selected([])), /Select at least one/);
    assert.throws(() => exporter.exportData([row], 'exe', selected(['url'])), /Unsupported format/);
    assert.deepEqual(h.blobs, []); assert.deepEqual(h.anchors, []); assert.deepEqual(h.timers, []);
  } finally { h.restore(); }
});
