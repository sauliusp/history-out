const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fss = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {chromium, startServer, openFixture} = require('./qa-lib.cjs');

const output = path.resolve('launch/qa');
const extension = path.resolve('extension-unpacked');
const report = {
  checked: new Date().toISOString(),
  platform: {system:process.platform,architecture:process.arch,node:process.version,os:execFileSync('sw_vers',{encoding:'utf8'}).trim()},
  extensionVersion: require('../extension-unpacked/manifest.json').version,
  bundleSha256: require('node:crypto').createHash('sha256').update(fss.readFileSync('extension-unpacked/bundle.js')).digest('hex'),
  privacy: 'All native history writes use freshly created disposable profiles. Ordinary user browser profiles are never opened or modified.',
  cases: [], browsers: [], limitations: [],
};
const cases = report.cases;
const clone = value => JSON.parse(JSON.stringify(value));
const allFields = {order:true,id:true,date:true,time:true,title:true,url:true,visitCount:true,typedCount:true,transition:true,timestamp:false,domain:false};
const exactFields = {...Object.fromEntries(Object.keys(allFields).map(key=>[key,false])),title:true,url:true,timestamp:true,domain:true};
const selectRange = async (page,name) => {await page.getByRole('combobox',{name:'History range'}).click();await page.getByRole('option',{name,exact:true}).click();};
const awaitLoaded = async page => {await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor({state:'visible'});await page.getByRole('list',{name:'History preview'}).waitFor();};
const exportButton = page => page.getByRole('button',{name:/^Export [\d,]+ (visits|pages)/});
const getPreviewURLs = page => page.getByRole('list',{name:'History preview'}).locator('li a').evaluateAll(links=>links.map(link=>link.getAttribute('href')));

