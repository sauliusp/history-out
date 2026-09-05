const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise the actual TypeScript services with Chrome mocked at the API boundary.
// No build output or extra test dependency is needed.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { HistoryService } = require('../src/services/HistoryService.ts');
const { ExportService } = require('../src/services/ExportService.ts');
const { StorageService } = require('../src/services/StorageService.ts');
const { filterHistory, summarizeHistory } = require('../src/utils/historyUtils.ts');
const { DEFAULT_OUTPUT_CONFIG, normalizeOutputConfig, isValidDateRange } = require('../src/utils/outputConfig.ts');
const history = HistoryService.getInstance();
const exporter = ExportService.getInstance();
const range = { startTime: 100, endTime: 300 };
const row = (overrides = {}) => ({
  order: 1, id: '1', date: '9/5/2026', time: '12:00:00', title: 'Page',
  url: 'https://example.com/page', visitCount: 100, typedCount: 5,
  transition: 'link', timestamp: 200, domain: 'example.com', ...overrides,
});
const visit = (timestamp, id = String(timestamp)) => ({
  id: '1', visitId: id, referringVisitId: '0', visitTime: timestamp, transition: 'link',
});
const fields = (...keys) => Object.fromEntries(Object.keys(DEFAULT_OUTPUT_CONFIG.fields).map(key => [key, keys.includes(key)]));
const pause = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

test.beforeEach(() => {
  global.chrome = { history: { search: async () => [], getVisits: async () => [] } };
});

test('past ranges include a URL revisited after the range and emit only in-range visits', async () => {
  const revisited = { id: '1', title: 'Revisited', url: 'https://example.com', lastVisitTime: 900, visitCount: 3 };
  chrome.history.search = async query => {
    assert.ok(query.endTime > range.endTime, 'candidate search must include later revisits');
    return revisited.lastVisitTime >= query.startTime && revisited.lastVisitTime <= query.endTime ? [revisited] : [];
  };
  chrome.history.getVisits = async () => [visit(900), visit(200), visit(50)];
  const result = await history.prepareHistoryItems(await history.getHistory(range), range);
  assert.equal(result.length, 1);
  assert.equal(result[0].timestamp, 200);
  assert.equal(result[0].visitCount, 3, 'URL lifetime count is preserved, not relabelled as range count');
});

test('visit boundaries are inclusive and unknown, NaN, and out-of-range visit times are excluded', async () => {
  chrome.history.getVisits = async () => [visit(99), visit(100), visit(300), visit(301), visit(undefined), visit(NaN)];
  assert.deepEqual((await history.getVisits('https://example.com', range)).map(item => item.visitTime), [100, 300]);
});

test('invalid ranges are rejected before calling Chrome', async () => {
  let calls = 0;
  chrome.history.search = async () => { calls++; return []; };
  for (const invalid of [{startTime: NaN,endTime: 3}, {startTime: 5,endTime: 3}, {startTime: -1,endTime: 3}]) {
    await assert.rejects(history.getHistory(invalid), /valid start and end date/);
  }
  assert.equal(calls, 0);
});

test('a candidate result limit fails explicitly instead of silently producing a partial export', async () => {
  chrome.history.search = async () => new Array(1000000);
  await assert.rejects(history.getHistory(range), /too many pages/);
});

test('worker pool bounds Chrome calls, reports progress, and gives deterministic order', async () => {
  let active = 0;
  let peak = 0;
  const progress = [];
  const pages = Array.from({ length: 24 }, (_, i) => ({ id: String(i), url: `https://example.com/${String(i).padStart(2, '0')}` }));
  chrome.history.getVisits = async ({ url }) => {
    active++; peak = Math.max(peak, active);
    await pause(Number(url.slice(-2)) % 4);
    active--;
    return [visit(200)];
  };
  const result = await history.prepareHistoryItems(pages, range, { onProgress: (done, total) => progress.push([done, total]) });
  assert.ok(peak > 1 && peak <= 8);
  assert.deepEqual(result.map(item => item.url), pages.map(item => item.url));
  assert.deepEqual(progress, Array.from({ length: 25 }, (_, i) => [i, 24]));
  assert.deepEqual(result.map(item => item.order), Array.from({ length: 24 }, (_, i) => i + 1));
});

