const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');

const CAPACITY_ERROR='You already have 12 saved views. Delete an existing view or reuse its name to update it.';
const waitReady=page=>page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Preview'&&!button.disabled));
async function enterView(page,name){
  const input=page.getByRole('textbox',{name:'View name'});
  if(!await input.isVisible())await page.getByRole('button',{name:'Save view',exact:true}).click();
  await input.fill(name);await page.getByRole('button',{name:'Save',exact:true}).click();
}
async function save(page,name){await enterView(page,name);await page.getByText(`Saved “${name}”. Return to these settings with one click.`,{exact:true}).waitFor();}
const read=page=>page.evaluate(async()=>(await chrome.storage.local.get('historyoutSavedViews')).historyoutSavedViews||[]);
const names=views=>views.map(view=>view.name.toLowerCase()).sort();
const pageOrigin=page=>{const url=new URL(page.url());return url.protocol+'//'+url.host;};
async function exerciseMultiplePages(a,b,config){
  assert.equal(pageOrigin(a),pageOrigin(b));
  for(const page of [a,b])assert.deepEqual(await page.evaluate(()=>({secure:isSecureContext,locks:typeof navigator.locks?.request})),{secure:true,locks:'function'});
  await save(a,'Window A');await save(b,'Window B');
  assert.deepEqual(names(await read(a)),['window a','window b']);
  await a.evaluate(()=>{window.__holdAcquired=false;void navigator.locks.request('historyout:storage:historyoutSavedViews',async()=>{window.__holdAcquired=true;await new Promise(resolve=>window.__releaseLock=resolve);});});
  await a.waitForFunction(()=>window.__holdAcquired);
  await Promise.all([enterView(a,'Concurrent A'),enterView(b,'Concurrent B')]);
  await a.waitForFunction(async()=>{const locks=await navigator.locks.query();return locks.pending.filter(lock=>lock.name==='historyout:storage:historyoutSavedViews').length===2;});
  const queuedLocks=await a.evaluate(async()=>{const locks=await navigator.locks.query();return {held:locks.held.filter(lock=>lock.name==='historyout:storage:historyoutSavedViews'),pending:locks.pending.filter(lock=>lock.name==='historyout:storage:historyoutSavedViews')};});
  assert.equal(queuedLocks.held.length,1);assert.ok([...queuedLocks.held,...queuedLocks.pending].every(lock=>lock.mode==='exclusive'));assert.deepEqual(names(await read(a)),['window a','window b']);
  await a.evaluate(()=>window.__releaseLock());
  await Promise.all([a.getByText('Saved “Concurrent A”. Return to these settings with one click.',{exact:true}).waitFor(),b.getByText('Saved “Concurrent B”. Return to these settings with one click.',{exact:true}).waitFor()]);
  let views=await read(a);assert.deepEqual(names(views),['concurrent a','concurrent b','window a','window b']);assert.equal(new Set(views.map(view=>view.id)).size,4);
  await Promise.all([save(a,'Shared project'),save(b,'SHARED PROJECT')]);
  views=await read(a);assert.equal(views.length,5);assert.equal(views.filter(view=>view.name.toLowerCase()==='shared project').length,1);assert.equal(new Set(views.map(view=>view.id)).size,5);
  await a.reload();await waitReady(a);await save(b,'Added later');
  await a.getByLabel('Delete saved view Window A',{exact:true}).click();await a.getByRole('button',{name:'Window A',exact:true}).waitFor({state:'hidden'});
  views=await read(a);assert.deepEqual(names(views),['added later','concurrent a','concurrent b','shared project','window b']);
  const initial=Array.from({length:11},(_,i)=>({id:'limit-'+i,name:'Retained '+(i+1),config,query:'',domain:'',uniqueUrls:false,stripQuery:false}));
  await a.evaluate(views=>chrome.storage.local.set({historyoutSavedViews:views}),initial);
  await Promise.all([a.reload(),b.reload()]);await Promise.all([waitReady(a),waitReady(b)]);
  await save(a,'Last slot');const beforeRejected=await read(a);assert.equal(beforeRejected.length,12);
  await enterView(b,'Overflow');await b.getByText(CAPACITY_ERROR,{exact:true}).waitFor();assert.deepEqual(await read(a),beforeRejected);
  await b.getByRole('button',{name:'HTML, readable in a browser',exact:true}).click();await save(b,'LAST SLOT');
  const overwritten=await read(a);assert.equal(overwritten.length,12);assert.equal(overwritten.find(view=>view.name==='LAST SLOT').id,beforeRejected.find(view=>view.name==='Last slot').id);assert.equal(overwritten.find(view=>view.name==='LAST SLOT').config.format,'html');
  await a.getByLabel('Delete saved view Retained 1',{exact:true}).click();await a.getByRole('button',{name:'Retained 1',exact:true}).waitFor({state:'hidden'});
  assert.deepEqual(await read(a),overwritten.filter(view=>view.id!=='limit-0'));
  await save(b,'Overflow');const final=await read(a);assert.equal(final.length,12);assert.equal(final.filter(view=>view.name==='Overflow').length,1);assert.deepEqual(final.filter(view=>view.name!=='Overflow'),overwritten.filter(view=>view.id!=='limit-0'));
  await Promise.all([a.reload(),b.reload()]);await Promise.all([waitReady(a),waitReady(b)]);
  for(const page of [a,b])for(const view of final)assert.equal(await page.getByRole('button',{name:view.name,exact:true}).count(),1);
  return {pages:2,sharedOrigin:pageOrigin(a),secureContext:true,webLocksAvailable:true,queuedLocks,checks:['Stale sequential additions preserve both names','Two actual writes wait behind the same exclusive Web Lock, then preserve all distinct names and unique IDs','Concurrent case-insensitive same-name saves retain one record','Stale deletion preserves later additions','Capacity uses latest storage and rejects overflow without mutation','Stale overwrite keeps ID and updates existing record at capacity','Stale deletion preserves another window updated record','Freed capacity permits a new record; both pages reload all 12']};
}

