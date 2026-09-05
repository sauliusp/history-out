const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium, startServer, installFixture } = require('./qa-lib.cjs');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceFile = 'src/components/HistoryExporter.tsx';
const footer = source => {
  const start = source.indexOf('        <Stack component="footer"');
  const end = source.indexOf('        </Stack>', start) + '        </Stack>'.length;
  assert.ok(start >= 0 && end > start, 'Footer exists');
  return source.slice(start, end);
};

(async () => {
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
      const bounds = await cta.boundingBox();
      assert.ok(bounds && bounds.y + bounds.height < 200, 'CTA is visible near the top');
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
      await page.screenshot({ path: `launch/qa/bmc-cta-${width}.png`, fullPage: true, animations: 'disabled' });
      await cta.focus();
      assert.equal(await cta.evaluate(element => element === document.activeElement), true);
      await page.screenshot({ path: `launch/qa/bmc-cta-focus-${width}.png`, fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      await page.getByRole('button', { name: 'Refresh', exact: true }).waitFor();
      assert.equal(await cta.isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      assert.deepEqual(externalRequests, []);
      results.push({ width, status: 'passed', ctaBounds: bounds, keyboardFocusable: true, localAssetLoaded: true, externalRequests: 0, previewWorks: true });
      await context.close();
    }
    const baseline = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const currentFooter = footer(fs.readFileSync(sourceFile, 'utf8'));
    assert.equal(currentFooter, footer(execFileSync('git', ['show', `${baseline}:${sourceFile}`], { encoding: 'utf8' })), 'Existing footer unchanged');
    const report = { checked: new Date().toISOString(), status: 'passed', command: 'node scripts/bmc-cta-qa.cjs', browser: { name: 'Chromium', version: browser.version() }, scope: 'Focused optional support UI delta; fictional HTTP API fixture, not native history APIs', bundleSha256: hash(fs.readFileSync('extension-unpacked/bundle.js')), footerUnchanged: true, footerComparisonRevision: baseline, footerSha256: hash(currentFooter), ctaLabel: 'Buy me a coffee', asset: 'extension-unpacked/assets/bmc-cup.svg', results };
    fs.writeFileSync('launch/qa/bmc-cta.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
