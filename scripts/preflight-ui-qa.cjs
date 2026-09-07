const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium, startServer, installFixture } = require('./qa-lib.cjs');

const OUTPUT_ROOT = '/tmp/historyout-preflight-2026-09-07';
const CONFIG_KEY = 'HISTORY_OUTPUT_CONFIG';
const VIEWS_KEY = 'historyoutSavedViews';
const FIXED_TIME = '2026-09-07T14:00:00Z';
const OLD_VISIT_TIME = Date.parse('2026-03-11T10:00:00Z');
const OLD_VISIT_URL = 'https://historyout-test.example/older-retained-visit';
const PREFERENCES = {
  format: 'json', historyRange: 'week', dateRange: null,
  fields: {
    order: false, id: false, date: true, time: false, title: true, url: true,
    visitCount: false, typedCount: false, transition: false, timestamp: false, domain: false,
  },
};
const EXISTING_VIEWS = [{
  id: 'prior-project', name: 'Existing project', config: PREFERENCES,
  query: 'responsive', domain: '', uniqueUrls: true, stripQuery: false,
}];

// Wrap the existing synthetic API fixture. No user profile or history is read.
function installStorageControls(options) {
  for (const [key, value] of Object.entries(options.seed || {})) {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
  }
  const get = window.chrome.storage.local.get;
  const set = window.chrome.storage.local.set;
  window.__storageQA = { failGet: !!options.failGet, failSetKeys: [], gets: [], writes: [] };
  window.chrome.storage.local.get = async key => {
    window.__storageQA.gets.push(key);
    if (window.__storageQA.failGet) throw new Error('Synthetic storage read failure');
    return get(key);
  };
  window.chrome.storage.local.set = async values => {
    const failed = Object.keys(values).some(key => window.__storageQA.failSetKeys.includes(key));
    window.__storageQA.writes.push({ values: JSON.parse(JSON.stringify(values)), failed });
    if (failed) throw new Error('Synthetic storage write failure');
    return set(values);
  };
  window.addEventListener('unhandledrejection', event => {
    window.__storageQA.unhandled = [...(window.__storageQA.unhandled || []), String(event.reason)];
  });
}

