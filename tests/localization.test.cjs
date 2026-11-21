const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
}).outputText, filename);
const catalogs = require('../src/i18n/catalogs.json');
const { resolveLocale, t, localeTags, countText, formatLocale, websitePath } = require('../src/i18n/index.ts');
const { ExportService } = require('../src/services/ExportService.ts');
const { HistoryService } = require('../src/services/HistoryService.ts');
const { files } = require('../scripts/package-files.cjs');
const locales = ['en', 'zh_CN', 'es', 'de', 'pt_BR', 'fr', 'ja'];
const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
function language(tag, fn) {
  const previous = global.chrome;
  global.chrome = { i18n: { getUILanguage: () => tag } };
  try { return fn(); } finally { global.chrome = previous; }
}

test('every shipping locale has complete nonempty translations and matching interpolation contracts', () => {
  assert.deepEqual(Object.keys(catalogs), locales);
  for (const locale of locales) {
    assert.deepEqual(Object.keys(catalogs[locale]).sort(), Object.keys(catalogs.en).sort(), locale);
    for (const [key, value] of Object.entries(catalogs[locale])) {
      assert.equal(typeof value, 'string'); assert.ok(value.trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(value), placeholders(key), `${locale}: ${key}`);
      assert.ok(!/<script|\u2014|\ufffd/.test(value), `${locale}: ${key}`);
    }
  }
});

test('locale resolution preserves regional distinctions and falls back safely', () => {
  for (const tag of ['zh-CN', 'zh_CN', 'zh-Hans', 'zh-Hans-CN', 'zh-SG', 'zh']) assert.equal(resolveLocale(tag), 'zh_CN', tag);
  for (const tag of ['zh-TW', 'zh-HK', 'zh-Hant', 'pt-PT', 'it', 'ar', 'en-GB']) assert.equal(resolveLocale(tag), 'en', tag);
  for (const [tag, expected] of [['pt-BR','pt_BR'], ['pt','pt_BR'], ['de-AT','de'], ['es-MX','es'], ['fr-CA','fr'], ['ja-JP','ja']]) assert.equal(resolveLocale(tag), expected);
  language('en-GB', () => assert.equal(formatLocale(), new Intl.DateTimeFormat().resolvedOptions().locale));
  language('zh-CN', () => assert.equal(websitePath('/privacy/'), 'https://exportchromehistory.app/zh-cn/privacy/'));
  language('pt-BR', () => assert.equal(websitePath('/privacy/'), 'https://exportchromehistory.app/pt-br/privacy/'));
  language('zh-CN', () => assert.equal(formatLocale(), new Intl.DateTimeFormat().resolvedOptions().locale, 'UI language does not override regional date conventions'));
});

test('counts use the target language plural rules without changing interpolated user text', () => {
  language('en', () => { assert.equal(countText('visits', 1), '1 visit'); assert.equal(countText('visits', 2), '2 visits'); });
  language('de', () => { assert.equal(countText('pages', 1), '1 Seite'); assert.equal(countText('pages', 2), '2 Seiten'); });
  language('ja', () => assert.equal(countText('pages', 2), '2ページ'));
  const hostile = '<img src=x onerror=alert(1)>{count}';
  for (const locale of locales) assert.equal(t('Search: “{query}”', { query: hostile }, locale).includes(hostile), true);
});

test('localized HTML remains escaped while every CSV and JSON schema and value stays identical', () => {
  const exporter = ExportService.getInstance();
  const row = { order: 1, id: '7', date: '2026-11-21', time: '12:30:00', title: '<script>alert(1)</script>', url: 'https://example.com/?q="x"', visitCount: 1, typedCount: 0, transition: 'link', timestamp: 1795257000000, domain: 'example.com' };
  const fields = Object.fromEntries(exporter.columnOrder.map(key => [key, true]));
  const baseline = language('en', () => ({csv: exporter.serializeData([row], 'csv', fields), json: exporter.serializeData([row], 'json', fields)}));
  for (const locale of locales) language(localeTags[locale], () => {
    assert.equal(exporter.serializeData([row], 'csv', fields), baseline.csv, locale);
    assert.equal(exporter.serializeData([row], 'json', fields), baseline.json, locale);
    const html = exporter.serializeData([row], 'html', fields);
    assert.ok(html.includes(`<html lang="${localeTags[locale]}">`));
    assert.ok(html.includes(catalogs[locale]['Browsing History']));
    assert.ok(html.includes(catalogs[locale].Title));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>')); assert.ok(html.includes('default-src \'none\''));
    assert.ok(html.includes('rel="noopener noreferrer"'));
  });
});

