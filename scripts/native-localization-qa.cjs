// Verify the real Chrome i18n/manifest/onboarding connection in an isolated profile.
// A locale preference does not prove the native browser UI language changed.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { payloadSha256 } = require('./payload-evidence.cjs');
const catalogs = require('../src/i18n/catalogs.json');
const report = { checked: new Date().toISOString(), requestedLocale: 'zh-CN', scope: 'Real unpacked extension, isolated Chromium profile; verifies native locale if the operating system accepts the per-process language override.', payloadSha256: payloadSha256(path.resolve('extension-unpacked')) };
(async () => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'historyout-native-locale-'));
  let context;
  try {
    const extension = path.resolve('extension-unpacked');
    context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, locale: 'zh-CN', args: ['--lang=zh-CN', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    report.browserVersion = context.browser().version();
    report.extensionId = new URL(worker.url()).host;
    assert.equal(report.extensionId, 'idohnkdgejocejlkihihonhemndpiiei');
    report.native = await worker.evaluate(() => ({ language: chrome.i18n.getUILanguage(), metadataName: chrome.i18n.getMessage('extensionName'), manifestName: chrome.runtime.getManifest().name, folder: chrome.i18n.getMessage('onboardingFolder') }));
    report.localeOverrideAccepted = /^zh[-_](CN|Hans)/i.test(report.native.language);
    const locale = Object.keys(catalogs).find(key => report.native.folder === `locales/${key}`) || 'en';
    const tag = locale.replace('_', '-');
    assert.equal(report.native.metadataName, catalogs[locale]['HistoryOut - Export Browser History']);
    assert.equal(report.native.manifestName, report.native.metadataName);
    assert.equal(report.native.folder, locale === 'en' ? '.' : `locales/${locale}`);
    const suffix = locale === 'en' ? '/welcome.html' : `/locales/${locale}/welcome.html`;
    let welcome;
    for (let attempt = 0; attempt < 100; attempt++) {
      welcome = context.pages().find(page => page.url().endsWith(suffix));
      if (welcome) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(welcome, `Native welcome page not opened: ${suffix}`);
    await welcome.waitForLoadState();
    report.onboardingURL = welcome.url();
    assert.equal(await welcome.locator('html').getAttribute('lang'), tag);
    await welcome.getByRole('link', { name: catalogs[locale]['Open HistoryOut'], exact: true }).waitFor();
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${report.extensionId}/side-panel.html`);
    await panel.locator('#time-range-select').waitFor();
    report.document = await panel.evaluate(() => ({ language: document.documentElement.lang, chromeUILanguage: chrome.i18n.getUILanguage(), metadataName: chrome.i18n.getMessage('extensionName'), browserLanguage: navigator.language, regionalLocale: new Intl.DateTimeFormat().resolvedOptions().locale }));
    const rendererLocale = Object.keys(catalogs).find(key => key.replace('_', '-').toLowerCase() === report.document.language.toLowerCase()) || 'en';
    await panel.getByRole('button', { name: catalogs[rendererLocale].Preview, exact: true }).waitFor();
    report.rendererLocaleDiffersFromNative = report.document.chromeUILanguage !== report.native.language;
    if (report.localeOverrideAccepted) assert.equal(rendererLocale, 'zh_CN');
    // Independently verify the packaged Chinese page even if macOS keeps the
    // process UI in English while DevTools emulates a Chinese renderer locale.
    const chineseWelcome = await context.newPage();
    await chineseWelcome.goto(`chrome-extension://${report.extensionId}/locales/zh_CN/welcome.html`);
    await chineseWelcome.getByRole('link', { name: catalogs.zh_CN['Open HistoryOut'], exact: true }).waitFor();
    assert.equal(await chineseWelcome.locator('html').getAttribute('lang'), 'zh-CN');
    report.directChineseOnboarding = 'passed';
    const storage = await worker.evaluate(() => chrome.storage.local.get(null));
    assert.ok(!('historyoutSavedViews' in storage));
    report.status = report.localeOverrideAccepted ? 'passed' : 'limited';
    if (!report.localeOverrideAccepted) report.limit = 'Chromium on this host did not accept --lang=zh-CN for its native UI language. The observed native locale and identity passed; The renderer may use the Playwright-emulated Chinese locale independently. The packaged Chinese onboarding page, zh-CN fixture UI, and catalog/manifest contracts are verified separately; native Chinese metadata selection is not proven on this host.';
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; console.error(error); }
  finally {
    if (context) await context.close();
    await fs.rm(profile, { recursive: true, force: true });
    await fs.mkdir('launch/qa/localization-2.2.0', { recursive: true });
    await fs.writeFile('launch/qa/localization-2.2.0/native-locale.json', JSON.stringify(report, null, 2) + '\n');
  }
})();