test('duplicate or missing candidate URLs do not duplicate visits; duplicate visit IDs are skipped', async () => {
  let calls = 0;
  chrome.history.getVisits = async () => { calls++; return [visit(200), visit(200), visit(200, 'other-visit')]; };
  const result = await history.prepareHistoryItems([{id:'a'}, {id:'b',url:'https://example.com'}, {id:'b',url:'https://example.com'}], range);
  assert.equal(calls, 1);
  assert.equal(result.length, 2);
});

test('cancellation returns promptly, discards pending work, and starts no more API calls', async () => {
  const controller = new AbortController();
  const pending = [];
  let calls = 0;
  chrome.history.getVisits = () => { calls++; return new Promise(resolve => pending.push(resolve)); };
  const pages = Array.from({length: 40}, (_, i) => ({id: String(i),url:`https://example.com/${i}`}));
  const result = history.prepareHistoryItems(pages, range, {signal: controller.signal});
  controller.abort();
  await assert.rejects(result, {name:'AbortError'});
  assert.equal(calls, 8);
  pending.forEach(resolve => resolve([visit(200)]));
  await pause();
  assert.equal(calls, 8);
});

test('candidate search is cancellable and pre-cancelled work never calls Chrome', async () => {
  let calls = 0;
  let finish;
  chrome.history.search = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const controller = new AbortController();
  const pending = history.getHistory(range, {signal: controller.signal});
  controller.abort();
  await assert.rejects(pending, {name:'AbortError'});
  finish([]);
  await assert.rejects(history.getHistory(range, {signal: controller.signal}), {name:'AbortError'});
  await assert.rejects(history.prepareHistoryItems([], range, {signal: controller.signal}), {name:'AbortError'});
  assert.equal(calls, 1);
});

test('API failure rejects the export and prevents queued calls from continuing', async () => {
  let calls = 0;
  chrome.history.getVisits = async () => { calls++; throw new Error('Chrome unavailable'); };
  await assert.rejects(history.prepareHistoryItems(Array.from({length:30}, (_,i) => ({id:String(i),url:`https://example.com/${i}`})), range), /Chrome unavailable/);
  await pause();
  assert.ok(calls <= 8);
});

test('empty history is safe throughout preparation, summaries, and each export format', async () => {
  assert.deepEqual(await history.prepareHistoryItems([], range), []);
  assert.deepEqual(summarizeHistory([]), {visits:0,uniquePages:0,domains:0,topDomains:[]});
  assert.equal(exporter.serializeData([], 'json', fields('url')), '[]');
  assert.equal(exporter.serializeData([], 'csv', fields('url')), 'url');
  assert.match(exporter.serializeData([], 'html', fields('url')), /<tbody><\/tbody>/);
});

test('search matches title or original URL without changing input and renumbers output', () => {
  const input = [row({title:'Research notes',timestamp:100}),row({order:2,url:'https://other.com/?topic=research',timestamp:200}),row({order:3,title:'Unrelated',url:'https://other.com/2'})];
  const before = JSON.stringify(input);
  const result = filterHistory(input, {query:' RESEARCH '});
  assert.deepEqual(result.map(item => item.order), [1,2]);
  assert.equal(result[0].url, 'https://other.com/?topic=research');
  assert.equal(JSON.stringify(input), before);
});

test('domain matching includes true subdomains and excludes similar names and malformed inputs', () => {
  const urls = ['https://example.com/a','https://docs.example.com/b','https://notexample.com/c','https://example.com.evil.test/d','https://EXAMPLE.COM./e'];
  assert.deepEqual(filterHistory(urls.map(url => row({url})), {domain:'EXAMPLE.COM'}).map(item => item.url).sort(), [urls[0],urls[1],urls[4]].sort());
  assert.deepEqual(filterHistory([row()], {domain:'not a hostname'}), []);
});