(async () => {
  const output = path.join(OUTPUT_ROOT, `run-${Date.now()}`);
  await fs.mkdir(output, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const contexts = new Set();

  async function fixture({ width = 400, failGet = false, seed = {} } = {}) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-GB', timezoneId: 'Europe/Vilnius', acceptDownloads: true });
    contexts.add(context);
    await context.addInitScript({ content: `(${installFixture.toString()})(${Date.parse(FIXED_TIME)}); (${installStorageControls.toString()})(${JSON.stringify({ failGet, seed })});` });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(FIXED_TIME));
    const errors = [];
    const external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (!request.url().startsWith(server.origin + '/') && !request.url().startsWith('blob:')) external.push(request.url());
    });
    await page.goto(server.origin + '/panel');
    await page.getByRole('button', { name: 'Preview', exact: true }).waitFor();
    if (!failGet) await ready(page);
    return { page, context, errors, external };
  }
  async function ready(page) {
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Preview' && !button.disabled));
  }
  async function range(page, label) {
    await page.getByRole('combobox', { name: 'History range' }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
  }
  async function screenshot(page, name) {
    await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  }
  async function clean({ page, context, errors, external }) {
    assert.deepEqual(errors, [], 'No uncaught runtime errors');
    assert.deepEqual(external, [], 'No external requests from the extension UI');
    assert.deepEqual(await page.evaluate(() => window.__storageQA.unhandled || []), [], 'Storage failures are handled');
    await context.close(); contexts.delete(context);
  }
  async function check(name, action) {
    try { console.log('RUN ' + name); const detail = await action(); results.push({ name, status: 'passed', ...detail }); console.log('PASS ' + name); }
    catch (error) { results.push({ name, status: 'failed', error: error.stack || String(error) }); console.error('FAIL ' + name + ': ' + error.message); }
  }

  try {
    for (const width of [320, 400, 1200]) {
      await check(`Availability guidance and final support section at ${width}px`, async () => {
        const state = await fixture({ width }); const { page } = state;
        const notice = page.getByRole('complementary', { name: 'Looking for older history?' });
        assert.equal(await notice.count(), 0, 'Today does not show older-history guidance');
        await range(page, 'Custom dates');
        await notice.waitFor();
        assert.equal(await page.getByLabel('Start date', { exact: true }).getAttribute('type'), 'date');
        assert.equal(await page.getByLabel('End date', { exact: true }).getAttribute('type'), 'date');
        const summary = notice.locator('summary');
        const details = notice.locator('details');
        assert.equal(await details.evaluate(element => element.open), false);
        await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await details.evaluate(element => element.open), true, 'Details expand with Enter');
        const text = await notice.innerText();
        assert.match(text, /Chrome normally keeps about 90 days\./);
        assert.match(text, /Chrome has no built-in setting to extend its local history limit\./);
        assert.match(text, /Other browsers may differ\./);
        assert.match(text, /Saved views remember your settings, not your visits\./);
        assert.match(text, /Google My Activity is separate: changing its settings will not extend the history available here\./);
        assert.ok(!text.includes('\u2014'), 'Guidance has no em dash');
        assert.equal(await notice.getByRole('link', { name: /History limits and other options/ }).getAttribute('href'), 'https://exportchromehistory.app/guides/browser-history-limits/');
        assert.equal(await page.evaluate(() => window.__fixture.reads), 0, 'Guidance does not read history');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Expanded guidance has no horizontal overflow');
        await screenshot(page, `custom-guidance-${width}`);
        await summary.focus(); await page.keyboard.press('Space');
        assert.equal(await details.evaluate(element => element.open), false, 'Details collapse with Space');
        await range(page, 'All available history'); await notice.waitFor();
        const support = page.getByRole('link', { name: 'Buy me a coffee (opens in a new tab)', exact: true });
        const action = page.getByRole('button', { name: /^Export history/ });
        await page.getByRole('button', { name: 'Tell a friend', exact: true }).scrollIntoViewIfNeeded();
        const supportBounds = await support.boundingBox(); const actionBounds = await action.boundingBox();
        assert.ok(actionBounds && supportBounds && actionBounds.y + actionBounds.height <= supportBounds.y, 'Support is visually below the export action after scrolling');
        assert.equal(await support.evaluate(element => {
          const action = [...document.querySelectorAll('button')].find(button => button.textContent.startsWith('Export history'));
          const footer = document.querySelector('footer');
          return !!action && !!footer && !!(element.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_PRECEDING) && !!(element.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING);
        }), true, 'Export precedes support, and the original footer follows it');
        const footer = page.locator('footer');
        for (const label of ['Get help', 'Leave a review', 'Support HistoryOut']) assert.equal(await footer.getByRole('link', { name: label, exact: true }).count(), 1);
        assert.equal(await footer.getByRole('button', { name: 'Tell a friend', exact: true }).count(), 1);
        await screenshot(page, `all-history-support-${width}`);
        await range(page, 'Today'); assert.equal(await notice.count(), 0);
        await clean(state);
        return { width, keyboardDetails: true, guidanceRanges: ['custom', 'all'], hiddenRange: 'today', supportAfterExport: true, footerRetained: true };
      });
    }

    await check('Retained data older than 90 days is not blocked', async () => {
      const state = await fixture(); const { page } = state;
      assert.ok((Date.parse(FIXED_TIME) - OLD_VISIT_TIME) / 86400000 > 90);
      await page.evaluate(({ url, visitTime }) => {
        window.__fixture.rows.push({ id: 'older-visit', url, title: 'Fictional retained visit older than 90 days', lastVisitTime: visitTime, visitCount: 1, typedCount: 1 });
        window.__fixture.visits[url] = [{ id: 'older-visit', visitId: 'older-visit-1', visitTime, referringVisitId: '0', transition: 'typed' }];
      }, { url: OLD_VISIT_URL, visitTime: OLD_VISIT_TIME });
      await page.getByRole('button', { name: 'JSON, structured data', exact: true }).click();
      for (const label of ['Custom dates', 'All available history']) {
        await range(page, label);
        if (label === 'Custom dates') {
          await page.getByLabel('Start date', { exact: true }).fill('2026-03-01');
          await page.getByLabel('End date', { exact: true }).fill('2026-03-31');
        }
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('button', { name: 'Refresh', exact: true }).waitFor();
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: /^Export \d+ visits/ }).click();
        const download = await downloadPromise;
        const filename = label === 'Custom dates' ? 'older-custom.json' : 'older-all.json';
        await download.saveAs(path.join(output, filename));
        const records = JSON.parse(await fs.readFile(path.join(output, filename), 'utf8'));
        assert.ok(records.some(record => record.url === OLD_VISIT_URL), `${label} includes retained old visit`);
        if (label === 'Custom dates') assert.equal(records.length, 1, 'Custom dates still constrain the actual data');
      }
      await screenshot(page, 'older-history-exported');
      await clean(state);
      return { syntheticOldVisit: new Date(OLD_VISIT_TIME).toISOString(), exportRanges: ['custom', 'all'], downloadsContainOldVisit: true };
    });

    await check('Startup storage failure preserves existing preferences until Retry succeeds', async () => {
      const state = await fixture({ failGet: true, seed: { [CONFIG_KEY]: PREFERENCES, [VIEWS_KEY]: EXISTING_VIEWS } }); const { page } = state;
      await page.getByText('Your saved settings could not be loaded. Retry to keep your existing preferences.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Preview', exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole('button', { name: /^Export history/ }).isDisabled(), true);
      assert.equal(await page.getByRole('button', { name: 'Save view', exact: true }).isDisabled(), true);
      // Wait beyond the settings debounce to detect accidental default writes.
      await page.waitForTimeout(650);
      assert.equal(await page.evaluate(() => window.__storageQA.writes.length), 0, 'Failed hydration cannot write defaults');
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONFIG_KEY), PREFERENCES);
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), VIEWS_KEY), EXISTING_VIEWS);
      await screenshot(page, 'startup-storage-error');
      await page.evaluate(() => { window.__storageQA.failGet = false; });
      await page.getByRole('button', { name: 'Retry', exact: true }).click(); await ready(page);
      assert.match(await page.getByRole('combobox', { name: 'History range' }).innerText(), /Last 7 days/);
      assert.equal(await page.getByRole('button', { name: 'JSON, structured data', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.match(await page.getByRole('combobox', { name: 'Include' }).innerText(), /3 columns/);
      assert.equal(await page.getByRole('button', { name: 'Existing project', exact: true }).count(), 1);
      await page.waitForTimeout(650);
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), CONFIG_KEY), PREFERENCES);
      assert.equal(await page.evaluate(() => window.__fixture.reads), 0);
      await screenshot(page, 'startup-storage-recovered');
      await clean(state);
      return { defaultWritesDuringFailure: 0, restored: ['JSON format', 'Last 7 days', 'three selected columns', 'existing saved view'], historyReads: 0 };
    });

    await check('Failed saved-view write reports failure and retry recovers', async () => {
      const state = await fixture({ seed: { [CONFIG_KEY]: PREFERENCES, [VIEWS_KEY]: EXISTING_VIEWS } }); const { page } = state;
      await page.evaluate(key => { window.__storageQA.failSetKeys = [key]; }, VIEWS_KEY);
      await page.getByRole('button', { name: 'Save view', exact: true }).click();
      await page.getByRole('textbox', { name: 'View name', exact: true }).fill('Recovered research');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByText('This view could not be saved. Your existing views are unchanged. Try Save again.', { exact: true }).waitFor();
      assert.equal(await page.getByText('Saved “Recovered research”. Return to these settings with one click.', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Recovered research', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Existing project', exact: true }).count(), 1);
      assert.equal(await page.getByRole('textbox', { name: 'View name', exact: true }).inputValue(), 'Recovered research');
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), VIEWS_KEY), EXISTING_VIEWS);
      await screenshot(page, 'saved-view-write-error');
      await page.evaluate(() => { window.__storageQA.failSetKeys = []; });
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByText('Saved “Recovered research”. Return to these settings with one click.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Recovered research', exact: true }).count(), 1);
      const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), VIEWS_KEY);
      assert.equal(stored.length, 2); assert.equal(stored[0].name, 'Recovered research'); assert.equal(stored[1].name, 'Existing project');
      await page.reload(); await ready(page);
      assert.equal(await page.getByRole('button', { name: 'Recovered research', exact: true }).count(), 1, 'Recovered view persists after reload');
      await screenshot(page, 'saved-view-write-recovered');
      await clean(state);
      return { falseSuccessPrevented: true, priorViewsPreserved: true, retryPersistedAcrossReload: true };
    });

    await check('Failed preference write permits export and Retry saving persists it', async () => {
      const state = await fixture({ seed: { [CONFIG_KEY]: PREFERENCES } }); const { page } = state;
      await page.evaluate(key => { window.__storageQA.failSetKeys = [key]; }, CONFIG_KEY);
      await page.getByRole('button', { name: 'HTML, readable in a browser', exact: true }).click();
      await page.getByText('Your settings work for this session but could not be saved for next time. You can still preview and export.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: /^Export history/ }).isEnabled(), true);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /^Export history/ }).click();
      const download = await downloadPromise; await download.saveAs(path.join(output, 'storage-failure-export.html'));
      assert.match(await fs.readFile(path.join(output, 'storage-failure-export.html'), 'utf8'), /<!doctype html>/i);
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).format, CONFIG_KEY), 'json');
      await page.evaluate(() => { window.__storageQA.failSetKeys = []; });
      await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
      await page.getByRole('button', { name: 'Retry saving', exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).format, CONFIG_KEY), 'html');
      await clean(state);
      return { sessionExportAvailable: true, oldPreferencePreservedOnFailure: true, explicitRetryPersisted: true };
    });
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    const report = {
      checked: new Date().toISOString(), status: results.every(result => result.status === 'passed') ? 'passed' : 'failed',
      scope: 'Focused UI delta with fictional history and controlled storage errors. Does not establish real browser retention or store publication.',
      browser: { name: 'Chromium', version: browser.version() },
      bundleSha256: crypto.createHash('sha256').update(await fs.readFile('extension-unpacked/bundle.js')).digest('hex'),
      output, results,
    };
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    await browser.close(); await server.close();
    if (report.status !== 'passed') process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