function parseCSV(csv) {
  const rows=[];let row=[];let cell='';let quoted=false;
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(c==='"'){if(quoted&&csv[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  row.push(cell);rows.push(row);assert.equal(quoted,false);return rows;
}
async function check(name,fn,details={}){
  const started=performance.now();
  try {const result=await fn();cases.push({name,status:'passed',elapsedMs:Math.round(performance.now()-started),...details,...result});console.log('PASS '+name);return result;}
  catch(error){cases.push({name,status:'failed',elapsedMs:Math.round(performance.now()-started),error:error.stack,...details});throw error;}
}
async function download(page,label){
  const promised=page.waitForEvent('download');await exportButton(page).click();const result=await promised;
  const dest=path.join(output,'downloads',label+'-'+result.suggestedFilename());await fs.mkdir(path.dirname(dest),{recursive:true});await result.saveAs(dest);
  return {text:await fs.readFile(dest,'utf8'),path:dest,filename:result.suggestedFilename()};
}

async function fixtureChecks(){
  const server=await startServer();const browser=await chromium.launch({headless:true});
  try{
    const {page,context}=await openFixture(browser,server.origin);const errors=[];const network=[];
    page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(!r.url().startsWith(server.origin)&&!r.url().startsWith('blob:'))network.push(r.url());});
    await check('Fixture: no initial history reads or network uploads',async()=>{assert.equal(await page.evaluate(()=>__fixture.reads),0);assert.deepEqual(network,[]);assert.equal(await page.getByText('2.0',{exact:true}).count(),0);});
    await check('Fixture: Tell a friend copies only the canonical store URL and announces success',async()=>{
      await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedLink=value;}}});});
      await page.getByRole('button',{name:'Tell a friend',exact:true}).click();await page.getByText('Link copied. Paste it anywhere to share HistoryOut.').waitFor();
      assert.equal(await page.evaluate(()=>window.__copiedLink),'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei');
    });
    await check('Fixture: denied clipboard offers a selectable link without permission requests',async()=>{
      await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard blocked');}}});});
      await page.getByRole('button',{name:'Tell a friend',exact:true}).click();await page.getByRole('dialog',{name:'Share HistoryOut'}).waitFor();
      assert.equal(await page.getByRole('textbox',{name:'HistoryOut installation link'}).inputValue(),'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei');
      assert.equal(await page.getByRole('textbox',{name:'HistoryOut installation link'}).evaluate(input=>input.readOnly),true);
      await page.getByRole('button',{name:'Done',exact:true}).click();
    });
    await check('Fixture: support is optional and uses the existing secure contribution URL',async()=>{
      const link=page.getByRole('link',{name:'Support HistoryOut',exact:true});assert.equal(await link.getAttribute('href'),'https://www.buymeacoffee.com/saulius.developer');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
      await link.hover();await page.getByRole('tooltip').waitFor();assert.equal(await page.getByRole('tooltip').innerText(),'An optional contribution to this free project. Opens Buy Me a Coffee.');
    });
    await page.getByRole('button',{name:'Preview',exact:true}).click();await awaitLoaded(page);
    const search=page.getByRole('textbox',{name:'Search history titles or URLs'});
    await search.fill('responsive');await page.getByRole('checkbox',{name:/One row per URL/}).check();await page.getByRole('checkbox',{name:/Remove URL queries/}).check();
    await page.getByRole('button',{name:'Save view',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).fill('QA responsive');await page.getByRole('button',{name:'Save',exact:true}).click();
    await check('Fixture: saved-filter direct export cannot reset filters while pending',async()=>{
      await page.getByRole('button',{name:'QA responsive',exact:true}).click();await page.evaluate(()=>{__fixture.delay=500;});
      const resultPromise=page.waitForEvent('download');await page.getByRole('button',{name:/^Export history/}).click();
      assert.equal(await page.getByRole('button',{name:'Reset filters',exact:true}).isDisabled(),true);
      const result=await resultPromise;const parsed=parseCSV(await fs.readFile(await result.path(),'utf8'));
      const preview=await getPreviewURLs(page);assert.deepEqual(parsed.slice(1).map(r=>r[5]),preview);assert.equal(preview.length,4);
    });
    await check('Fixture: cancellation after prior preview preserves its snapshot and stops downloads',async()=>{
      let downloads=0;const observer=()=>downloads++;page.on('download',observer);
      const before=await getPreviewURLs(page);await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();
      await page.getByText('Preview cancelled. Your browsing history is unchanged.').waitFor();await page.waitForTimeout(650);
      assert.deepEqual(await getPreviewURLs(page),before);assert.equal(downloads,0);page.off('download',observer);
    });
    await check('Fixture: API failure preserves previous snapshot and retry succeeds',async()=>{
      await page.evaluate(()=>{__fixture.delay=0;__fixture.fail=true;});const before=await getPreviewURLs(page);
      await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByText('History is temporarily unavailable. Try again.').waitFor();assert.deepEqual(await getPreviewURLs(page),before);
      await page.evaluate(()=>{__fixture.fail=false;});await page.getByRole('button',{name:'Refresh',exact:true}).click();await awaitLoaded(page);assert.deepEqual(await getPreviewURLs(page),before);
    });
    await check('Fixture: no-match and empty history states never download empty data',async()=>{
      await search.fill('qa-no-such-title-8351');assert.equal(await exportButton(page).isDisabled(),true);await page.getByText('No matching visits',{exact:true}).waitFor();
      await page.evaluate(()=>{__fixture.empty=true;});await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByText('No visits in this range',{exact:true}).waitFor();assert.equal(await exportButton(page).isDisabled(),true);
    });
    await check('Fixture: 10,000 URLs and 30,000 visits remain complete and usable in the browser UI',async()=>{
      await selectRange(page,'Yesterday');await selectRange(page,'Today');
      if(await page.getByRole('button',{name:'Reset filters',exact:true}).count())await page.getByRole('button',{name:'Reset filters',exact:true}).click();
      await page.getByRole('checkbox',{name:/Remove URL queries/}).uncheck();
      await page.evaluate(()=>{
        __fixture.empty=false;__fixture.fail=false;__fixture.delay=0;__fixture.rows.length=0;
        Object.keys(__fixture.visits).forEach(key=>delete __fixture.visits[key]);
        const date=new Date();date.setHours(0,0,0,0);const start=date.getTime()+3600000;
        for(let i=0;i<10000;i++){
          const url=`https://scale${i%5}.historyout-qa.invalid/page/${i}?campaign=x#note`;
          __fixture.rows.push({id:String(i),url,title:`Scale record ${i}`,lastVisitTime:start+i+2,visitCount:3,typedCount:0});
          __fixture.visits[url]=[0,1,2].map(n=>({id:String(i),visitId:`${i}-${n}`,visitTime:start+i+n,referringVisitId:'0',transition:'link'}));
        }
      });
      const started=performance.now();await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Export 30,000 visits CSV',exact:true}).waitFor({timeout:30000}).catch(async error=>{report.scaleDebug=await page.locator('body').innerText();console.log(report.scaleDebug);throw error;});
      const loadMs=Math.round(performance.now()-started);assert.equal(await page.getByRole('list',{name:'History preview'}).locator('li').count(),100);
      const queryStarted=performance.now();await search.fill('Scale record 99');await page.getByRole('button',{name:'Export 333 visits CSV',exact:true}).waitFor();const filterMs=Math.round(performance.now()-queryStarted);await search.fill('');
      const result=await download(page,'scale-30000');const parsed=parseCSV(result.text);assert.equal(parsed.length-1,30000);assert.equal(parsed[0].length,9);
      return {candidateURLs:10000,visits:30000,renderedPreviewRows:100,loadMs,filterMs,downloadBytes:Buffer.byteLength(result.text),file:result.path,note:'Synthetic Chrome API fixture timing in a real browser UI on this machine. Not a real-profile latency guarantee.'};
    });
    await check('Fixture: no runtime exceptions and no extension network requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(network,[]);});
    await context.close();
  }finally{await browser.close();await server.close();}
}