test('localized validation errors occur before a history API call', async () => {
  const previous = global.chrome;
  global.chrome = { i18n: { getUILanguage: () => 'zh-CN' }, history: { search() { throw new Error('must not be called'); } } };
  try { await assert.rejects(HistoryService.getInstance().getHistory({startTime: 2, endTime: 1}), {name:'HistoryOutError', message: catalogs.zh_CN['Choose a valid start and end date.']}); }
  finally { global.chrome = previous; }
});

test('the published public key keeps the existing Chrome identity and permission baseline', () => {
  const manifest = require('../extension-unpacked/manifest.json');
  const id = [...createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest('hex').slice(0,32)].map(c => String.fromCharCode(97+parseInt(c,16))).join('');
  assert.equal(id, 'idohnkdgejocejlkihihonhemndpiiei');
  assert.deepEqual([...manifest.permissions].sort(), ['history','sidePanel','storage']);
  assert.equal(manifest.default_locale, 'en');
  for (const locale of locales) {
    const file = `_locales/${locale}/messages.json`;
    assert.ok(files.includes(file));
    const messages = JSON.parse(fs.readFileSync(`extension-unpacked/${file}`, 'utf8'));
    assert.equal(messages.extensionName.message, catalogs[locale]['HistoryOut - Export Browser History']);
    assert.ok(messages.extensionName.message.length <= 75);
    assert.ok(messages.extensionDescription.message.length <= 132);
    assert.equal(messages.onboardingFolder.message, locale === 'en' ? '.' : `locales/${locale}`);
  }
});

test('all packaged onboarding pages have local passive resources and localized navigation', () => {
  for (const locale of locales) for (const name of ['welcome','updated']) {
    const file = locale === 'en' ? `${name}.html` : `locales/${locale}/${name}.html`;
    const html = fs.readFileSync(`extension-unpacked/${file}`, 'utf8');
    assert.ok(files.includes(file)); assert.ok(html.includes(`<html lang="${localeTags[locale]}">`));
    assert.ok(html.includes(catalogs[locale]['Open HistoryOut']));
    assert.ok(!/\{\{|\u2014|<script(?![^>]*\bsrc=)|\bon\w+=/i.test(html));
    assert.ok(!/<(?:img|script|iframe|video)[^>]*src="https?:/i.test(html));
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(https:|mailto:|#)/.test(match[1])) continue;
      const resource = path.resolve('extension-unpacked', path.dirname(file), match[1]);
      assert.ok(resource.startsWith(path.resolve('extension-unpacked')+path.sep));
      assert.ok(fs.existsSync(resource), resource);
    }
  }
});

test('native locale messages select packaged onboarding without changing preferences', async () => {
  const source = fs.readFileSync('extension-unpacked/background.js','utf8');
  for (const locale of locales) {
    let installed; const opened=[]; const stored={HISTORY_OUTPUT_CONFIG:{format:'json'}, historyoutSavedViews:[{id:'keep',name:'保留'}]};
    const chrome={
      i18n:{getMessage:()=>locale==='en'?'.':`locales/${locale}`},
      runtime:{getManifest:()=>({version:'2.2.0',permissions:[]}),getURL:p=>p,onInstalled:{addListener:fn=>installed=fn}},
      action:{onClicked:{addListener(){}}},tabs:{create:async value=>opened.push(value)},
      storage:{local:{get:async key=>({[key]:stored[key]}),set:async values=>Object.assign(stored,values)}},
    };
    vm.runInNewContext(source,{chrome});
    await installed({reason:'update',previousVersion:'2.1.0'});
    assert.equal(opened[0].url,locale==='en'?'updated.html':`locales/${locale}/updated.html`);
    assert.deepEqual(stored.HISTORY_OUTPUT_CONFIG,{format:'json'});
    assert.deepEqual(stored.historyoutSavedViews,[{id:'keep',name:'保留'}]);
    await installed({reason:'update',previousVersion:'2.1.0'});assert.equal(opened.length,1);
  }
});
