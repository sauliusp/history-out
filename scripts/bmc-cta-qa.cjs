const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {checkFooter} = require('./check-footer.cjs');
const { chromium, startServer, installFixture } = require('./qa-lib.cjs');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const output = path.resolve(process.env.QA_OUTPUT_DIR || 'launch/qa');
(async () => {
  const {current: currentFooter, fixture: footerFixture} = checkFooter();
  fs.mkdirSync(output, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [320, 400, 1200]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-GB', timezoneId: 'Europe/Vilnius' });
      await context.addInitScript(installFixture);
      const page = await context.newPage();
      const externalRequests = [];
      const errors = [];
      page.on('request', request => { if (!request.url().startsWith(server.origin + '/')) externalRequests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(server.origin + '/panel');
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Preview' && !button.disabled));
      const cta = page.getByRole('link', { name: 'Buy me a coffee (opens in a new tab)', exact: true });
      const exportButton = page.getByRole('button', { name: /^Export history/ });
      assert.equal(await cta.evaluate(element => {
        const action = [...document.querySelectorAll('button')].find(button => button.textContent.startsWith('Export history'));
        return !!action && !!(element.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_PRECEDING);
      }), true, 'The main export action precedes optional support');
      const initialExportBounds = await exportButton.boundingBox();
      assert.ok(initialExportBounds && initialExportBounds.y >= 0 && initialExportBounds.y + initialExportBounds.height <= 900, 'Export remains visible on initial view');
      await cta.scrollIntoViewIfNeeded();
      const bounds = await cta.boundingBox();
      const actionBounds = await exportButton.boundingBox();
      assert.ok(bounds && actionBounds && actionBounds.y + actionBounds.height <= bounds.y, 'Optional support is below the export action');
      assert.equal(await cta.getAttribute('href'), 'https://www.buymeacoffee.com/saulius.developer');
      assert.equal(await cta.getAttribute('target'), '_blank');
      assert.equal(await cta.getAttribute('rel'), 'noopener noreferrer');
      assert.equal(await cta.getAttribute('aria-describedby'), 'coffee-support-note');
      const cup = cta.locator('img');
      assert.equal(await cup.getAttribute('src'), 'assets/bmc-cup.svg');
      await page.waitForFunction(() => document.querySelector('img[src="assets/bmc-cup.svg"]')?.naturalWidth > 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      assert.equal(await page.evaluate(() => window.__fixture.reads), 0, 'No initial history read');
      assert.equal(await page.getByRole('link', { name: 'Support HistoryOut', exact: true }).count(), 1);
      await page.screenshot({ path: path.join(output, `bmc-cta-${width}.png`), fullPage: true, animations: 'disabled' });
      await cta.focus();
      assert.equal(await cta.evaluate(element => element === document.activeElement), true);
      await page.screenshot({ path: path.join(output, `bmc-cta-focus-${width}.png`), fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await page.getByRole('button', { name: 'Refresh', exact: true }).waitFor();
      assert.equal(await cta.isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      assert.deepEqual(externalRequests, []);
      results.push({ width, status: 'passed', ctaBounds: bounds, keyboardFocusable: true, localAssetLoaded: true, externalRequests: 0, previewWorks: true });
      await context.close();
    }
    const report = { checked: new Date().toISOString(), status: 'passed', command: 'node scripts/bmc-cta-qa.cjs', browser: { name: 'Chromium', version: browser.version() }, scope: 'Focused optional support UI delta; fictional HTTP API fixture, not native history APIs', bundleSha256: hash(fs.readFileSync('extension-unpacked/bundle.js')), footerMatchesFixture: true, footerFixture, footerSha256: hash(currentFooter), ctaLabel: 'Buy me a coffee', asset: 'extension-unpacked/assets/bmc-cup.svg', results };
    fs.writeFileSync(path.join(output, 'bmc-cta.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