function calendarSeed(){
  const today=new Date();today.setHours(0,0,0,0);const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
  const start=yesterday.getTime();const end=today.getTime()-1;const h=3600000;
  const records=[
    {url:'https://research.historyout-qa.invalid/project?campaign=alpha#overview',title:'Research alpha',times:[start+9*h,Date.now()-1000]},
    {url:'https://research.historyout-qa.invalid/project?campaign=beta#notes',title:'Research beta',times:[start+10*h,end]},
    {url:'https://historyout-qa.invalid/start-boundary',title:'Start boundary',times:[start]},
    {url:'https://historyout-qa.invalid/before-boundary',title:'Before boundary',times:[start-1]},
    {url:'https://historyout-qa.invalid/after-boundary',title:'After boundary',times:[end+1]},
    {url:'https://historyout-qa.invalid/hostile?token=alpha#section',title:'=SUM(1,2)\n<img src=x onerror="alert(1)">',times:[start+15*h]},
    {url:'https://other.historyout-qa.invalid/unrelated',title:'Unrelated useful page',times:[start+16*h]},
  ];
  return {start,end,records,date:`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`};
}
const patchHistory = String.raw`
import json, sqlite3, sys
payload=json.loads(sys.stdin.read())
con=sqlite3.connect(sys.argv[1])
for record in payload['records']:
    row=con.execute('SELECT id FROM urls WHERE url=?',(record['url'],)).fetchone()
    assert row, 'seed URL missing'
    visits=con.execute('SELECT id FROM visits WHERE url=? ORDER BY id',(row[0],)).fetchall()
    assert len(visits)==len(record['times']), (record['url'],len(visits),len(record['times']))
    for visit,time in zip(visits,record['times']):
        con.execute('UPDATE visits SET visit_time=? WHERE id=?',((time+11644473600000)*1000,visit[0]))
    con.execute('UPDATE urls SET title=?,visit_count=?,typed_count=?,last_visit_time=? WHERE id=?',(record['title'],len(visits),0,(max(record['times'])+11644473600000)*1000,row[0]))
con.commit()
print(json.dumps({'seededUrls':len(payload['records']),'seededVisits':sum(len(row['times']) for row in payload['records'])}))
`;
async function nativeChecks(name,executablePath,keepForReview=false){
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),`historyout-${name}-isolated-`));
  const launchOptions={headless:true,acceptDownloads:true,viewport:{width:500,height:1000},locale:'en-GB',args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]};
  if(executablePath)launchOptions.executablePath=executablePath;else launchOptions.channel='chromium';
  let context;
  const entry={name,profile,mode:'Installed unpacked Manifest V3 extension, isolated profile',headless:true};report.browsers.push(entry);
  const seed=calendarSeed();
  try{
    context=await chromium.launchPersistentContext(profile,launchOptions);
    const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');entry.version=context.browser().version();entry.extensionId=new URL(worker.url()).host;
    const manifest=await worker.evaluate(()=>chrome.runtime.getManifest());assert.equal(manifest.version,report.extensionVersion);
    await check(`${name}: a fresh native install opens its welcome once`,async()=>{
      for(let attempt=0;attempt<100;attempt++){
        const saved=await worker.evaluate(async()=>(await chrome.storage.local.get('historyoutOpenedVersion')).historyoutOpenedVersion);
        if(saved===report.extensionVersion&&context.pages().some(p=>p.url().startsWith('https://historyout.sauliusdev.chatgpt.site/welcome/')))break;
        await new Promise(resolve=>setTimeout(resolve,50));
      }
      assert.equal(context.pages().filter(p=>p.url().startsWith('https://historyout.sauliusdev.chatgpt.site/welcome/')).length,1);
      return {welcomeURL:'https://historyout.sauliusdev.chatgpt.site/welcome/'};
    });
    await worker.evaluate(async(records)=>{for(const row of records)for(const time of row.times)await chrome.history.addUrl({url:row.url});},seed.records);
    await context.close();context=null;
    entry.fixture=JSON.parse(execFileSync('python3',['-c',patchHistory,path.join(profile,'Default','History')],{input:JSON.stringify(seed),encoding:'utf8'}));
    context=await chromium.launchPersistentContext(profile,launchOptions);
    const liveWorker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
    const page=await context.newPage();const errors=[];const uploads=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('chrome-extension:')&&!request.url().startsWith('blob:'))uploads.push(request.url());});
    const base=`chrome-extension://${entry.extensionId}/side-panel.html`;
    const v1={format:'json',historyRange:'week',dateRange:null,fields:{order:true,id:false,date:true,time:true,title:true,url:true,visitCount:false,typedCount:false,transition:false}};
    await liveWorker.evaluate(value=>chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:value}),v1);
    await page.goto(base);
    await check(`${name}: native Tell a friend succeeds or exposes its selectable fallback`,async()=>{
      await page.getByRole('button',{name:'Tell a friend',exact:true}).click();
      const outcome=await Promise.race([
        page.getByText('Link copied. Paste it anywhere to share HistoryOut.').waitFor().then(()=> 'clipboard-success'),
        page.getByRole('dialog',{name:'Share HistoryOut'}).waitFor().then(()=> 'selectable-fallback'),
      ]);
      if(outcome==='selectable-fallback'){
        assert.equal(await page.getByRole('textbox',{name:'HistoryOut installation link'}).inputValue(),'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei');await page.getByRole('button',{name:'Done',exact:true}).click();
      }
      return {outcome};
    });
    await check(`${name}: real v1 preferences migrate, persist, and survive reload`,async()=>{
      assert.match(await page.getByRole('combobox',{name:'History range'}).innerText(),/Last 7 days/);
      await page.waitForTimeout(400);const saved=await liveWorker.evaluate(async()=>(await chrome.storage.local.get('HISTORY_OUTPUT_CONFIG')).HISTORY_OUTPUT_CONFIG);
      for(const [key,value] of Object.entries(v1.fields))assert.equal(saved.fields[key],value);
      assert.equal(saved.fields.timestamp,false);assert.equal(saved.fields.domain,false);assert.equal(saved.format,'json');
      await page.reload();assert.match(await page.getByRole('combobox',{name:'History range'}).innerText(),/Last 7 days/);
    });
    await selectRange(page,'Custom dates');await page.getByRole('textbox',{name:'Start date'}).fill(seed.date);await page.getByRole('textbox',{name:'End date'}).fill(seed.date);
    await page.waitForTimeout(400);
    await check(`${name}: custom calendar dates include both boundaries and a URL revisited later`,async()=>{
      await page.getByRole('button',{name:'Preview',exact:true}).click();await awaitLoaded(page);
      const previews=await getPreviewURLs(page);const expected=seed.records.flatMap(row=>row.times.filter(time=>time>=seed.start&&time<=seed.end).map(timestamp=>({url:row.url,timestamp}))).sort((a,b)=>b.timestamp-a.timestamp);
      assert.deepEqual(previews,expected.map(row=>row.url));assert.equal(previews.length,6);
      return {range:{start:seed.start,end:seed.end,localDate:seed.date},expectedVisits:6,revisitedURLIncluded:true};
    });
    const config={format:'json',historyRange:'custom',dateRange:{startTime:seed.start,endTime:seed.end},fields:exactFields};
    await liveWorker.evaluate(value=>chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:value}),config);await page.reload();await page.getByRole('button',{name:'Preview',exact:true}).click();await awaitLoaded(page);
    const expected=seed.records.flatMap(row=>row.times.filter(time=>time>=seed.start&&time<=seed.end).map(timestamp=>({title:row.title,url:row.url,timestamp,domain:new URL(row.url).hostname}))).sort((a,b)=>b.timestamp-a.timestamp);
    await check(`${name}: JSON download exactly matches six selected native visits`,async()=>{
      const result=await download(page,name+'-exact');assert.equal(result.filename,'history-export.json');assert.deepEqual(JSON.parse(result.text),expected);return {file:result.path,rows:expected.length,columns:Object.keys(expected[0])};
    });
    await page.getByRole('button',{name:'CSV, for spreadsheets',exact:true}).click();
    await check(`${name}: CSV download preserves rows and safely quotes spreadsheet formulas and newlines`,async()=>{
      const result=await download(page,name+'-exact');const parsed=parseCSV(result.text);assert.deepEqual(parsed[0],['title','url','timestamp','domain']);
      assert.deepEqual(parsed.slice(1),expected.map(row=>[row.title.startsWith('=')?"'"+row.title:row.title,row.url,String(row.timestamp),row.domain]));return {file:result.path,rows:parsed.length-1};
    });
    await page.getByRole('button',{name:'HTML, readable in a browser',exact:true}).click();
    await check(`${name}: HTML download preserves selected cells and blocks injected markup`,async()=>{
      const result=await download(page,name+'-exact');assert(!result.text.includes('<img'));const htmlPage=await context.newPage();await htmlPage.goto(pathToFileURL(result.path).href);
      const cells=await htmlPage.locator('tbody tr').evaluateAll(rows=>rows.map(row=>Array.from(row.querySelectorAll('td'),cell=>cell.textContent)));
      assert.deepEqual(cells,expected.map(row=>[row.title,row.url,String(row.timestamp),row.domain]));assert.equal(await htmlPage.locator('img,script').count(),0);assert.match(await htmlPage.locator('h1').innerText(),/Your browsing history/);await htmlPage.close();return {file:result.path,rows:cells.length};
    });
    await check(`${name}: cleanup plus latest-URL mode exports the exact preview`,async()=>{
      await page.getByRole('textbox',{name:'Search history titles or URLs'}).fill('research');await page.getByRole('checkbox',{name:/One row per URL/}).check();await page.getByRole('checkbox',{name:/Remove URL queries/}).check();
      const previews=await getPreviewURLs(page);assert.deepEqual(previews,['https://research.historyout-qa.invalid/project']);
      await page.getByRole('button',{name:'JSON, structured data',exact:true}).click();const result=await download(page,name+'-filtered');const parsed=JSON.parse(result.text);assert.equal(parsed.length,1);assert.equal(parsed[0].url,previews[0]);assert.equal(parsed[0].title,'Research beta');assert.equal(parsed[0].timestamp,seed.end);
    });
    await check(`${name}: saved view survives closing its app and reapplying after reload`,async()=>{
      await page.getByRole('button',{name:'Save view',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).fill('QA research view');await page.getByRole('button',{name:'Save',exact:true}).click();
      await page.reload();await page.getByRole('button',{name:'QA research view',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Preview',exact:true}).isVisible(),true);
      await page.getByRole('button',{name:'Preview',exact:true}).click();await awaitLoaded(page);assert.deepEqual(await getPreviewURLs(page),['https://research.historyout-qa.invalid/project']);
      const saved=await liveWorker.evaluate(()=>chrome.storage.local.get(null));assert.deepEqual(Object.keys(saved).sort(),['HISTORY_OUTPUT_CONFIG','historyoutOpenedVersion','historyoutSavedViews']);assert.equal(saved.historyoutSavedViews.length,1);assert.equal(saved.historyoutSavedViews[0].query,'research');assert.equal('items' in saved.historyoutSavedViews[0],false);
    });
    await check(`${name}: native preview has no runtime errors or page network uploads`,async()=>{assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);});
    entry.sidePanelBehavior=await liveWorker.evaluate(async()=>typeof chrome.sidePanel?.getPanelBehavior==='function'?await chrome.sidePanel.getPanelBehavior():null);
    await page.screenshot({path:path.join(output,name+'-installed-app.png'),fullPage:true});
    if(keepForReview){
      await liveWorker.evaluate(value=>chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:value}),{format:'csv',historyRange:'yesterday',dateRange:null,fields:allFields});
      report.visibleReview={profile,executable:executablePath||chromium.executablePath(),extensionPath:extension,extensionId:entry.extensionId,url:base,fixture:'Fictional native browser history only'};
    }
  }finally{if(context)await context.close();if(!keepForReview)await fs.rm(profile,{recursive:true,force:true});}
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  try{
    await fixtureChecks();
    await nativeChecks('chromium',null,true);
    const edge='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
    if(fss.existsSync(edge))await nativeChecks('edge',edge);else report.limitations.push('Microsoft Edge was not installed.');
    report.limitations.push('Brave is not installed on this Mac; its archive is checked but no Brave runtime result is claimed.');
    report.limitations.push('Native profiles use unpacked extensions. Chrome Web Store signed update, review, and staged rollout are not reproduced locally.');
    report.limitations.push('Faults and cancellation are browser UI fixture tests; ordinary profile data and browser internals are not fault-injected.');
    if(process.argv.includes('--show-review')&&report.visibleReview){
      const {profile,executable,url}=report.visibleReview;
      const child=spawn(executable,[`--user-data-dir=${profile}`,`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--no-first-run','--no-default-browser-check',`--app=${url}`],{detached:true,stdio:'ignore'});child.unref();report.visibleReview.pid=child.pid;report.visibleReview.launched=true;
    }
    report.status='passed';
  }catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);}
  finally{report.completed=new Date().toISOString();await fs.writeFile(path.join(output,'release-readiness.json'),JSON.stringify(report,null,2)+'\n');}
})();
