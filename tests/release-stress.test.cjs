const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { HistoryService } = require('../src/services/HistoryService.ts');
const { ExportService } = require('../src/services/ExportService.ts');
const { filterHistory, summarizeHistory } = require('../src/utils/historyUtils.ts');
const { DEFAULT_OUTPUT_CONFIG } = require('../src/utils/outputConfig.ts');
const history = HistoryService.getInstance();
const exporter = ExportService.getInstance();
const range = { startTime: Date.UTC(2026, 8, 1), endTime: Date.UTC(2026, 8, 2) };
const fields = Object.fromEntries(Object.keys(DEFAULT_OUTPUT_CONFIG.fields)
  .map(key => [key, ['order', 'title', 'url', 'timestamp', 'domain'].includes(key)]));
const tick = () => new Promise(resolve => setImmediate(resolve));
const hash = value => createHash('sha256').update(value).digest('hex');
const rounded = value => Math.round(value * 100) / 100;
const visit = (id, time) => ({ id: String(id), visitId: String(id), referringVisitId: '0', visitTime: time, transition: 'link' });
const pagesFor = (count, prefix) => Array.from({ length: count }, (_, i) => ({ id: String(i), url: `https://${prefix}.example/${i}` }));

async function waitFor(predicate) {
  const start = performance.now();
  while (!predicate()) {
    assert.ok(performance.now() - start < 2000, 'controlled work should settle promptly');
    await tick();
  }
}

function parseCSV(csv) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\r' || character === '\n') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  row.push(cell); rows.push(row);
  assert.equal(quoted, false);
  return rows;
}

test.beforeEach(() => {
  global.chrome = { history: { search: async () => [], getVisits: async () => [] } };
});

