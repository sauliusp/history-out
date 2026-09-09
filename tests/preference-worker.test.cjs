const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}, fileName: filename,
}).outputText, filename);
const {StorageService} = require('../src/services/StorageService.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => {resolve = a; reject = b;}); return {promise, resolve, reject}; };

function worker(set) {
  let receive;
  const chrome = {
    runtime: {id: 'historyout-test', getManifest: () => ({permissions: ['history', 'storage']}),
      onInstalled: {addListener() {}}, onMessage: {addListener(listener) {receive = listener;}}},
    action: {onClicked: {addListener() {}}}, storage: {local: {set}},
  };
  vm.runInNewContext(fs.readFileSync('extension-unpacked/background.js', 'utf8'), {chrome});
  return (message, response, id = chrome.runtime.id) => receive(message, {id}, response);
}

test('every change reaches the worker before prior writes finish and survives a closed sender', async () => {
  const first = deferred(), calls = [], stored = {}, submitted = [];
  const receive = worker(async updates => {
    calls.push(updates);
    if (calls.length === 1) await first.promise;
    Object.assign(stored, updates);
  });
  let senderOpen = true, replies = 0;
  global.chrome = {runtime: {sendMessage: message => {
    submitted.push(message);
    return new Promise(resolve => receive(message, result => {
      if (senderOpen) {replies++; resolve(result);}
    }));
  }}};
  const storage = StorageService.getInstance();
  void storage.savePreferences({format: 'csv'});
  await tick();
  assert.equal(calls.length, 1);
  void storage.savePreferences({format: 'html', historyRange: 'month'});
  assert.equal(submitted.length, 2, 'the panel must dispatch the latest change without awaiting the older write');
  senderOpen = false;
  delete global.chrome;
  first.resolve(); await tick(); await tick();
  assert.equal(replies, 0, 'the sender has no live continuation to run');
  assert.equal(calls.length, 2);
  assert.deepEqual(stored.HISTORY_OUTPUT_CONFIG, {format: 'html', historyRange: 'month'});
});

test('a failed worker write reports failure and does not block a newer preference change', async () => {
  let attempts = 0; const replies = [], stored = {};
  const receive = worker(async updates => {
    if (++attempts === 1) throw new Error('temporary storage failure');
    Object.assign(stored, updates);
  });
  receive({type: 'historyout:save-preferences', value: {format: 'csv'}}, result => replies.push(result.ok));
  receive({type: 'historyout:save-preferences', value: {format: 'json'}}, result => replies.push(result.ok));
  await tick(); await tick();
  assert.deepEqual(replies, [false, true]);
  assert.equal(stored.HISTORY_OUTPUT_CONFIG.format, 'json');
});

test('preference messages reject unrelated senders, message types and invalid values', async () => {
  const writes = [], replies = [];
  const receive = worker(async updates => writes.push(updates));
  const message = {type: 'historyout:save-preferences', value: {format: 'csv'}};
  assert.equal(receive(message, result => replies.push(result), 'other-extension'), false);
  assert.equal(receive({...message, type: 'unrelated'}, result => replies.push(result)), false);
  assert.equal(receive({...message, value: null}, result => replies.push(result)), false);
  await tick();
  assert.deepEqual(writes, []);
  assert.deepEqual(replies.map(result => result.ok), [false]);
});

test('a negative worker acknowledgement rejects the preference save', async () => {
  global.chrome = {runtime: {sendMessage: async () => ({ok: false})}};
  await assert.rejects(StorageService.getInstance().savePreferences({format: 'csv'}), /Preferences could not be saved/);
});