async function main(){
  const base='/tmp/historyout-submission-2026-09-07';await fs.mkdir(base,{recursive:true});const output=await fs.mkdtemp(path.join(base,'native-multi-window-'));
  const extension=path.resolve('extension-unpacked');const profile=path.join(output,'profile');let context;
  const report={checked:new Date().toISOString(),scope:'Two real unpacked extension pages in an isolated browser profile, actual chrome.storage.local and navigator.locks. No user profile or external publication changes.',browserName:process.env.QA_BROWSER==='edge'?'Microsoft Edge':'Chrome for Testing',bundleSha256:crypto.createHash('sha256').update(await fs.readFile(path.join(extension,'bundle.js'))).digest('hex'),output};
  try{
    const launch={headless:true,viewport:{width:400,height:900},args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]};
    if(process.env.QA_BROWSER==='edge')launch.executablePath='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';else launch.channel='chromium';
    context=await chromium.launchPersistentContext(profile,launch);
    const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const extensionId=new URL(worker.url()).host;report.browserVersion=context.browser().version();report.extensionId=extensionId;
    const config={format:'json',historyRange:'today',dateRange:null,fields:Object.fromEntries(['order','id','date','time','title','url','visitCount','typedCount','transition','timestamp','domain'].map(key=>[key,['title','url'].includes(key)]))};
    await worker.evaluate(config=>chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:config,historyoutSavedViews:[]}),config);
    const errors=[];const a=await context.newPage(),b=await context.newPage();for(const page of [a,b])page.on('pageerror',error=>errors.push(error.message));
    await Promise.all([a.goto(`chrome-extension://${extensionId}/side-panel.html`),b.goto(`chrome-extension://${extensionId}/side-panel.html`)]);await Promise.all([waitReady(a),waitReady(b)]);
    report.result=await exerciseMultiplePages(a,b,config);assert.deepEqual(errors,[]);report.pageErrors=errors;
    await a.screenshot({path:path.join(output,'window-a.png'),fullPage:true});await b.screenshot({path:path.join(output,'window-b.png'),fullPage:true});report.status='passed';
  }catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}
  finally{if(context)await context.close();await fs.rm(profile,{recursive:true,force:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
}
module.exports={exerciseMultiplePages};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
