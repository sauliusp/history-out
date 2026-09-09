const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true}, fileName: filename,
}).outputText, filename);
const {DateRangePicker} = require('../src/components/DateRangePicker.tsx');
const {normalizeOutputConfig} = require('../src/utils/outputConfig.ts');
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => node == null ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);

for (const zone of ['Europe/Vilnius', 'America/Los_Angeles', 'Asia/Kathmandu']) {
  test(`retained v1 UTC ranges show exact local bounds without changing exports in ${zone}`, t => {
    const previous = process.env.TZ; process.env.TZ = zone;
    t.after(() => { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; });
    const saved = {startTime: Date.UTC(2026, 8, 1), endTime: Date.UTC(2026, 8, 1, 23, 59, 59, 999)};
    let value = normalizeOutputConfig({historyRange: 'custom', dateRange: saved}).dateRange;
    const render = () => nodes(DateRangePicker({value, onChange: next => { value = next; }}));
    const elements = render();
    const note = elements.find(node => node.props.id === 'exact-saved-range');
    const format = timestamp => new Date(timestamp).toLocaleString(undefined, {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'});
    assert.ok(note, 'a date-only display must not conceal retained partial-day bounds');
    assert.ok(text(note).includes(format(saved.startTime)) && text(note).includes(format(saved.endTime)));
    assert.deepEqual(value, saved, 'displaying a legacy range must preserve the exact exported interval');
    assert.equal(elements.find(node => node.props.label === 'From').props.slotProps.htmlInput['aria-describedby'], 'exact-saved-range');
    elements.find(node => node.props.label === 'From').props.onChange({target: {value: '2026-09-01'}});
    render().find(node => node.props.label === 'Through').props.onChange({target: {value: '2026-09-01'}});
    assert.deepEqual(value, {startTime: new Date(2026, 8, 1).getTime(), endTime: new Date(2026, 8, 1, 23, 59, 59, 999).getTime()});
    assert.equal(render().find(node => node.props.id === 'exact-saved-range'), undefined, 'explicitly choosing both dates produces ordinary full local days');
  });
}

test('empty and incomplete custom ranges do not format invalid timestamps', () => {
  for (const value of [null, {startTime: NaN, endTime: Date.now()}]) {
    assert.equal(nodes(DateRangePicker({value, onChange() {}})).find(node => node.props.id === 'exact-saved-range'), undefined);
  }
});