test('query cleanup precedes deduplication and retains the latest matching visit', () => {
  const input = [row({timestamp:100,title:'Old',url:'https://example.com/a?campaign=1#top'}), row({timestamp:250,title:'Latest',url:'https://example.com/a?campaign=2'}), row({timestamp:200,url:'https://example.com/b'})];
  assert.equal(filterHistory(input,{uniqueUrls:true}).length,3);
  const cleaned = filterHistory(input,{uniqueUrls:true,stripQuery:true});
  assert.equal(cleaned.length,2);
  assert.equal(cleaned[0].title,'Latest');
  assert.equal(cleaned[0].url,'https://example.com/a');
  assert.match(input[0].url,/campaign/);
});

test('summary counts retained visit rows, distinct URLs, and hostnames, not lifetime metadata', () => {
  const summary = summarizeHistory([row(),row(),row({url:'https://docs.example.com/page'}),row({url:'file:///tmp/example'})]);
  assert.deepEqual(summary, {visits:4,uniquePages:3,domains:2,topDomains:[{domain:'example.com',visits:2},{domain:'docs.example.com',visits:1}]});
});

function parseCSV(csv) {
  const rows = []; let currentRow = []; let cell = ''; let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { currentRow.push(cell); cell = ''; }
    else if ((c === '\r' || c === '\n') && !quoted) {
      if (c === '\r' && csv[i + 1] === '\n') i++;
      currentRow.push(cell); rows.push(currentRow); currentRow = []; cell = '';
    } else cell += c;
  }
  currentRow.push(cell); rows.push(currentRow);
  assert.equal(quoted,false,'CSV must finish outside a quoted cell');
  return rows;
}

test('CSV roundtrips commas, quotes, newlines and Unicode in exactly one cell', () => {
  const title = 'Research, "quotes"\r\nSecond line\nŠaltinis';
  const data = exporter.serializeData([row({title})], 'csv', fields('title','url'));
  assert.deepEqual(parseCSV(data), [['title','url'], [title,'https://example.com/page']]);
});

test('CSV neutralizes formulas including whitespace prefixes without converting numeric values', () => {
  const titles = ['=1+1','+SUM(A1)','-1+2','@SUM(A1)',' \t=HYPERLINK("https://evil.test")','\tplain','\r\n=1','\u0000=1'];
  const output = parseCSV(exporter.serializeData(titles.map(title => row({title,visitCount:0})), 'csv', fields('title','visitCount')));
  titles.forEach((title,i) => assert.deepEqual(output[i + 1], [`'${title}`,'0']));
  assert.deepEqual(parseCSV(exporter.serializeData([row({title:'Ordinary - text'})], 'csv', fields('title')))[1], ['Ordinary - text']);
});

