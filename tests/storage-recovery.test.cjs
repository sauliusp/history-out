const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText, filename);
};
const { StorageService } = require('../src/services/StorageService.ts');
const CONFIG = 'HISTORY_OUTPUT_CONFIG';
const VIEWS = 'historyoutSavedViews';
// The actual 1.0.1 schema, with a user's nondefault choices.
const legacy = { format: 'json', historyRange: 'week', dateRange: null, fields: {
  order: true, id: false, date: true, time: true, title: true, url: true,
  visitCount: false, typedCount: false, transition: false,
} };
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

// Exercise the real component's hooks and event handlers with controlled storage
// promises. This is a state/effect test, not a substitute for browser rendering.
function mount(storage) {
  global.chrome = { storage: { local: storage }, history: { search: async () => [], getVisits: async () => [] } };
  const hooks = []; let cursor = 0, dirty = true, tree, effects = [], timerId = 0;
  const timers = new Map();
  const previousWindow = global.window;
  global.window = { setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } };
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const shim = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, next => {
        const value = typeof next === 'function' ? next(hooks[index].value) : next;
        if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return (hooks[index] ??= { current: initial }); },
    useMemo(fn, deps) { const index = cursor++; if (!hooks[index] || changed(hooks[index].deps, deps)) hooks[index] = { value: fn(), deps }; return hooks[index].value; },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!hooks[index] || changed(hooks[index].deps, deps)) {
        const prior = hooks[index]; hooks[index] = { deps, cleanup: prior?.cleanup };
        effects.push(() => { prior?.cleanup?.(); hooks[index].cleanup = fn(); });
      }
    },
  };
  const filename = path.resolve(__dirname, '../src/components/HistoryExporter.tsx');
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => {
    if (name === 'react') return shim;
    if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
    if (name.startsWith('@mui/icons-material/')) return function Icon() {};
    if (name.startsWith('./')) return { [name.slice(2)]: name.slice(2) };
    return Module.prototype.require.call(compiled, name);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true }, fileName: filename,
  }).outputText, filename);
  function render() {
    for (let loops = 0; dirty; loops++) {
      assert.ok(loops < 30, 'effects must settle');
      dirty = false; cursor = 0; effects = [];
      tree = compiled.exports.HistoryExporter();
      effects.forEach(fn => fn());
    }
  }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children), ...nodes(node.props?.action)];
  }
  const text = node => node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
  const find = predicate => { render(); return nodes(tree).find(predicate); };
  render();
  return {
    render, find, text,
    button(label) { return find(node => node.type === 'Button' && text(node) === label); },
    async settle() { for (let i = 0; i < 20; i++) { await Promise.resolve(); render(); } },
    async runTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); await this.settle(); },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); global.window = previousWindow; },
  };
}

for (const failedKey of [CONFIG, VIEWS]) {
  test(`failed startup read of ${failedKey} never overwrites preferences and Retry recovers`, async t => {
    const values = { [CONFIG]: clone(legacy), [VIEWS]: [] }; const writes = []; let fail = true;
    const h = mount({
      get: async key => { if (fail && key === failedKey) throw new Error('temporary read failure'); return { [key]: clone(values[key]) }; },
      set: async value => { writes.push(clone(value)); Object.assign(values, clone(value)); },
    }); t.after(() => h.unmount());
    await h.settle(); await h.runTimers();
    assert.equal(writes.length, 0);
    assert.deepEqual(values[CONFIG], legacy);
    assert.equal(h.button('Preview').props.disabled, true);
    assert.ok(h.button('Retry'));
    fail = false; h.button('Retry').props.onClick(); await h.settle();
    assert.equal(h.button('Preview').props.disabled, false);
    const restored = h.find(node => node.type === 'OutputSettings').props.config;
    assert.equal(restored.format, 'json'); assert.equal(restored.historyRange, 'week');
    assert.deepEqual(restored.fields, { ...legacy.fields, timestamp: false, domain: false });
    await h.runTimers();
    assert.equal(writes.length, 1);
    assert.deepEqual(values[CONFIG], restored);
  });
}

test('genuinely absent preferences use normal defaults and remain exportable', async t => {
  const writes = [];
  const h = mount({ get: async () => ({}), set: async value => { writes.push(value); } });
  t.after(() => h.unmount()); await h.settle();
  assert.equal(h.button('Preview').props.disabled, false);
  assert.equal(h.find(node => node.type === 'OutputSettings').props.config.historyRange, 'today');
  assert.equal(h.button('Retry'), undefined);
  await h.runTimers(); assert.equal(writes.length, 1);
});

