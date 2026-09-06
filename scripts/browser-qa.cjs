const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {chromium,startServer,openFixture}=require('./qa-lib.cjs');
(async()=>{
  const server=await startServer();let browser;const results=[];
  try{
    browser=await chromium.launch({headless:true});
    const {page,context}=await openFixture(browser,server.origin);const errors=[];const external=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.origin)&&!r.url().startsWith('blob:'))external.push(r.url());});
    assert.equal(await page.evaluate(()=>window.__fixture.reads),0);results.push('No history read on opening the workspace');
    await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();
    assert(await page.getByText("Today's recap",{exact:true}).isVisible());
    await page.screenshot({path:'launch/qa/panel-initial.png',fullPage:true});
    const search=page.getByRole('textbox',{name:'Search history titles or URLs'});
    await search.fill('responsive');await page.getByRole('checkbox',{name:/One row per URL/}).check();
    await page.getByRole('checkbox',{name:/Remove URL queries/}).check();
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:/^Export \d+ pages/}).click();const download=await downloadPromise;
    const csv=await fs.readFile(await download.path(),'utf8');assert(csv.includes('Responsive'));assert(!csv.includes('utm_source'));assert(!csv.includes('Core Web Vitals'));assert.equal(csv.trim().split('\r\n').length,5);results.push('CSV matches search, latest URL mode and query cleanup');
    await page.getByRole('button',{name:'Save view',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).fill('Responsive research');await page.getByRole('button',{name:'Save',exact:true}).click();
    const reads=await page.evaluate(()=>window.__fixture.reads);
    await page.getByRole('button',{name:'Responsive research',exact:true}).click();assert.equal(await page.evaluate(()=>window.__fixture.reads),reads);results.push('Saved view restores preferences without silently reading history');
    await page.reload();await page.getByRole('button',{name:'Responsive research',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__fixture.reads),0);
    await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();
    await search.fill('no-matching-page-xyz');assert(await page.getByRole('button',{name:/^Export 0 visits/}).isDisabled());results.push('No-match state disables empty export');
    await page.getByRole('combobox',{name:'History range'}).click();await page.getByRole('option',{name:'Custom dates',exact:true}).click();assert(await page.getByRole('button',{name:'Preview',exact:true}).isDisabled());results.push('Incomplete custom dates cannot run');
    await page.getByRole('combobox',{name:'History range'}).click();await page.getByRole('option',{name:'Today',exact:true}).click();
    await page.evaluate(()=>{window.__fixture.delay=400;});await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByText('Preview cancelled. Your browsing history is unchanged.').waitFor();results.push('Cancel discards pending history reads');
    await page.evaluate(()=>{window.__fixture.delay=0;window.__fixture.fail=true;});await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByText('History is temporarily unavailable. Try again.').waitFor();results.push('API failure is visible and retryable');
    for(const width of [320,380,760,1200]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}results.push('No horizontal overflow at 320, 380, 760 and 1200 pixels');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push('No runtime errors or extension network requests');await context.close();
    await browser.close();
    // Real extension APIs in a disposable Chromium profile, separate from user history.
    const profile=await fs.mkdtemp(path.join(os.tmpdir(),'historyout-qa-'));
    const extension=path.resolve('extension-unpacked');
    const real=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
    try{
      const worker=real.serviceWorkers()[0]||await real.waitForEvent('serviceworker');const id=new URL(worker.url()).host;
      await worker.evaluate(async()=>{await chrome.history.addUrl({url:'https://historyout-test.example/research'});await chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:{format:'json',historyRange:'week',dateRange:null,fields:{order:true,id:false,date:true,time:true,title:true,url:true,visitCount:false,typedCount:false,transition:false}}});});
      const p=await real.newPage();await p.goto(`chrome-extension://${id}/side-panel.html`);
      assert((await p.getByRole('combobox',{name:'History range'}).innerText()).includes('Last 7 days'));await p.getByRole('button',{name:'Preview',exact:true}).click();await p.getByRole('button',{name:'Refresh',exact:true}).waitFor();
      const dp=p.waitForEvent('download');await p.getByRole('button',{name:/^Export \d+ visits/}).click();const d=await dp;const json=JSON.parse(await fs.readFile(await d.path(),'utf8'));assert(json.some(row=>row.url==='https://historyout-test.example/research'));assert(json.every(row=>!('id' in row)&&!('timestamp' in row)));results.push('Real Manifest V3 Chromium install, history API, saved v1 settings and JSON download');
    }finally{await real.close();await fs.rm(profile,{recursive:true,force:true});}
    await fs.mkdir('launch/qa',{recursive:true});await fs.writeFile('launch/qa/browser-results.json',JSON.stringify({checked:new Date().toISOString(),results},null,2)+'\n');console.log(results.map(r=>'PASS '+r).join('\n'));
  }finally{if(browser)await browser.close().catch(()=>{});await server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