test('HTML escapes hostile text and attributes and never links executable URL schemes', () => {
  const title = '<img src=x onerror="alert(1)"><script>alert(1)</script>&';
  const url = 'https://example.com/" onclick="alert(1)';
  const html = exporter.serializeData([row({title,url}),row({url:'javascript:alert(1)'}),row({url:'data:text/html,<script>alert(1)</script>'})], 'html', fields('title','url'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="data:'));
  assert.match(html,/&lt;img/);
  assert.match(html,/&quot; onclick=&quot;/);
  assert.match(html,/rel="noopener noreferrer"/);
  assert.match(html,/Content-Security-Policy/);
});

test('default exports preserve v1 columns, and selected new fields have stable ordering', () => {
  const output = JSON.parse(exporter.serializeData([row()], 'json', DEFAULT_OUTPUT_CONFIG.fields));
  assert.deepEqual(Object.keys(output[0]), ['order','id','date','time','title','url','visitCount','typedCount','transition']);
  const selected = {...fields(), domain:true, timestamp:true, url:true};
  assert.deepEqual(Object.keys(JSON.parse(exporter.serializeData([row()], 'json', selected))[0]), ['url','timestamp','domain']);
  assert.throws(() => exporter.serializeData([row()], 'csv', fields()), /at least one/);
});

test('v1 settings migrate selected fields without silently opting into new columns', () => {
  const legacy = {format:'json',historyRange:'custom',dateRange:{startTime:1,endTime:2},fields:{...DEFAULT_OUTPUT_CONFIG.fields,title:false,id:false}};
  delete legacy.fields.timestamp; delete legacy.fields.domain;
  const migrated = normalizeOutputConfig(legacy);
  assert.equal(migrated.format,'json');
  assert.equal(migrated.fields.title,false);
  assert.equal(migrated.fields.id,false);
  assert.equal(migrated.fields.timestamp,false);
  assert.equal(migrated.fields.domain,false);
  assert.deepEqual(migrated.dateRange,{startTime:1,endTime:2});
  assert.notEqual(migrated.dateRange,legacy.dateRange);
  assert.equal(exporter.isConfigValid(migrated),true);
});

test('corrupt preferences and unexpected properties are normalized to safe known values', () => {
  const config = normalizeOutputConfig({format:'exe',historyRange:'bad',dateRange:{startTime:3,endTime:1},fields:{url:false,title:'true',intruder:true}});
  assert.equal(config.format,'csv');
  assert.equal(config.historyRange,'today');
  assert.equal(config.dateRange,null);
  assert.equal(config.fields.url,false);
  assert.equal(config.fields.title,true);
  assert.equal('intruder' in config.fields,false);
  assert.equal(isValidDateRange({startTime:0,endTime:Infinity}),false);
  assert.equal(normalizeOutputConfig({historyRange:'custom',dateRange:{startTime:3,endTime:1}}).dateRange,null);
  assert.equal(exporter.isConfigValid({...config,format:'exe'}),false);
  assert.deepEqual(normalizeOutputConfig(null),DEFAULT_OUTPUT_CONFIG);
});

test('storage preserves false and zero preference values', async () => {
  chrome.storage = {local:{get:async key => ({[key]: key === 'enabled' ? false : 0})}};
  const storage = StorageService.getInstance();
  assert.equal(await storage.get('enabled'),false);
  assert.equal(await storage.get('count'),0);
});

test('today and yesterday are local calendar days across daylight-saving transitions', () => {
  const { getRangeFromType } = require('../src/utils/dateUtils.ts');
  const previousTZ = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const spring = getRangeFromType('yesterday', Date.parse('2026-03-09T12:00:00-04:00'));
    assert.equal(spring.startTime, Date.parse('2026-03-08T00:00:00-05:00'));
    assert.equal(spring.endTime, Date.parse('2026-03-08T23:59:59.999-04:00'));
    assert.equal(spring.endTime - spring.startTime + 1, 23 * 60 * 60 * 1000);
    const fall = getRangeFromType('yesterday', Date.parse('2026-11-02T12:00:00-05:00'));
    assert.equal(fall.endTime - fall.startTime + 1, 25 * 60 * 60 * 1000);
    const now = Date.parse('2026-09-05T18:12:00-04:00');
    const today = getRangeFromType('today', now);
    assert.deepEqual(today, {startTime:Date.parse('2026-09-05T00:00:00-04:00'),endTime:now});
    assert.equal(getRangeFromType('day',now).endTime - getRangeFromType('day',now).startTime,86400000);
    assert.equal(normalizeOutputConfig({historyRange:'today'}).historyRange,'today');
    assert.equal(normalizeOutputConfig({historyRange:'yesterday'}).historyRange,'yesterday');
  } finally {
    if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ;
  }
});

test('cancellation is honored while expanding a heavily visited single URL', async () => {
  const controller = new AbortController();
  chrome.history.getVisits = async () => Array.from({length:4000}, (_, i) => visit(200, String(i)));
  const pending = history.prepareHistoryItems([{id:'1',url:'https://example.com'}], range, {signal:controller.signal});
  setTimeout(() => controller.abort(),0);
  await assert.rejects(pending,{name:'AbortError'});
});

test('a fresh install starts at Today and a saved v1 rolling week remains a rolling week', () => {
  assert.equal(normalizeOutputConfig(null).historyRange,'today');
  assert.equal(normalizeOutputConfig({...DEFAULT_OUTPUT_CONFIG,historyRange:'week'}).historyRange,'week');
});
