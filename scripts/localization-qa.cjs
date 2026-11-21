// Full UI regression in isolated fictional-history browser contexts per locale.
// Never attaches to the user's browser or reads their history.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium,startServer,installFixture} = require('./qa-lib.cjs');
const {createHash} = require('node:crypto');
const catalogs = require('../src/i18n/catalogs.json');
const locales = {en:'en-GB',zh_CN:'zh-CN',es:'es-ES',de:'de-DE',pt_BR:'pt-BR',fr:'fr-FR',ja:'ja-JP'};
const output = path.resolve(process.env.QA_OUTPUT_DIR || 'launch/qa/localization-2.2.0');
const report = {checked:new Date().toISOString(),scope:'Isolated fictional-history browser UI contexts. Native Chrome APIs and upgrades are covered separately.',cases:[]};
const tr = (locale,key,values={}) => catalogs[locale][key].replace(/\{(\w+)\}/g,(all,key)=>values[key]??all);
const exact = (page,role,locale,key) => page.getByRole(role,{name:tr(locale,key),exact:role!=='combobox'});
const esc = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function noOverflow(page,locale,stage) {
  for(const width of [320,400,760,1280]) {
    await page.setViewportSize({width,height:900});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${locale} horizontal overflow at ${width}: ${stage}`);
    const overflow=await page.locator('button, [role="combobox"]').evaluateAll(elements=>elements.filter(e=>e.getBoundingClientRect().width>0 && e.scrollWidth>e.clientWidth+2 && getComputedStyle(e).overflowX==='visible').map(e=>e.textContent));
    assert.deepEqual(overflow,[],`${locale} clipped controls at ${width}: ${stage}`);
  }
  await page.setViewportSize({width:400,height:900});
}
(async()=>{
  const server=await startServer();const browser=await chromium.launch({headless:true});
  await fs.mkdir(output,{recursive:true});
  try {
    report.browserVersion=browser.version();report.bundleSha256=createHash('sha256').update(await fs.readFile('extension-unpacked/bundle.js')).digest('hex');
    for(const [locale,language] of Object.entries(locales)) {
      const context=await browser.newContext({viewport:{width:400,height:900},locale:language,timezoneId:'Europe/Vilnius',acceptDownloads:true});
      try {
        await context.addInitScript(installFixture,Date.parse('2026-09-05T14:00:00Z'));
        const page=await context.newPage();const errors=[],external=[];
        page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.origin)&&!r.url().startsWith('blob:'))external.push(r.url());});
        await page.clock.setFixedTime(new Date('2026-09-05T14:00:00Z'));
        await page.goto(server.origin+'/panel');await exact(page,'button',locale,'Preview').waitFor();
        assert.equal(await page.evaluate(()=>window.__fixture.reads),0);
        assert.equal(await page.locator('html').getAttribute('lang'),locale==='en'?'en':language.split('-')[0]==='pt'?'pt-BR':locale==='zh_CN'?'zh-CN':locale);
        await noOverflow(page,locale,'initial');
        await exact(page,'button',locale,'Preview').click();await exact(page,'button',locale,'Refresh').waitFor();
        await exact(page,'heading',locale,"Today's recap").waitFor();
        const search=exact(page,'textbox',locale,'Search history titles or URLs');
        await search.fill('responsive');
        await page.getByRole('checkbox',{name:new RegExp('^'+esc(tr(locale,'One row per URL')))}).check();
        await exact(page,'checkbox',locale,'Remove URL queries & fragments').check();
        const rows=await page.getByRole('list',{name:tr(locale,'History preview')}).getByRole('listitem').count();assert.equal(rows,4);
        const downloads={};
        for(const [format,label] of [['csv','CSV, for spreadsheets'],['json','JSON, structured data'],['html','HTML, readable in a browser']]) {
          await exact(page,'button',locale,label).click();
          const pending=page.waitForEvent('download');await page.locator('button[aria-busy]').click();
          const download=await pending;const text=await fs.readFile(await download.path(),'utf8');downloads[format]=text;
          assert.equal(download.suggestedFilename(),`history-export.${format}`);
          assert(!text.includes('utm_source'));assert(!text.includes('Core Web Vitals'));
        }
        assert.equal(downloads.csv.trim().split('\r\n').length,5);
        assert.equal(downloads.csv.split('\r\n')[0],'order,id,date,time,title,url,visitCount,typedCount,transition');
        const json=JSON.parse(downloads.json);assert.equal(json.length,4);assert.deepEqual(Object.keys(json[0]),['order','id','date','time','title','url','visitCount','typedCount','transition']);
        assert(json.every(row=>!row.url.includes('?')&&!row.url.includes('#')));
        assert(downloads.html.includes(tr(locale,'Browsing History')));assert(downloads.html.includes(`lang="${locale==='en'?'en':locale.replace('_','-')}"`));
        await noOverflow(page,locale,'loaded and filtered');
        await page.screenshot({path:path.join(output,`${locale}-panel.png`),fullPage:true});
        // User names and search text must remain unchanged in every UI language.
        const name='研究 · Récap · Pesquisa';await exact(page,'button',locale,'Save view').click();
        await exact(page,'textbox',locale,'View name').fill(name);await exact(page,'button',locale,'Save').click();
        await page.getByRole('button',{name,exact:true}).waitFor();const reads=await page.evaluate(()=>window.__fixture.reads);
        await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.evaluate(()=>window.__fixture.reads),reads);
        await page.reload();await page.getByRole('button',{name,exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__fixture.reads),0);
        await page.getByRole('button',{name,exact:true}).click();
        const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews')));
        assert.equal(settings[0].name,name);assert.equal(settings[0].query,'responsive');assert(settings[0].uniqueUrls);assert(settings[0].stripQuery);
        await exact(page,'button',locale,'Preview').click();await exact(page,'button',locale,'Refresh').waitFor();
        await search.fill('no-match-xyz');assert(await page.locator('button[aria-busy]').isDisabled());
        await exact(page,'combobox',locale,'History range').click();await exact(page,'option',locale,'Custom dates').click();
        assert(await exact(page,'button',locale,'Preview').isDisabled());
        await page.getByLabel(tr(locale,'Start date'),{exact:true}).fill('2026-09-06');await page.getByLabel(tr(locale,'End date'),{exact:true}).fill('2026-09-05');
        assert(await exact(page,'button',locale,'Preview').isDisabled());
        await page.getByLabel(tr(locale,'Start date'),{exact:true}).fill('2026-09-05');
        await noOverflow(page,locale,'custom dates and history guidance');
        await exact(page,'combobox',locale,'History range').click();await exact(page,'option',locale,'Today').click();
        await page.evaluate(()=>{window.__fixture.delay=350;});await exact(page,'button',locale,'Preview').click();await exact(page,'button',locale,'Cancel').click();
        await page.getByText(tr(locale,'Preview cancelled. Your browsing history is unchanged.'),{exact:true}).waitFor();
        await page.evaluate(()=>{window.__fixture.delay=0;window.__fixture.fail=true;});await exact(page,'button',locale,'Preview').click();
        await page.getByText(tr(locale,'History could not be loaded. Please try again.'),{exact:true}).waitFor();
        await page.evaluate(()=>{window.__fixture.fail=false;});await exact(page,'button',locale,'Preview').click();await exact(page,'button',locale,'Refresh').waitFor();
        assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
        report.cases.push({locale,status:'passed',checks:['no automatic history read','locale and accessible controls','CSV/JSON schema unchanged','localized HTML export','search, latest URL and cleanup','saved views retained after reload','empty export disabled','custom date validation','cancel and error recovery','no network calls','320/400/760/1280 width checks']});
        console.log('PASS',locale);
      } finally {await context.close();}
    }
    report.status='passed';
  } catch(error) {report.status='failed';report.error=error.stack;throw error;}
  finally {await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
