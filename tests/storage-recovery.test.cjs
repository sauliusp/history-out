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
const locksByStorage = new WeakMap();
function sharedLocks(storage) {
  if (!locksByStorage.has(storage)) {
    const queues = new Map();
    locksByStorage.set(storage, { request(name, callback) {
      const prior = queues.get(name) ?? Promise.resolve();
      const next = prior.catch(() => {}).then(() => callback({ name, mode: 'exclusive' }));
      queues.set(name, next);
      return next;
    } });
  }
  return locksByStorage.get(storage);
}

// Exercise the real component's hooks and event handlers with controlled storage
// promises. This is a state/effect test, not a substitute for browser rendering.
function mount(storage, options = {}) {
  global.chrome = { storage: { local: storage }, history: { search: async () => [], getVisits: async () => [] } };
  const previousNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  Object.defineProperty(global, 'navigator', { configurable: true, value: { locks: options.locks === false ? undefined : sharedLocks(storage) } });
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
    unmount() {
      hooks.forEach(hook => hook?.cleanup?.()); global.window = previousWindow;
      if (previousNavigator) Object.defineProperty(global, 'navigator', previousNavigator); else delete global.navigator;
    },
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

test('the saved-view limit preserves all records, allows same-name updates, and accepts a new view after deletion', async t => {
  const existing = Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1), name: `View ${index + 1}`, config: clone(legacy),
    query: `research-${index + 1}`, domain: '', uniqueUrls: false, stripQuery: false,
  }));
  const values = { [CONFIG]: clone(legacy), [VIEWS]: clone(existing) }, writes = [];
  const h = mount({ get: async key => ({ [key]: clone(values[key]) }), set: async updates => {
    if (VIEWS in updates) writes.push(clone(updates[VIEWS]));
    Object.assign(values, clone(updates));
  } }); t.after(() => h.unmount()); await h.settle();
  const enterName = name => {
    h.find(node => node.type === 'TextField' && node.props.label === 'View name').props.onChange({ target: { value: name } });
    h.render();
  };
  const submit = async () => { h.find(node => node.props?.component === 'form').props.onSubmit({ preventDefault() {} }); await h.settle(); };
  h.button('Save view').props.onClick(); h.render(); enterName('Thirteenth view'); await submit();
  assert.equal(writes.length, 0, 'the thirteenth distinct name must not write or evict an existing view');
  assert.deepEqual(values[VIEWS], existing);
  existing.forEach(view => assert.ok(h.find(node => node.type === 'Chip' && node.props.label === view.name)));
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('Delete an existing view or reuse its name')));
  assert.equal(h.button('Preview').props.disabled, false);

  h.find(node => node.type === 'OutputSettings').props.onConfigChange({ format: 'html' }); h.render();
  enterName('vIeW 5'); await submit();
  assert.equal(writes.length, 1, 'case-insensitive reuse of an existing name is allowed at the limit');
  assert.equal(values[VIEWS].length, 12);
  assert.deepEqual(values[VIEWS].map(view => view.id).sort(), existing.map(view => view.id).sort());
  assert.equal(values[VIEWS].find(view => view.id === '5').config.format, 'html');
  for (const view of existing.filter(view => view.id !== '5')) {
    assert.deepEqual(values[VIEWS].find(saved => saved.id === view.id), {
      ...view, config: { ...view.config, fields: { ...view.config.fields, timestamp: false, domain: false } },
    });
  }

  h.find(node => node.type === 'Chip' && node.props.label === 'View 12').props.onDelete(); await h.settle();
  assert.equal(values[VIEWS].length, 11);
  h.button('Save view').props.onClick(); h.render(); enterName('Thirteenth view'); await submit();
  assert.equal(writes.length, 3);
  assert.equal(values[VIEWS].length, 12);
  assert.ok(values[VIEWS].some(view => view.name === 'Thirteenth view'));
  for (const view of existing.filter(view => view.id !== '12')) assert.ok(values[VIEWS].some(saved => saved.id === view.id));
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

const makeView = (id, name) => ({ id, name, config: clone(legacy), query: '', domain: '', uniqueUrls: false, stripQuery: false });
function nameView(h, name) {
  if (!h.find(node => node.type === 'TextField' && node.props.label === 'View name')) h.button('Save view').props.onClick();
  h.find(node => node.type === 'TextField' && node.props.label === 'View name').props.onChange({ target: { value: name } });
  h.render();
}
function submitView(h) { h.find(node => node.props?.component === 'form').props.onSubmit({ preventDefault() {} }); }