test('failed preference writes keep export enabled and Retry saving persists the current choice', async t => {
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [] }; let fail = true;
  const h = mount({ get: async key => ({ [key]: clone(values[key]) }), set: async updates => {
    if (fail) throw new Error('temporary write failure'); Object.assign(values, clone(updates));
  } }); t.after(() => h.unmount()); await h.settle();
  h.find(node => node.type === 'OutputSettings').props.onConfigChange({ format: 'html' });
  h.render(); await h.runTimers();
  assert.equal(values[CONFIG].format, 'json');
  assert.equal(h.button('Preview').props.disabled, false);
  assert.equal(h.find(node => node.type === 'Button' && h.text(node).startsWith('Export history')).props.disabled, false);
  assert.ok(h.button('Retry saving'));
  fail = false; h.button('Retry saving').props.onClick(); h.render(); await h.runTimers();
  assert.equal(values[CONFIG].format, 'html');
  assert.equal(h.button('Retry saving'), undefined);
});

test('saved-view failures and overlapping clicks cannot announce success or discard an existing view', async t => {
  const existing = { id: '1', name: 'Existing', config: clone(legacy), query: '', domain: '', uniqueUrls: false, stripQuery: false };
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [existing] }; const pending = []; const writes = [];
  const h = mount({ get: async key => ({ [key]: clone(values[key]) }), set: async updates => {
    if (!(VIEWS in updates)) { Object.assign(values, clone(updates)); return; }
    const wait = deferred(); pending.push(wait); writes.push(clone(updates));
    await wait.promise; Object.assign(values, clone(updates));
  } }); t.after(() => h.unmount()); await h.settle();
  h.button('Save view').props.onClick(); h.render();
  h.find(node => node.type === 'TextField' && node.props.label === 'View name').props.onChange({ target: { value: 'New view' } }); h.render();
  const submit = h.find(node => node.props?.component === 'form').props.onSubmit;
  submit({ preventDefault() {} }); submit({ preventDefault() {} });
  h.find(node => node.type === 'Chip' && node.props.label === 'Existing').props.onDelete();
  await h.settle(); assert.equal(pending.length, 1);
  assert.equal(h.button('Preview').props.disabled, false, 'saving a view must not lock history loading');
  assert.equal(h.find(node => node.type === 'Chip' && node.props.label === 'New view'), undefined);
  assert.ok(!h.text(h.find(node => node.type === 'Alert')).includes('Saved “New view”'));
  pending[0].reject(new Error('write rejected')); await h.settle();
  assert.deepEqual(values[VIEWS], [existing]);
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('could not be saved')));
  h.find(node => node.props?.component === 'form').props.onSubmit({ preventDefault() {} }); await h.settle();
  assert.equal(pending.length, 2); pending[1].resolve(); await h.settle();
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('Saved “New view”')));
  assert.equal(values[VIEWS].length, 2);
  assert.deepEqual(Object.keys(values[VIEWS][0]).sort(), ['config', 'domain', 'id', 'name', 'query', 'stripQuery', 'uniqueUrls']);
  h.find(node => node.type === 'Chip' && node.props.label === 'Existing').props.onDelete(); await h.settle();
  assert.equal(values[VIEWS].length, 2);
  assert.ok(h.find(node => node.type === 'Chip' && node.props.label === 'Existing'));
  pending[2].reject(new Error('delete rejected')); await h.settle();
  assert.equal(values[VIEWS].length, 2);
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('could not be deleted')));
  h.find(node => node.type === 'Chip' && node.props.label === 'Existing').props.onDelete(); await h.settle();
  pending[3].resolve(); await h.settle();
  assert.equal(values[VIEWS].length, 1);
  assert.equal(h.find(node => node.type === 'Chip' && node.props.label === 'Existing'), undefined);
  assert.equal(writes.length, 4);
});

test('storage serializes each key, isolates unrelated keys, and retries after rejection', async () => {
  const first = deferred(); const called = []; const values = {};
  global.chrome = { storage: { local: { set: async updates => {
    called.push(updates);
    if (updates.config === 1) await first.promise;
    Object.assign(values, updates);
  } } } };
  const storage = StorageService.getInstance();
  const one = storage.set('config', 1);
  const rejected = assert.rejects(one, /first write failed/);
  const two = storage.set('config', 2);
  const other = storage.set('other', 3);
  await other;
  assert.deepEqual(called, [{ config: 1 }, { other: 3 }]);
  first.reject(new Error('first write failed'));
  await rejected; await two;
  assert.deepEqual(called, [{ config: 1 }, { other: 3 }, { config: 2 }]);
  assert.deepEqual(values, { config: 2, other: 3 });
});
