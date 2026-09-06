const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const report={checked:new Date().toISOString(),scope:'Native unpacked MV3 upgrade in an isolated profile. Baseline is rebuilt v1 source, not a signed store download.',cases:[]};
const waitFor=async(fn,message)=>{for(let attempt=0;attempt<100;attempt++){if(await fn())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error(message);};
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'historyout-native-upgrade-'));const profile=path.join(temp,'profile');const extension=path.join(temp,'extension');let context;
 try{
  await fs.mkdir(extension);const baseline=path.resolve('releases/historyout-1.0.1-source-baseline.zip');
  execFileSync('unzip',['-q',baseline,'-d',extension]);
  // The source-baseline archive stores files at its root; assert instead of guessing.
  const oldManifest=JSON.parse(await fs.readFile(path.join(extension,'manifest.json'),'utf8'));assert.match(oldManifest.version,/^1\./);
  const options={channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]};
  context=await chromium.launchPersistentContext(profile,options);let worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const extensionId=new URL(worker.url()).host;report.browserVersion=context.browser().version();
  const config={format:'json',historyRange:'week',dateRange:null,fields:{order:true,id:false,date:true,time:true,title:true,url:true,visitCount:false,typedCount:false,transition:false}};
  await worker.evaluate(async value=>{await chrome.storage.local.set({HISTORY_OUTPUT_CONFIG:value});await chrome.history.addUrl({url:'https://native-upgrade.historyout-qa.invalid/retained'});},config);
  await fs.cp(path.resolve('extension-unpacked'),extension,{recursive:true});
  // Use Chrome's native unpacked installer so it processes the version transition.
  const debugging=await context.browser().newBrowserCDPSession();
  const replacement=context.waitForEvent('serviceworker',{timeout:10000});
  const installed=await debugging.send('Extensions.loadUnpacked',{path:extension});assert.equal(installed.id,extensionId);
  worker=await replacement;
  report.manifestAfterReload=await worker.evaluate(()=>chrome.runtime.getManifest().version);
  await waitFor(async()=>await worker.evaluate(async()=>(await chrome.storage.local.get('historyoutOpenedVersion')).historyoutOpenedVersion==='2.0.0'),'upgrade version marker missing');
  await waitFor(()=>context.pages().some(page=>page.url().includes('historyout.sauliusdev.chatgpt.site/')),'lifecycle tab navigation missing');
  let tabs=context.pages().map(page=>({url:page.url()}));report.lifecycleTabs=tabs;const changes=tabs.filter(tab=>tab.url?.startsWith('https://historyout.sauliusdev.chatgpt.site/changelog/'));
  assert.equal(changes.length,1);assert.equal(tabs.filter(tab=>tab.url?.includes('/welcome/')).length,0);report.cases.push({name:'Real v1 to v2 upgrade opens one changelog and no welcome',status:'passed'});
  const saved=await worker.evaluate(async()=>(await chrome.storage.local.get('HISTORY_OUTPUT_CONFIG')).HISTORY_OUTPUT_CONFIG);assert.deepEqual(saved,config);
  const history=await worker.evaluate(()=>chrome.history.search({text:'native-upgrade.historyout-qa.invalid',startTime:0}));assert.equal(history.length,1);report.cases.push({name:'Real update preserves exact v1 preferences and original native history',status:'passed'});
  const app=await context.newPage();await app.goto(`chrome-extension://${extensionId}/side-panel.html`);await app.getByRole('button',{name:'Preview',exact:true}).click();await app.getByRole('button',{name:'Refresh',exact:true}).waitFor();assert.equal(await app.getByRole('link',{name:'native-upgrade.historyout-qa.invalid',exact:true}).count(),1);
  await context.close();context=null;
  context=await chromium.launchPersistentContext(profile,options);worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');await new Promise(resolve=>setTimeout(resolve,400));tabs=context.pages().map(page=>({url:page.url()}));assert.ok(tabs.filter(tab=>tab.url?.startsWith('https://historyout.sauliusdev.chatgpt.site/changelog/')).length<=1);report.cases.push({name:'Restart at the same version does not open a duplicate lifecycle page',status:'passed'});
  report.previousVersion=oldManifest.version;report.currentVersion='2.0.0';report.status='passed';console.log(JSON.stringify(report,null,2));
 }catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);if(context){const debug=await context.newPage();await debug.goto('chrome://extensions');report.extensionManager=await debug.locator('extensions-item').allTextContents();console.log(JSON.stringify(report.extensionManager));}}
 finally{if(context)await context.close();await fs.rm(temp,{recursive:true,force:true});await fs.writeFile('launch/qa/native-update.json',JSON.stringify(report,null,2)+'\n');}
})();