test('stale workspaces merge saved views and delete only the requested current record', async t => {
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [makeView('original', 'Original')] };
  const storage = {
    get: async key => ({ [key]: clone(values[key]) }),
    set: async updates => { Object.assign(values, clone(updates)); },
  };
  const a = mount(storage), b = mount(storage); t.after(() => { b.unmount(); a.unmount(); });
  await a.settle(); await b.settle();
  nameView(a, 'Window A'); submitView(a); await a.settle();
  nameView(b, 'Window B'); submitView(b); await b.settle();
  assert.deepEqual(values[VIEWS].map(view => view.name).sort(), ['Original', 'Window A', 'Window B']);
  assert.equal(new Set(values[VIEWS].map(view => view.id)).size, 3);
  a.find(node => node.type === 'Chip' && node.props.label === 'Original').props.onDelete(); await a.settle();
  assert.deepEqual(values[VIEWS].map(view => view.name).sort(), ['Window A', 'Window B']);
  // B still shows Original; saving from that stale snapshot must not resurrect it.
  nameView(b, 'Window C'); submitView(b); await b.settle();
  assert.deepEqual(values[VIEWS].map(view => view.name).sort(), ['Window A', 'Window B', 'Window C']);
  assert.deepEqual(values[CONFIG], legacy, 'saved-view transactions must not write general preferences');
});

test('overlapping cross-workspace saves hold the shared lock through the storage write', async t => {
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [] }, writes = [];
  const firstWrite = deferred(); let viewReads = 0;
  const storage = {
    get: async key => { if (key === VIEWS) viewReads++; return { [key]: clone(values[key]) }; },
    set: async updates => {
      if (VIEWS in updates) { writes.push(clone(updates[VIEWS])); if (writes.length === 1) await firstWrite.promise; }
      Object.assign(values, clone(updates));
    },
  };
  const a = mount(storage), b = mount(storage); t.after(() => { b.unmount(); a.unmount(); });
  await a.settle(); await b.settle();
  nameView(a, 'Window A'); nameView(b, 'Window B');
  const beforeReads = viewReads;
  submitView(a); submitView(b); await a.settle(); await b.settle();
  assert.equal(writes.length, 1);
  assert.equal(viewReads, beforeReads + 1, 'the queued workspace cannot read an old array while the first write is pending');
  assert.deepEqual(values[VIEWS], []);
  assert.equal(a.button('Preview').props.disabled, false); assert.equal(b.button('Preview').props.disabled, false);
  firstWrite.resolve(); await a.settle(); await b.settle();
  assert.equal(writes.length, 2); assert.equal(viewReads, beforeReads + 2);
  assert.deepEqual(values[VIEWS].map(view => view.name).sort(), ['Window A', 'Window B']);
  const ids = values[VIEWS].map(view => view.id); assert.equal(new Set(ids).size, 2);
  const stableId = values[VIEWS].find(view => view.name === 'Window A').id;
  a.find(node => node.type === 'OutputSettings').props.onConfigChange({ format: 'csv' }); a.render();
  b.find(node => node.type === 'OutputSettings').props.onConfigChange({ format: 'html' }); b.render();
  nameView(a, 'WINDOW A'); nameView(b, 'window a'); submitView(a); submitView(b);
  await a.settle(); await b.settle();
  assert.equal(values[VIEWS].length, 2, 'concurrent case-insensitive updates cannot create duplicate names');
  const updated = values[VIEWS].find(view => view.id === stableId);
  assert.equal(updated.name, 'window a'); assert.equal(updated.config.format, 'html');
  assert.deepEqual(values[VIEWS].map(view => view.id).sort(), ids.sort());
});

