const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium, startServer, installFixture } = require('./qa-lib.cjs');
const { exerciseMultiplePages } = require('./native-multi-window-qa.cjs');

const NOW = Date.parse('2026-09-07T14:00:00Z');
const KEYS = ['order','id','date','time','title','url','visitCount','typedCount','transition','timestamp','domain'];
const LABELS = ['Order','Id','Date','Time','Title','Url','Visit Count','Typed Count','Transition','Timestamp','Domain'];
const FORMAT_LABELS = { csv:'CSV, for spreadsheets', json:'JSON, structured data', html:'HTML, readable in a browser' };
const STORE = 'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei';
const CONFIG = { format:'json', historyRange:'today', dateRange:null, fields:Object.fromEntries(KEYS.map(key=>[key,['title','url','timestamp'].includes(key)])) };
const matrix = [];
const cases = [];
let output, server, browser;
const track = (control, evidence, scope='new option suite') => matrix.push({ control, evidence, scope });
const action = page => page.getByRole('button',{name:/^Export (history|[\d,]+ (visits|pages))/});
const preview = page => page.getByRole('list',{name:'History preview'});
const urls = page => preview(page).locator('li a').evaluateAll(links=>links.map(link=>link.href));
const copy = value => JSON.parse(JSON.stringify(value));

