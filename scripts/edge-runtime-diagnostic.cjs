// Browser-only control: no extension code, user profile, history or account.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const report = { checked: new Date().toISOString(), scope: 'Isolated plain HTML button and requestAnimationFrame controls. No HistoryOut code loaded.', cases: [] };
(async () => {
  for (const variant of [
    {name:'chromium-control'},
    {name:'edge-default',executablePath:edge},
    {name:'edge-no-gpu',executablePath:edge,args:['--disable-gpu']},
    {name:'edge-unthrottled',executablePath:edge,args:['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-frame-rate-limit','--disable-gpu-vsync']},
  ]) {
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'historyout-browser-control-'));
    const record = {name:variant.name,headless:true,extraArguments:variant.args||[]}; report.cases.push(record);
    let context;
    try {
      context = await chromium.launchPersistentContext(profile, {headless:true, viewport:{width:500,height:1000}, ...(variant.executablePath ? {executablePath:variant.executablePath} : {channel:'chromium'}), args:variant.args||[]});
      record.version = context.browser().version();
      const session = await context.browser().newBrowserCDPSession();
      try { record.backgroundArguments = (await session.send('Browser.getBrowserCommandLine')).arguments.filter(arg=>/background|throttl|frame-rate|vsync|disable-gpu/.test(arg)); } catch { record.commandLineInspection = 'Browser requires --enable-automation for this diagnostic; launch mode left unchanged.'; }
      const page = await context.newPage();
      await page.goto('data:text/html,' + encodeURIComponent('<button onclick="this.textContent=\'Clicked\'">Test</button>'));
      await page.bringToFront();
      record.document = await page.evaluate(()=>({visibility:document.visibilityState,focus:document.hasFocus(),readyState:document.readyState}));
      record.bounds = await page.locator('button').boundingBox();
      record.animationFrame = await Promise.race([page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve('fired')))),new Promise(resolve=>setTimeout(()=>resolve('no frame within 1500ms'),1500))]);
      try { await page.getByRole('button',{name:'Test',exact:true}).click({timeout:2500}); record.click = await page.locator('button').innerText(); }
      catch(error) { record.click='blocked by normal actionability check'; record.error=error.message; }
    } catch(error) { record.error=error.stack; }
    finally { if(context)await context.close(); await fs.rm(profile,{recursive:true,force:true}); }
    console.log(JSON.stringify(record));
  }
  report.conclusion = report.cases.filter(c=>c.name.startsWith('edge')).every(c=>c.animationFrame!=='fired') && report.cases[0].click==='Clicked' ? 'Edge native interaction is unverified on this host: plain pages also stop animation frames and normal Playwright clicks; disabling GPU and background/frame throttling did not recover it. Chromium control passed.' : 'See individual controls; one or more variants differ.';
  await fs.mkdir('launch/qa/localization-2.2.0',{recursive:true});
  await fs.writeFile('launch/qa/localization-2.2.0/edge-runtime-diagnostic.json',JSON.stringify(report,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