test('capacity uses the latest array across stale workspaces and releases the lock after rejection', async t => {
  const original = Array.from({ length: 11 }, (_, index) => makeView(`old-${index}`, `View ${index}`));
  const values = { [CONFIG]: clone(legacy), [VIEWS]: clone(original) }, writes = [];
  const storage = {
    get: async key => ({ [key]: clone(values[key]) }),
    set: async updates => { if (VIEWS in updates) writes.push(clone(updates[VIEWS])); Object.assign(values, clone(updates)); },
  };
  const a = mount(storage), b = mount(storage); t.after(() => { b.unmount(); a.unmount(); });
  await a.settle(); await b.settle();
  nameView(a, 'Twelfth'); nameView(b, 'Thirteenth'); submitView(a); submitView(b);
  await a.settle(); await b.settle();
  assert.equal(writes.length, 1); assert.equal(values[VIEWS].length, 12);
  assert.ok(values[VIEWS].some(view => view.name === 'Twelfth'));
  original.forEach(view => assert.ok(values[VIEWS].some(saved => saved.id === view.id)));
  assert.ok(b.find(node => node.type === 'Alert' && b.text(node).includes('You already have 12 saved views. Delete an existing view or reuse its name')));
  assert.ok(b.find(node => node.type === 'Chip' && node.props.label === 'Twelfth'), 'a rejected save refreshes the visible latest list');
  nameView(b, 'TWELFTH'); submitView(b); await b.settle();
  assert.equal(writes.length, 2); assert.equal(values[VIEWS].length, 12);
  assert.equal(values[VIEWS][0].id, writes[0][0].id, 'a stale case-insensitive overwrite preserves the existing ID at the limit');
  a.find(node => node.type === 'Chip' && node.props.label === 'View 0').props.onDelete(); await a.settle();
  nameView(b, 'Thirteenth'); submitView(b); await b.settle();
  assert.equal(values[VIEWS].length, 12);
  assert.ok(values[VIEWS].some(view => view.name === 'Thirteenth'));
  assert.ok(!values[VIEWS].some(view => view.id === 'old-0'));
});

test('missing Web Locks rejects saved-view mutations without an unsynchronized fallback', async t => {
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [makeView('original', 'Original')] };
  let viewReads = 0; const writes = [];
  const h = mount({
    get: async key => { if (key === VIEWS) viewReads++; return { [key]: clone(values[key]) }; },
    set: async updates => { writes.push(clone(updates)); Object.assign(values, clone(updates)); },
  }, { locks: false }); t.after(() => h.unmount()); await h.settle();
  const readCount = viewReads;
  nameView(h, 'New view'); submitView(h); await h.settle();
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('cannot safely change saved views across open windows')));
  h.find(node => node.type === 'Chip' && node.props.label === 'Original').props.onDelete(); await h.settle();
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('cannot safely change saved views across open windows')));
  assert.equal(viewReads, readCount); assert.deepEqual(writes, []);
  assert.deepEqual(values[VIEWS], [makeView('original', 'Original')]);
  assert.equal(h.button('Preview').props.disabled, false);
  assert.equal(h.find(node => node.type === 'Button' && h.text(node).startsWith('Export history')).props.disabled, false);
});

test('a mutation-time read failure performs no write and releases the lock so Retry can merge fresh data', async t => {
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [makeView('original', 'Original')] }, writes = [];
  let fail = false;
  const h = mount({
    get: async key => { if (key === VIEWS && fail) throw new Error('read failed inside lock'); return { [key]: clone(values[key]) }; },
    set: async updates => { writes.push(clone(updates)); Object.assign(values, clone(updates)); },
  }); t.after(() => h.unmount()); await h.settle();
  nameView(h, 'New view'); fail = true; submitView(h); await h.settle();
  assert.deepEqual(writes, []);
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('could not be saved')));
  values[VIEWS].push(makeView('other-window', 'Added elsewhere'));
  fail = false; submitView(h); await h.settle();
  assert.equal(writes.length, 1);
  assert.deepEqual(values[VIEWS].map(view => view.name).sort(), ['Added elsewhere', 'New view', 'Original']);
  assert.ok(h.find(node => node.type === 'Alert' && h.text(node).includes('Saved “New view”')));
});

test('a generated ID collision is retried without replacing an unrelated saved view', async t => {
  const previousCrypto = Object.getOwnPropertyDescriptor(global, 'crypto'); let calls = 0;
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => ++calls === 1 ? 'existing-id' : 'new-unique-id' } });
  t.after(() => { if (previousCrypto) Object.defineProperty(global, 'crypto', previousCrypto); else delete global.crypto; });
  const values = { [CONFIG]: clone(legacy), [VIEWS]: [makeView('existing-id', 'Existing')] };
  const h = mount({ get: async key => ({ [key]: clone(values[key]) }), set: async updates => { Object.assign(values, clone(updates)); } });
  t.after(() => h.unmount()); await h.settle();
  nameView(h, 'New view'); submitView(h); await h.settle();
  assert.equal(calls, 2);
  assert.deepEqual(values[VIEWS].map(view => [view.id, view.name]), [['new-unique-id', 'New view'], ['existing-id', 'Existing']]);
});