function parseCSV(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  row.push(cell);rows.push(row);assert.equal(quoted,false);
  const keys=rows.shift();return { keys, rows:rows.map(row=>Object.fromEntries(keys.map((key,index)=>[key,row[index]]))) };
}
async function ready(page) { await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Preview'&&!button.disabled)); }
async function range(page,label) { await page.getByRole('combobox',{name:'History range'}).click();await page.getByRole('option',{name:label,exact:true}).click(); }
async function format(page,type) { await page.getByRole('button',{name:FORMAT_LABELS[type],exact:true}).click();assert.equal(await page.getByRole('button',{name:FORMAT_LABELS[type],exact:true}).getAttribute('aria-pressed'),'true'); }
async function columns(page,selected) {
  await page.getByRole('combobox',{name:'Include'}).click();
  for(let i=0;i<KEYS.length;i++){
    const option=page.getByRole('option',{name:new RegExp('^Include '+LABELS[i]+' '+LABELS[i]+'(?: |$)')});
    if((await option.getAttribute('aria-selected')==='true')!==selected.includes(KEYS[i]))await option.click();
  }
  await page.keyboard.press('Escape');
}
async function load(page) {
  await page.getByRole('button',{name:/^(Preview|Refresh)$/}).click();
  await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();
  await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Refresh'&&button.disabled));
}
async function rowsInto(page,records) {
  await page.evaluate(records=>{
    const f=window.__fixture;f.rows.splice(0);Object.keys(f.visits).forEach(key=>delete f.visits[key]);
    for(const [index,record] of records.entries()){
      const url=record.url;const times=record.times;
      f.rows.push({id:String(index+1),url,title:record.title,lastVisitTime:Math.max(...times),visitCount:times.length+5,typedCount:2});
      f.visits[url]=times.map((visitTime,n)=>({id:String(index+1),visitId:`${index}-${n}`,visitTime,referringVisitId:'0',transition:n?'link':'typed'}));
    }
  },records);
}
async function fixture(records) {
  const context=await browser.newContext({viewport:{width:400,height:900},locale:'en-GB',timezoneId:'Europe/Vilnius',acceptDownloads:true});
  await context.addInitScript({content:`(${installFixture.toString()})(${NOW}); if(!localStorage.getItem('HISTORY_OUTPUT_CONFIG')) localStorage.setItem('HISTORY_OUTPUT_CONFIG',${JSON.stringify(JSON.stringify(CONFIG))});`});
  const page=await context.newPage();await page.clock.setFixedTime(new Date(NOW));
  const errors=[];const requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  context.on('request',request=>{if(!request.url().startsWith(server.origin+'/')&&!request.url().startsWith('blob:'))requests.push(request.url());});
  await page.goto(server.origin+'/panel');await ready(page);if(records)await rowsInto(page,records);
  return {page,context,errors,requests};
}
async function download(page,type,name) {
  // Pace automated downloads to avoid an artificial rapid burst.
  await page.waitForTimeout(350);
  const next=page.waitForEvent('download');await action(page).click();const file=await next;
  assert.equal(file.suggestedFilename(),`history-export.${type}`);
  const destination=path.join(output,'downloads',`${name}.${type}`);await file.saveAs(destination);
  const text=await fs.readFile(destination,'utf8');
  await page.getByText(new RegExp(`${type.toUpperCase()} download started`)).waitFor();
  if(type==='json'){const rows=JSON.parse(text);return {keys:Object.keys(rows[0]||{}),rows};}
  if(type==='csv')return parseCSV(text);
  return page.evaluate(text=>{
    const doc=new DOMParser().parseFromString(text,'text/html');
    const keys=[...doc.querySelectorAll('thead th')].map(el=>el.textContent);
    return {keys,rows:[...doc.querySelectorAll('tbody tr')].map(row=>Object.fromEntries([...row.cells].map((cell,index)=>[keys[index],cell.textContent]))),links:[...doc.querySelectorAll('tbody a')].map(link=>({href:link.getAttribute('href'),target:link.target,rel:link.rel}))};
  },text);
}
async function check(name,fn) {
  console.log('RUN '+name);const start=Date.now();
  try{const result=await fn();cases.push({name,status:'passed',elapsedMs:Date.now()-start,...result});console.log('PASS '+name);}
  catch(error){cases.push({name,status:'failed',elapsedMs:Date.now()-start,error:error.stack});throw error;}
}
async function finish(state,name) {
  assert.deepEqual(state.errors,[]);assert.deepEqual(state.requests,[]);
  await state.page.screenshot({path:path.join(output,name+'.png'),fullPage:true,animations:'disabled'});
  await state.context.close();
}
const projectRows = [
  {url:'https://alpha.example/project?draft=1#first',title:'Project Alpha',times:[NOW-10000,NOW-50000]},
  {url:'https://alpha.example/project?draft=2#latest',title:'Project latest',times:[NOW-5000]},
  {url:'https://sub.alpha.example/notes?source=test',title:'Notes for Project Beta',times:[NOW-20000]},
  {url:'https://beta.example/reference',title:'Project comparison',times:[NOW-30000]},
  {url:'https://alpha.example.evil.test/elsewhere',title:'Unrelated reference',times:[NOW-40000]},
];

(async()=>{
  await fs.mkdir('/tmp/historyout-submission-2026-09-07',{recursive:true});
  output=await fs.mkdtemp('/tmp/historyout-submission-2026-09-07/options-');await fs.mkdir(path.join(output,'downloads'));
  server=await startServer();browser=await chromium.launch({headless:true});
  try {
    await check('All preset ranges preview and export their exact boundaries',async()=>{
      const instants={now:NOW,todayStart:Date.parse('2026-09-06T21:00:00Z'),yesterdayEnd:Date.parse('2026-09-06T20:59:59.999Z'),dayBoundary:Date.parse('2026-09-06T14:00:00Z'),beforeDay:Date.parse('2026-09-06T13:59:59.999Z'),yesterdayStart:Date.parse('2026-09-05T21:00:00Z'),weekBoundary:Date.parse('2026-08-31T14:00:00Z'),beforeWeek:Date.parse('2026-08-31T13:59:59.999Z'),monthBoundary:Date.parse('2026-08-08T14:00:00Z'),beforeMonth:Date.parse('2026-08-08T13:59:59.999Z'),old:Date.parse('2026-03-11T10:00:00Z')};
      const records=Object.entries(instants).map(([title,time])=>({title,url:`https://ranges.example/${title}`,times:[time]}));
      const state=await fixture(records);const {page}=state;
      const expected={Today:['now','todayStart'],Yesterday:['yesterdayEnd','dayBoundary','beforeDay','yesterdayStart'],'Last 24 hours':['now','todayStart','yesterdayEnd','dayBoundary'],'Last 7 days':['now','todayStart','yesterdayEnd','dayBoundary','beforeDay','yesterdayStart','weekBoundary'],'Last 30 days':['now','todayStart','yesterdayEnd','dayBoundary','beforeDay','yesterdayStart','weekBoundary','beforeWeek','monthBoundary'],'All available history':Object.keys(instants)};
      for(const [label,titles] of Object.entries(expected)){
        await range(page,label);await load(page);
        const displayed=await preview(page).locator('li a').allTextContents();assert.deepEqual(displayed,titles);
        const result=await download(page,'json','range-'+label.replaceAll(' ','-'));assert.deepEqual(result.rows.map(row=>row.title),titles);
        track('History range: '+label,'Exact preview and JSON rows, boundary inclusions and exclusions');
      }
      await finish(state,'ranges-all');return {presets:6};
    });

    await check('Custom dates reject incomplete/reversed input and export valid single days',async()=>{
      const state=await fixture([{title:'Start boundary',url:'https://dates.example/start',times:[Date.parse('2026-09-05T21:00:00Z')]},{title:'End boundary',url:'https://dates.example/end',times:[Date.parse('2026-09-06T20:59:59.999Z')]},{title:'Adjacent',url:'https://dates.example/outside',times:[Date.parse('2026-09-06T21:00:00Z')]}]);const {page}=state;
      await range(page,'Custom dates');const start=page.getByLabel('Start date',{exact:true}),end=page.getByLabel('End date',{exact:true});
      assert.equal(await start.getAttribute('type'),'date');assert.equal(await end.getAttribute('type'),'date');
      assert.equal(await action(page).isDisabled(),true);
      await end.fill('2026-09-06');assert.equal(await action(page).isDisabled(),true);
      await start.fill('2026-09-07');assert.equal(await action(page).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Preview',exact:true}).isDisabled(),true);
      await start.fill('2026-09-06');await load(page);assert.deepEqual((await download(page,'json','custom-single-day')).rows.map(row=>row.title),['End boundary','Start boundary']);
      await end.fill('');assert.equal(await action(page).isDisabled(),true);
      await end.fill('2026-09-06');await start.fill('');assert.equal(await action(page).isDisabled(),true);
      await start.fill('2026-09-06');assert.equal(await start.getAttribute('max'),'2026-09-07');assert.equal(await end.getAttribute('min'),'2026-09-06');
      track('Custom dates: From and Through','End-only, start-after-end, cleared values disable export; valid single-day includes both endpoints; native constraints intact');
      await finish(state,'custom-validation');
    });

    await check('Every output column can stand alone and all/none states work in each format',async()=>{
      const state=await fixture(projectRows.slice(0,1));const {page}=state;await load(page);
      await columns(page,[]);assert.equal(await action(page).isDisabled(),true);await page.getByText('Choose at least one column.',{exact:true}).waitFor();
      for(const type of ['csv','json','html']){await format(page,type);assert.equal(await action(page).isDisabled(),true);}
      await format(page,'json');
      for(const key of KEYS){await columns(page,[key]);const result=await download(page,'json','column-'+key);assert.deepEqual(result.keys,[key]);assert.equal(result.rows.length,2);assert.ok(result.rows.every(row=>row[key]!==''&&row[key]!==undefined));track('Include: '+LABELS[KEYS.indexOf(key)],'Selected alone through UI and present as sole key in real JSON download');}
      await columns(page,KEYS);
      for(const type of ['csv','json','html']){
        await format(page,type);await format(page,type);assert.equal(await page.getByRole('button',{name:FORMAT_LABELS[type],exact:true}).getAttribute('aria-pressed'),'true','Clicking selected format does not clear it');
        const result=await download(page,type,'all-columns-'+type);assert.deepEqual(result.keys,type==='html'?LABELS:KEYS);assert.equal(result.rows.length,2);
        track('Export format: '+type.toUpperCase(),'Selected and reselected; all 11 columns in real downloaded file');
      }
      track('Include: no columns / all columns','Zero columns disables export in all three formats, restoring selection reenables export');
      await finish(state,'all-columns');return {individualColumns:11,allColumnsFormats:3,noColumnsFormats:3};
    });

    await check('Live title/URL/site filters, top sites, clear and reset agree',async()=>{
      const state=await fixture(projectRows);const {page}=state;await load(page);const all=await urls(page),reads=await page.evaluate(()=>__fixture.reads);
      const search=page.getByRole('textbox',{name:'Search history titles or URLs'});
      await search.fill('project ALPHA');assert.equal((await urls(page)).length,2);
      await page.getByRole('button',{name:'Clear search',exact:true}).click();assert.deepEqual(await urls(page),all);
      await search.fill('draft=2');assert.deepEqual(await urls(page),[projectRows[1].url]);
      await page.getByRole('button',{name:'Clear search',exact:true}).click();
      const website=page.getByRole('combobox',{name:'Filter by website',exact:true});
      await website.click();const sites=await page.getByRole('option').allTextContents();
      for(const site of sites.filter(site=>site!=='All websites')){
        await page.getByRole('option',{name:site,exact:true}).click();const actual=await urls(page);
        const expected=all.filter(url=>{const host=new URL(url).hostname;return host===site||host.endsWith('.'+site);});assert.deepEqual(actual,expected);await website.click();
      }
      await page.getByRole('option',{name:'All websites',exact:true}).click();assert.deepEqual(await urls(page),all);
      const top=page.getByRole('button',{name:/^alpha\.example \d+ visits$/});await top.click();assert.equal(await top.getAttribute('aria-pressed'),'true');assert.ok((await urls(page)).every(url=>new URL(url).hostname==='alpha.example'||new URL(url).hostname==='sub.alpha.example'));await top.click();assert.deepEqual(await urls(page),all);
      await search.fill('not-a-match');assert.equal(await action(page).isDisabled(),true);await page.getByRole('button',{name:'Clear filters',exact:true}).click();assert.deepEqual(await urls(page),all);
      await search.fill('Project');await page.getByRole('checkbox',{name:/One row per URL/}).check();await page.getByRole('checkbox',{name:/Remove URL queries/}).check();await page.getByRole('button',{name:'Reset filters',exact:true}).click();
      assert.equal(await search.inputValue(),'');assert.equal(await page.getByRole('checkbox',{name:/One row per URL/}).isChecked(),false);assert.equal(await page.getByRole('checkbox',{name:/Remove URL queries/}).isChecked(),true,'Reset filters preserves separate output cleanup choice');
      assert.equal(await page.evaluate(()=>__fixture.reads),reads,'Local filters do not reread history');
      track('Search, Clear search, website options, All websites','Case-insensitive title and URL search plus each domain option exact rows, no history reread');
      track('Most visited site toggles','Pressed/unpressed state and real subdomain inclusion; similarly named hostile domain excluded');
      track('Reset filters / Clear filters','Loaded reset and no-match clear restore the trail; output cleanup stays independent');
      await finish(state,'filters');
    });

    await check('All cleanup and one-row combinations match preview across CSV/JSON/HTML',async()=>{
      const state=await fixture(projectRows);const {page}=state;await load(page);await columns(page,['title','url','timestamp']);
      const expected={
        'false-false':[projectRows[1].url,projectRows[0].url,projectRows[2].url,projectRows[3].url,projectRows[4].url,projectRows[0].url],
        'true-false':[projectRows[1].url,projectRows[0].url,projectRows[2].url,projectRows[3].url,projectRows[4].url],
        'false-true':['https://alpha.example/project','https://alpha.example/project','https://sub.alpha.example/notes',projectRows[3].url,projectRows[4].url,'https://alpha.example/project'],
        'true-true':['https://alpha.example/project','https://sub.alpha.example/notes',projectRows[3].url,projectRows[4].url],
      };
      for(const unique of [false,true])for(const cleanup of [false,true]){
        await page.getByRole('checkbox',{name:/One row per URL/}).setChecked(unique);await page.getByRole('checkbox',{name:/Remove URL queries/}).setChecked(cleanup);
        const want=expected[`${unique}-${cleanup}`];assert.deepEqual(await urls(page),want);
        for(const type of ['csv','json','html']){
          await format(page,type);const result=await download(page,type,`combo-${unique}-${cleanup}-${type}`);const key=type==='html'?'Url':'url';assert.deepEqual(result.rows.map(row=>row[key]),want);
          if(unique&&cleanup)assert.equal(result.rows[0][type==='html'?'Title':'title'],'Project latest','Cleanup merges URLs before latest-visit selection');
          if(type==='html')assert.ok(result.links.every(link=>link.target==='_blank'&&link.rel==='noopener noreferrer'));
        }
      }
      track('One row per URL / Remove URL queries & fragments','All four states with exact preview agreement in 12 CSV/JSON/HTML downloads, including latest after cleanup');
      await finish(state,'combinations');return {optionStates:4,formatDownloads:12};
    });

    await check('Preview cap and refresh snapshot preserve full export in all formats',async()=>{
      const records=Array.from({length:105},(_,n)=>({title:'Trail '+n,url:`https://trail.example/${n}`,times:[NOW-n*1000]}));
      const state=await fixture(records);const {page}=state;await load(page);
      assert.equal(await preview(page).locator('li').count(),100);await page.getByText('Previewing 100 of 105. Your export includes every match.',{exact:true}).waitFor();
      await preview(page).focus();await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('[aria-label="History preview"]').scrollTop>0);
      await page.getByRole('textbox',{name:'Search history titles or URLs'}).fill('Trail 104');assert.equal(await preview(page).evaluate(el=>el.scrollTop),0);await page.getByRole('button',{name:'Clear search',exact:true}).click();
      for(const type of ['csv','json','html']){await format(page,type);const result=await download(page,type,'preview-cap-'+type);assert.equal(result.rows.length,105);assert.equal(result.rows.at(-1)[type==='html'?'Title':'title'],'Trail 104');}
      const reads=await page.evaluate(()=>__fixture.reads);await rowsInto(page,[...records,{title:'New retained visit',url:'https://trail.example/new',times:[NOW+1000]}]);
      await page.clock.setFixedTime(new Date(NOW+2000));assert.equal(await preview(page).locator('li').count(),100);assert.match(await action(page).innerText(),/105 visits/);
      await page.getByText(/Refresh for new visits/).waitFor();await load(page);assert.match(await action(page).innerText(),/106 visits/);assert.equal(await page.evaluate(()=>__fixture.reads),reads+1);
      const link=preview(page).locator('li a').first();assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');await link.focus();assert.equal(await link.evaluate(el=>el===document.activeElement),true);
      track('Preview list, keyboard scrolling and revisit links','100 rendered rows, End scrolls, changed query resets scroll, safe keyboard-focusable links');
      track('Preview / Refresh / export counts and loaded notice','105 complete rows across all formats; cached snapshot changes to 106 only on Refresh');
      await finish(state,'preview-limit');return {rendered:100,exportedPerFormat:105,afterRefresh:106};
    });

    await check('Saved views apply, overwrite, reset and delete with persistence',async()=>{
      const state=await fixture(projectRows);const {page}=state;await load(page);await page.getByRole('textbox',{name:'Search history titles or URLs'}).fill('Project');
      await page.getByRole('combobox',{name:'Filter by website',exact:true}).click();await page.getByRole('option',{name:'alpha.example',exact:true}).click();
      await page.getByRole('checkbox',{name:/One row per URL/}).check();await page.getByRole('checkbox',{name:/Remove URL queries/}).check();
      await page.getByRole('button',{name:'Save view',exact:true}).click();const name=page.getByRole('textbox',{name:'View name'});assert.equal(await name.getAttribute('maxlength'),'40');await name.fill('   ');assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);await name.fill('Project work');await name.press('Enter');
      await page.getByText('Saved “Project work”. Return to these settings with one click.',{exact:true}).waitFor();const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews'))[0]);
      await format(page,'csv');await page.getByRole('button',{name:'Save view',exact:true}).click();await name.fill('PROJECT WORK');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved “PROJECT WORK”. Return to these settings with one click.',{exact:true}).waitFor();
      const overwritten=await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews')));assert.equal(overwritten.length,1);assert.equal(overwritten[0].id,original.id);assert.equal(overwritten[0].config.format,'csv');assert.ok(!('items' in overwritten[0]));
      await page.getByRole('button',{name:'Reset filters',exact:true}).click();await page.getByRole('checkbox',{name:/Remove URL queries/}).uncheck();await range(page,'Last 30 days');await format(page,'html');
      const reads=await page.evaluate(()=>__fixture.reads);const view=page.getByRole('button',{name:'PROJECT WORK',exact:true});await view.focus();await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(()=>__fixture.reads),reads);assert.match(await page.getByRole('combobox',{name:'History range'}).innerText(),/Today/);assert.equal(await page.getByRole('button',{name:FORMAT_LABELS.csv,exact:true}).getAttribute('aria-pressed'),'true');
      await page.getByText('Active on preview & export',{exact:true}).waitFor();await page.getByRole('button',{name:'Reset filters',exact:true}).click();assert.equal(await page.getByText('Active on preview & export',{exact:true}).count(),0);
      await view.click();const direct=await download(page,'csv','saved-view-direct');assert.deepEqual(direct.rows.map(row=>row.url),['https://alpha.example/project','https://sub.alpha.example/notes']);
      await page.getByRole('alert').filter({hasText:'download started'}).getByRole('button',{name:'Close',exact:true}).click();
      await page.evaluate(()=>{const originalSet=chrome.storage.local.set;window.__restoreSet=()=>chrome.storage.local.set=originalSet;chrome.storage.local.set=async values=>{if('historyoutSavedViews' in values)throw new Error('Synthetic delete failure');return originalSet(values);};});
      await view.focus();await page.keyboard.press('Delete');await page.getByText('This view could not be deleted. It is still saved. Please try again.',{exact:true}).waitFor();assert.equal(await view.count(),1);
      await page.evaluate(()=>window.__restoreSet());await view.focus();await page.keyboard.press('Backspace');await view.waitFor({state:'hidden'});await page.reload();await ready(page);assert.equal(await page.getByRole('button',{name:'PROJECT WORK',exact:true}).count(),0);
      await page.getByRole('button',{name:'Save view',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).fill('Delete by icon');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Delete by icon',exact:true}).waitFor();await page.getByLabel('Delete saved view Delete by icon',{exact:true}).click();await page.getByRole('button',{name:'Delete by icon',exact:true}).waitFor({state:'hidden'});
      await page.getByRole('button',{name:'Save view',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).waitFor();await page.getByRole('button',{name:'Save view',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'View name'}).count(),0);
      track('Save view toggle, name, Save/Enter','Whitespace disabled, 40-character limit, form toggle, successful named settings save');
      track('Saved view chip / overwrite / delete','Case-insensitive overwrite keeps ID; keyboard apply restores settings without read; unloaded Reset filters; direct export; failed deletion preserved; Delete/Backspace/icon deletion persists');
      track('Dismiss notice','Download alert closes without changing loaded data');
      await finish(state,'saved-views');
    });

    await check('Saved-view capacity rejects a thirteenth name and recovers through update and delete',async()=>{
      const state=await fixture(projectRows);const {page}=state;
      const saved=Array.from({length:12},(_,i)=>({id:'capacity-'+i,name:'Project '+(i+1),config:copy(CONFIG),query:'',domain:'',uniqueUrls:false,stripQuery:false}));
      await page.evaluate(saved=>localStorage.setItem('historyoutSavedViews',JSON.stringify(saved)),saved);await page.reload();await ready(page);
      await page.evaluate(()=>{window.__viewWrites=0;const set=chrome.storage.local.set;chrome.storage.local.set=async values=>{if('historyoutSavedViews' in values)window.__viewWrites++;return set(values);};});
      await page.getByRole('button',{name:'Save view',exact:true}).click();const name=page.getByRole('textbox',{name:'View name'});await name.fill('Project 13');await page.getByRole('button',{name:'Save',exact:true}).click();
      const capacityError='You already have 12 saved views. Delete an existing view or reuse its name to update it.';await page.getByText(capacityError,{exact:true}).waitFor();assert.equal(await name.isVisible(),true);assert.equal(await page.evaluate(()=>window.__viewWrites),0);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews'))),saved);
      for(const view of saved)assert.equal(await page.getByRole('button',{name:view.name,exact:true}).count(),1);
      await format(page,'html');await name.fill('PROJECT 1');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved “PROJECT 1”. Return to these settings with one click.',{exact:true}).waitFor();
      const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews')));assert.equal(updated.length,12);assert.equal(updated.find(view=>view.id==='capacity-0').config.format,'html');assert.deepEqual(updated.filter(view=>view.id!=='capacity-0'),saved.slice(1));
      await page.evaluate(()=>{const set=chrome.storage.local.set;window.__restoreSet=()=>chrome.storage.local.set=set;chrome.storage.local.set=async values=>{if('historyoutSavedViews' in values)throw new Error('Synthetic capacity deletion failure');return set(values);};});
      await page.getByLabel('Delete saved view Project 2',{exact:true}).click();await page.getByText('This view could not be deleted. It is still saved. Please try again.',{exact:true}).waitFor();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews'))),updated);
      await page.getByRole('button',{name:'Save view',exact:true}).click();await name.fill('Project 13');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText(capacityError,{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Project 2',exact:true}).count(),1);
      await page.evaluate(()=>window.__restoreSet());await page.getByLabel('Delete saved view Project 2',{exact:true}).click();await page.getByRole('button',{name:'Project 2',exact:true}).waitFor({state:'hidden'});await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Project 13',exact:true}).waitFor();
      const recovered=await page.evaluate(()=>JSON.parse(localStorage.getItem('historyoutSavedViews')));assert.equal(recovered.length,12);assert.equal(recovered.filter(view=>view.name==='Project 13').length,1);assert.deepEqual(recovered.filter(view=>view.name!=='Project 13'),updated.filter(view=>view.id!=='capacity-1'));
      await page.reload();await ready(page);for(const view of recovered)assert.equal(await page.getByRole('button',{name:view.name,exact:true}).count(),1);
      track('Saved views: 12-view capacity / update / delete recovery','A thirteenth distinct name performs zero writes and keeps all views; case-insensitive overwrite retains ID; failed delete preserves capacity; successful delete permits new save; reload confirms all 12 records');
      await finish(state,'saved-view-capacity');return {capacity:12,rejectedExtra:1,existingRecordsPreserved:true};
    });

    await check('Two windows preserve saved views across concurrent and stale operations',async()=>{
      const state=await fixture();const {page:a,context}=state;const b=await context.newPage();await b.clock.setFixedTime(new Date(NOW));b.on('pageerror',error=>state.errors.push(error.message));await b.goto(server.origin+'/panel');await ready(b);
      const result=await exerciseMultiplePages(a,b,CONFIG);
      track('Saved views across multiple windows','Shared storage and real Web Locks: stale/concurrent distinct names, concurrent same-name overwrite, stale deletion, latest capacity rejection, update and deletion recovery, two-page reload');
      await finish(state,'saved-views-multiple-windows');return result;
    });

    await check('Keyboard sharing and disclosure controls have usable close paths',async()=>{
      const state=await fixture();const {page}=state;
      await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__shared=text;}}});});
      const share=page.getByRole('button',{name:'Tell a friend',exact:true});await share.focus();await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'Link copied.'}).waitFor();assert.equal(await page.evaluate(()=>window.__shared),STORE);
      await page.getByRole('status').filter({hasText:'Link copied.'}).getByRole('button',{name:'Close',exact:true}).click();
      await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('Synthetic denial');};});await share.focus();await page.keyboard.press('Space');const dialog=page.getByRole('dialog',{name:'Share HistoryOut'});await dialog.waitFor();
      const input=page.getByRole('textbox',{name:'HistoryOut installation link'});assert.equal(await input.inputValue(),STORE);assert.equal(await input.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),true);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
      await share.click();await dialog.waitFor();await page.getByRole('button',{name:'Done',exact:true}).click();await dialog.waitFor({state:'hidden'});
      await range(page,'Custom dates');const disclosure=page.getByRole('complementary',{name:'Looking for older history?'}).locator('summary');await disclosure.focus();await page.keyboard.press('Enter');assert.equal(await disclosure.evaluate(el=>el.parentElement.open),true);await page.keyboard.press('Space');assert.equal(await disclosure.evaluate(el=>el.parentElement.open),false);
      for(const [label,href] of [['Get help',STORE+'/support'],['Leave a review',STORE+'/reviews'],['Support HistoryOut','https://www.buymeacoffee.com/saulius.developer'],['Buy me a coffee (opens in a new tab)','https://www.buymeacoffee.com/saulius.developer']]){
        const link=page.getByRole('link',{name:label,exact:true});await link.focus();assert.equal(await link.getAttribute('href'),href);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
      }
      const supportLink=page.getByRole('link',{name:'Support HistoryOut',exact:true});
      // Finish scrolling the footer into view before this independent pointer check.
      await supportLink.evaluate(el=>el.scrollIntoView({block:'center'}));await supportLink.hover();await page.getByRole('tooltip').waitFor();assert.match(await page.getByRole('tooltip').innerText(),/optional contribution/);
      track('Tell a friend, copied status and Close','Enter shares exact install URL; close clears the notice');
      track('Clipboard fallback field, Escape and Done','Space opens fallback on denial, URL is selected/read-only, both close paths work');
      track('Availability disclosure','Enter opens and Space closes, supplementing range-specific preflight checks');
      track('Get help / Leave a review / Support HistoryOut / Buy me a coffee','Keyboard focus, exact secure target URLs and new-tab relations verified; optional support tooltip visible; no external messages or contributions sent');
      await finish(state,'keyboard-sharing');
    });

    for(const [control,evidence] of [
      ['Cancel and loading/progress/aria-busy','release-readiness.cjs: cancellation, no partial downloads, prior snapshot retained; core bounded concurrency/progress tests'],
      ['History error and retry / empty history / no-match notices','release-readiness.cjs: failure retains snapshot, retry works, no empty downloads'],
      ['Startup Retry / preference Retry saving / failed Save','preflight-ui-qa.cjs: no preference overwrite, truthful save failure, recovery and session exports'],
      ['Custom/All availability text and guide link','preflight-ui-qa.cjs: truthful retention guidance, link and >90-day retained download'],
      ['Responsive support placement / original footer / initial export visibility','bmc-cta-qa.cjs: 320/400/1200px, sticky export visible, original footer bytes'],
      ['Recap visits/pages/sites, latest snapshot notice','core.test.cjs validates visit-based counts; native release-readiness validates loaded data and downloads; this suite tests top sites and Refresh'],
    ])track(control,evidence,'Existing complementary QA, rerun by root');
  } catch(error) {console.error(error);process.exitCode=1;}
  finally {
    const report={checked:new Date().toISOString(),status:cases.every(test=>test.status==='passed')?'passed':'failed',scope:'Actual built UI with synthetic history and isolated storage. Complements native/browser/error suites; does not certify store publication or Brave runtime.',browser:{name:'Chromium',version:browser.version()},bundleSha256:crypto.createHash('sha256').update(await fs.readFile('extension-unpacked/bundle.js')).digest('hex'),output,cases,coverageMatrix:matrix,unresolvedIssues:cases.filter(test=>test.status!=='passed').map(test=>({name:test.name,error:test.error}))};
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    await fs.writeFile(path.join(output,'coverage.md'),'# Submission option coverage\n\n'+`Status: ${report.status}. Bundle: ${report.bundleSha256}.\n\n`+'| Control | Evidence | Scope |\n| --- | --- | --- |\n'+matrix.map(row=>`| ${row.control} | ${row.evidence} | ${row.scope} |`).join('\n')+'\n');
    console.log(JSON.stringify({status:report.status,output,cases:cases.length,controls:matrix.length,unresolvedIssues:report.unresolvedIssues},null,2));
    await browser.close();await server.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
