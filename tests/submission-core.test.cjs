const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
}).outputText, filename);
const { HistoryService } = require('../src/services/HistoryService.ts');
const { StorageService } = require('../src/services/StorageService.ts');
const history = HistoryService.getInstance();
const range = { startTime: 100, endTime: 300 };
const visit = (id, visitTime = 200) => ({ id, visitId: id, referringVisitId: '0', visitTime, transition: 'link' });
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('a URL losing its retained visits between search and expansion does not invent rows or fail other results', async () => {
  const pages = [{ id: 'expired', url: 'https://expired.example/' }, { id: 'kept', url: 'https://kept.example/' }];
  const requested = [], progress = [];
  global.chrome = { history: {
    search: async () => pages,
    getVisits: async ({ url }) => { requested.push(url); return url === pages[0].url ? [] : [visit('kept-visit')]; },
  } };
  const result = await history.prepareHistoryItems(await history.getHistory(range), range, {
    onProgress: (done, total) => progress.push([done, total]),
  });
  assert.deepEqual(requested.sort(), pages.map(page => page.url).sort());
  assert.deepEqual(result.map(row => ({ id: row.id, order: row.order, timestamp: row.timestamp })), [{ id: 'kept', order: 1, timestamp: 200 }]);
  assert.deepEqual(progress, [[0, 2], [1, 2], [2, 2]]);
});

test('a late API failure rejects completed partial rows and suppresses late progress or queued requests', async () => {
  const pending = [], progress = [];
  global.chrome = { history: { getVisits: () => { const request = deferred(); pending.push(request); return request.promise; } } };
  const pages = Array.from({ length: 24 }, (_, index) => ({ id: String(index), url: `https://failure.example/${index}` }));
  const failure = new Error('browser history failed after partial progress');
  const result = history.prepareHistoryItems(pages, range, { onProgress: (done, total) => progress.push([done, total]) });
  const rejection = assert.rejects(result, error => error === failure);
  assert.equal(pending.length, 8);
  pending[0].resolve([visit('completed')]); await tick();
  assert.equal(pending.length, 9);
  assert.deepEqual(progress, [[0, 24], [1, 24]]);
  pending[1].reject(failure); await rejection;
  pending.slice(2).forEach((request, index) => request.resolve([visit(`late-${index}`)]));
  await tick();
  assert.equal(pending.length, 9, 'the failed operation must stop its queue');
  assert.deepEqual(progress, [[0, 24], [1, 24]], 'no partial success is published after failure');
});

test('slow successful preference writes cannot finish in the wrong order and overwrite a newer choice', async () => {
  const pending = [], requested = [], stored = {};
  global.chrome = { storage: { local: { set: async updates => {
    const request = deferred(); pending.push(request); requested.push(updates);
    await request.promise; Object.assign(stored, updates);
  } } } };
  const storage = StorageService.getInstance();
  const older = storage.set('submission-config', { format: 'csv' });
  const newer = storage.set('submission-config', { format: 'html' });
  await tick();
  assert.equal(pending.length, 1, 'a later write must wait for the earlier browser operation');
  pending[0].resolve(); await older; await tick();
  assert.equal(pending.length, 2);
  assert.deepEqual(stored['submission-config'], { format: 'csv' });
  pending[1].resolve(); await newer;
  assert.deepEqual(requested, [{ 'submission-config': { format: 'csv' } }, { 'submission-config': { format: 'html' } }]);
  assert.deepEqual(stored['submission-config'], { format: 'html' });
});

function lifecycleHarness() {
  let installed, clicked;
  const savedConfig = { format: 'json', historyRange: 'week', fields: { url: true, title: false } };
  const values = { HISTORY_OUTPUT_CONFIG: savedConfig }, opened = [];
  const failures = { read: false, lifecycleTab: false };
  const chrome = {
    action: { onClicked: { addListener(callback) { clicked = callback; } } },
    runtime: {
      getManifest: () => ({ version: '2.1.0', permissions: ['history', 'storage'] }),
      getURL: route => `chrome-extension://submission-fixture/${route}`,
      onInstalled: { addListener(callback) { installed = callback; } },
    },
    storage: { local: {
      get: async key => { if (failures.read) throw new Error('temporary storage failure'); return { [key]: values[key] }; },
      set: async updates => Object.assign(values, updates),
    } },
    tabs: { create: async options => {
      if (failures.lifecycleTab && /\/(welcome|updated)\.html$/.test(options.url)) throw new Error('temporary tab failure');
      opened.push(options.url);
    } },
  };
  vm.runInNewContext(fs.readFileSync('extension-unpacked/background.js', 'utf8'), { chrome });
  return { installed, clicked, values, savedConfig, opened, failures };
}

test('a failed upgrade-marker read does not alter v1 preferences or disable the toolbar and a retry recovers', async () => {
  const fixture = lifecycleHarness(); fixture.failures.read = true;
  await fixture.installed({ reason: 'update', previousVersion: '1.0.1' });
  assert.deepEqual(fixture.opened, []);
  assert.equal(fixture.values.historyoutOpenedVersion, undefined);
  assert.deepEqual(fixture.values.HISTORY_OUTPUT_CONFIG, fixture.savedConfig);
  await fixture.clicked();
  assert.deepEqual(fixture.opened, ['chrome-extension://submission-fixture/side-panel.html']);
  fixture.failures.read = false;
  await fixture.installed({ reason: 'update', previousVersion: '1.0.1' });
  assert.equal(fixture.opened.at(-1), 'chrome-extension://submission-fixture/updated.html');
  assert.equal(fixture.values.historyoutOpenedVersion, '2.1.0');
  await fixture.installed({ reason: 'update', previousVersion: '1.0.1' });
  assert.equal(fixture.opened.length, 2);
  assert.deepEqual(fixture.values.HISTORY_OUTPUT_CONFIG, fixture.savedConfig);
});

test('a failed welcome tab is not marked opened and cannot permanently poison lifecycle processing', async () => {
  const fixture = lifecycleHarness(); fixture.failures.lifecycleTab = true;
  await fixture.installed({ reason: 'install' });
  assert.deepEqual(fixture.opened, []);
  assert.equal(fixture.values.historyoutOpenedVersion, undefined);
  await fixture.clicked();
  assert.equal(fixture.opened[0], 'chrome-extension://submission-fixture/side-panel.html');
  fixture.failures.lifecycleTab = false;
  await fixture.installed({ reason: 'install' });
  assert.equal(fixture.opened.at(-1), 'chrome-extension://submission-fixture/welcome.html');
  assert.equal(fixture.values.historyoutOpenedVersion, '2.1.0');
  await fixture.installed({ reason: 'install' });
  assert.equal(fixture.opened.length, 2);
  assert.deepEqual(fixture.values.HISTORY_OUTPUT_CONFIG, fixture.savedConfig);
});
