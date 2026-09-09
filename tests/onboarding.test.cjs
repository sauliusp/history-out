const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('extension-unpacked/onboarding.js', 'utf8');

async function harness({ panel = 'supported', manifestPanel = true, tabReady = true } = {}) {
  let click;
  const opened = [], navigated = [];
  const status = { textContent: '' }, version = { textContent: '' };
  const link = { href: 'chrome-extension://fixture/side-panel.html', addEventListener(type, fn) { click = fn; } };
  const manifest = { version: '2.1.0', permissions: ['history', 'storage', ...(manifestPanel ? ['sidePanel'] : [])], ...(manifestPanel ? {side_panel: {default_path: 'side-panel.html'}} : {}) };
  const chrome = {
    runtime: { getManifest: () => manifest },
    tabs: { getCurrent: () => tabReady ? Promise.resolve({id: 42}) : new Promise(() => {}) },
  };
  if (panel !== 'missing') chrome.sidePanel = {open: options => {
    opened.push(options);
    if (panel === 'throws') throw new Error('Not supported');
    return panel === 'rejects' ? Promise.reject(new Error('Not supported')) : Promise.resolve();
  }};
  vm.runInNewContext(source, {
    chrome, document: {querySelector: () => version, querySelectorAll: () => [link], getElementById: () => status},
    window: {location: {assign: url => navigated.push(url)}},
  });
  await Promise.resolve();
  return {opened, navigated, status, version, click: event => click(event)};
}
const event = (props = {}) => ({button: 0, prevented: false, preventDefault() {this.prevented = true;}, ...props});

test('the primary action targets its own tab synchronously, even if that tab moves between windows', async () => {
  const fixture = await harness();
  const e = event();
  const result = fixture.click(e);
  assert.equal(fixture.opened.length, 1, 'Must open before yielding the click handler');
  assert.equal(fixture.opened[0].tabId, 42);
  assert.equal(fixture.opened[0].windowId, undefined, 'Do not cache a window ID that becomes stale when the tab moves');
  assert.equal(e.prevented, true);
  await result;
  assert.match(fixture.status.textContent, /is open beside/);
  assert.equal(fixture.version.textContent, '2.1.0');
  assert.deepEqual(fixture.navigated, []);
});

for (const panel of ['rejects', 'throws']) test(`a panel API that ${panel} opens the local full-tab workspace`, async () => {
  const fixture = await harness({panel});
  await fixture.click(event());
  assert.deepEqual(fixture.navigated, ['chrome-extension://fixture/side-panel.html']);
});

for (const options of [{panel: 'missing'}, {manifestPanel: false}, {tabReady: false}]) {
  test(`the ordinary local link remains usable with ${JSON.stringify(options)}`, async () => {
    const fixture = await harness(options);
    const e = event();
    await fixture.click(e);
    assert.equal(e.prevented, false);
    assert.deepEqual(fixture.opened, []);
  });
}

test('modified clicks keep the browser’s standard link behavior', async () => {
  const fixture = await harness();
  for (const props of [{metaKey:true}, {ctrlKey:true}, {shiftKey:true}, {altKey:true}, {button:1}]) {
    const e = event(props);
    await fixture.click(e);
    assert.equal(e.prevented, false);
  }
  assert.deepEqual(fixture.opened, []);
});

test('both packaged pages work offline and contain only packaged passive resources', () => {
  for (const file of ['welcome.html', 'updated.html']) {
    const html = fs.readFileSync(`extension-unpacked/${file}`, 'utf8');
    assert.match(html, /href="side-panel.html" data-open-historyout/);
    assert.match(html, /href="side-panel.html">Open in a full tab/);
    assert.match(html, /https:\/\/historyout.featurebase.app\//);
    assert.match(html, /mailto:sauliusthedev@gmail.com/);
    assert.match(html, /blue icon/);
    assert(!/\{\{|sauliusdev.chatgpt.site|saulius.developer@gmail.com|\u2014/.test(html));
    assert(!/<script(?![^>]*\bsrc=)|\bon\w+=/i.test(html), 'No inline script or event handlers');
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https:|mailto:|#)/.test(match[1])) continue;
      assert(fs.existsSync(path.join('extension-unpacked', match[1])), `Missing ${match[1]}`);
    }
    assert(!/<(?:img|script|iframe|video)[^>]*src="https?:/i.test(html));
    const feedbackLinks = [...html.matchAll(/href="(https:\/\/historyout.featurebase.app[^\"]*)"/g)];
    assert(feedbackLinks.every(match => match[1] === 'https://historyout.featurebase.app/'), 'Feedback must not carry history or settings');
  }
  const css = fs.readFileSync('extension-unpacked/onboarding.css', 'utf8');
  assert(!/@import|url\(["']?https?:/i.test(css));
});