test('10,000 URLs and 30,000 visits preserve complete deterministic exports and filtered latest pages', async t => {
  const started = performance.now();
  const pages = Array.from({ length: 10000 }, (_, index) => {
    const group = Math.floor(index / 2);
    const host = `${group % 3 === 0 ? 'docs.' : ''}site${group % 20}.example`;
    return {
      id: String(index),
      title: `${group % 3 === 0 ? 'Research' : 'General'} "plan", page ${group}\nŠaltinis`,
      url: `https://${host}/page/${group}?variant=${index % 2}#section`,
      lastVisitTime: range.endTime + 1000,
      visitCount: 500,
      typedCount: 17,
    };
  });
  let active = 0;
  let peak = 0;
  let calls = 0;
  let backwards = false;
  chrome.history.search = async query => {
    assert.ok(query.endTime > range.endTime, 'later revisits remain candidate URLs');
    return [...(backwards ? [...pages].reverse() : pages), pages[0], { id: 'missing-url' }];
  };
  chrome.history.getVisits = async ({ url }) => {
    calls++; active++; peak = Math.max(peak, active);
    try {
      const index = Number(new URL(url).searchParams.get('variant')) + Number(new URL(url).pathname.split('/').at(-1)) * 2;
      if (index % 7 === (backwards ? 3 : 0)) await tick();
      const valid = Array.from({ length: 3 }, (_, offset) => visit(`${index}-${offset}`, range.startTime + 1000 + offset * 60000 + index % 100));
      const visits = [visit(`${index}-before`, range.startTime - 1), ...valid, valid[0], visit(`${index}-after`, range.endTime + 1), visit(`${index}-invalid`, NaN)];
      return backwards ? visits.reverse() : visits;
    } finally { active--; }
  };
  const progress = [];
  const firstStarted = performance.now();
  const first = await history.prepareHistoryItems(await history.getHistory(range), range, {
    onProgress: (completed, total) => progress.push([completed, total]),
  });
  const firstLoadMs = performance.now() - firstStarted;
  assert.equal(first.length, 30000);
  assert.equal(calls, 10000, 'duplicate or missing candidate URLs add no API work');
  assert.equal(active, 0);
  assert.ok(peak > 1 && peak <= 8, `peak API concurrency was ${peak}`);
  assert.equal(progress.length, 10001);
  progress.forEach(([completed, total], index) => {
    assert.equal(completed, index);
    assert.equal(total, 10000);
  });
  assert.equal(new Set(first.map(row => `${row.id}/${row.timestamp}`)).size, 30000);
  first.forEach((row, index) => {
    assert.equal(row.order, index + 1);
    assert.ok(row.timestamp >= range.startTime && row.timestamp <= range.endTime);
    assert.equal(row.visitCount, 500, 'lifetime count is not multiplied or relabeled');
    if (index) assert.ok(first[index - 1].timestamp >= row.timestamp);
  });
  const summary = summarizeHistory(first);
  assert.equal(summary.visits, 30000);
  assert.equal(summary.uniquePages, 10000);
  assert.equal(summary.domains, 40);
  assert.equal(summary.topDomains.reduce((sum, domain) => sum + domain.visits, 0), 30000);

  const filterStarted = performance.now();
  const latest = filterHistory(first, { stripQuery: true, uniqueUrls: true });
  assert.equal(latest.length, 5000);
  latest.forEach(row => {
    assert.equal(Number(row.id) % 2, 1, 'the newer query variant must win after cleanup');
    assert.ok(!/[?#]/.test(row.url));
    assert.equal(row.timestamp, range.startTime + 121000 + Number(row.id) % 100);
  });
  const filtered = filterHistory(first, { query: ' RESEARCH ', domain: 'site3.example', stripQuery: true, uniqueUrls: true });
  const expectedGroups = Array.from({ length: 5000 }, (_, group) => group).filter(group => group % 20 === 3 && group % 3 === 0);
  assert.equal(filtered.length, expectedGroups.length);
  assert.deepEqual(filtered.map(row => Number(row.url.split('/').at(-1))).sort((a, b) => a - b), expectedGroups);
  assert.ok(filtered.every(row => row.domain === 'docs.site3.example'));
  assert.equal(first.filter(row => /[?#]/.test(row.url)).length, 30000, 'filtering does not mutate original URLs');
  const filterMs = performance.now() - filterStarted;

  backwards = true;
  const secondStarted = performance.now();
  const second = await history.prepareHistoryItems(await history.getHistory(range), range);
  const reorderedLoadMs = performance.now() - secondStarted;
  assert.equal(calls, 20000);
  assert.deepEqual(second, first, 'candidate order, visit order, and asynchronous completion cannot change the export');
  const serialization = {};
  for (const format of ['json', 'csv', 'html']) {
    const exportStarted = performance.now();
    const output = exporter.serializeData(first, format, fields);
    const elapsedMs = performance.now() - exportStarted;
    assert.equal(hash(output), hash(exporter.serializeData(second, format, fields)));
    if (format === 'json') {
      const parsed = JSON.parse(output);
      assert.equal(parsed.length, 30000);
      parsed.forEach((row, index) => assert.deepEqual(row, {
        order: index + 1, title: first[index].title, url: first[index].url,
        timestamp: first[index].timestamp, domain: first[index].domain,
      }));
    } else if (format === 'csv') {
      const parsed = parseCSV(output);
      assert.deepEqual(parsed[0], ['order', 'title', 'url', 'timestamp', 'domain']);
      assert.equal(parsed.length, 30001);
      parsed.slice(1).forEach((row, index) => assert.deepEqual(row, [
        String(index + 1), first[index].title, first[index].url,
        String(first[index].timestamp), first[index].domain,
      ]));
    } else {
      assert.equal((output.match(/<tr>/g) || []).length, 30001);
      assert.equal((output.match(/<td>/g) || []).length, 150000);
      assert.equal((output.match(/<a target=/g) || []).length, 30000);
    }
    serialization[format] = { elapsed_ms: rounded(elapsedMs), bytes: Buffer.byteLength(output), sha256: hash(output) };
  }
  t.diagnostic(JSON.stringify({
    dataset: { candidate_urls: 10000, output_visits: 30000, unique_clean_pages: 5000, combined_filter_pages: filtered.length },
    first_load_ms: rounded(firstLoadMs), reordered_load_ms: rounded(reorderedLoadMs),
    filter_validation_ms: rounded(filterMs), peak_api_concurrency: peak,
    serialization, total_test_ms: rounded(performance.now() - started),
    note: 'Synthetic API-boundary timing on this machine, not a Chrome UI latency guarantee.',
  }));
});

test('canceling a 10,000-URL load discards late API work while a new load succeeds', async t => {
  const controller = new AbortController();
  const pending = [];
  const progress = [];
  chrome.history.getVisits = ({ url }) => {
    if (url.includes('recovery.example')) return Promise.resolve([visit(url, range.startTime + 1)]);
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  };
  const canceled = history.prepareHistoryItems(pagesFor(10000, 'cancel'), range, {
    signal: controller.signal, onProgress: (done, total) => progress.push([done, total]),
  });
  assert.equal(pending.length, 8);
  pending.slice(0, 4).forEach(({ resolve }, index) => resolve([visit(index, range.startTime + 1)]));
  await waitFor(() => pending.length === 12);
  const progressBeforeAbort = progress.length;
  const abortStarted = performance.now();
  controller.abort();
  await assert.rejects(canceled, { name: 'AbortError' });
  const abortMs = performance.now() - abortStarted;
  const recovered = await history.prepareHistoryItems(pagesFor(256, 'recovery'), range);
  assert.equal(recovered.length, 256);
  pending.slice(4).forEach(({ resolve, reject }, index) => {
    if (index % 2) reject(new Error('late browser error after cancellation'));
    else resolve([visit(index, range.startTime + 1)]);
  });
  await tick();
  assert.equal(pending.length, 12, 'canceling starts no additional queued API calls');
  assert.equal(progress.length, progressBeforeAbort, 'late responses cannot report completed canceled work');
  assert.ok(abortMs < 1000, 'cancellation must not wait for pending Chrome API responses');
  t.diagnostic(JSON.stringify({ candidate_urls: 10000, api_calls_before_cancel: 12, late_api_responses_discarded: 8, recovery_visits: recovered.length, abort_ms: rounded(abortMs) }));
});

test('one failed 10,000-URL load cannot leak partial progress or fail an overlapping successful load', async t => {
  const pending = [];
  const progress = [];
  chrome.history.getVisits = ({ url }) => {
    if (url.includes('healthy.example')) return Promise.resolve(Array.from({ length: 3 }, (_, index) => visit(`${url}-${index}`, range.startTime + index)));
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  };
  const failed = history.prepareHistoryItems(pagesFor(10000, 'failure'), range, { onProgress: (done, total) => progress.push([done, total]) });
  const successful = history.prepareHistoryItems(pagesFor(256, 'healthy'), range);
  assert.equal(pending.length, 8);
  const failure = new Error('Chrome history API temporarily unavailable');
  const failureStarted = performance.now();
  pending[3].reject(failure);
  await assert.rejects(failed, error => error === failure);
  const failureMs = performance.now() - failureStarted;
  assert.equal((await successful).length, 768);
  pending.forEach(({ resolve, reject }, index) => {
    if (index === 3) return;
    if (index % 2) reject(new Error('late concurrent failure'));
    else resolve([visit(index, range.startTime + 1)]);
  });
  await tick();
  assert.equal(pending.length, 8, 'failed loads stop their queued API work');
  assert.deepEqual(progress, [[0, 10000]], 'late responses cannot publish a partial failed result');
  assert.ok(failureMs < 1000, 'failure must not wait for unrelated pending Chrome API responses');
  t.diagnostic(JSON.stringify({ failed_candidate_urls: 10000, failed_load_api_calls: 8, overlapping_success_visits: 768, rejection_ms: rounded(failureMs) }));
});
