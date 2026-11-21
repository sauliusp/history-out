// Exercise built, localized pages with a private static server and isolated browser.
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createServer}=require('node:http');
const root=path.join(__dirname,'dist');
const output=path.resolve(__dirname,'../test-results/website-localization');
const viewports=[320,390,768,1440];
(async()=>{
  const {allPages,locales,localeRoute}=await import('./content/localized.mjs');
  await fs.mkdir(output,{recursive:true});
  const server=createServer(async(req,res)=>{try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)&&file!==root)throw new Error('Invalid path');
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.mp4':'video/mp4','.vtt':'text/vtt'};
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));const reports=[];
    for(const width of viewports){
      await page.setViewportSize({width,height:1000});
      for(const item of allPages){
        const response=await page.goto(origin+item.route);await page.locator('main h1').waitFor();
        const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
        if(response.status()!==200||metrics.scroll>width+1||metrics.images.length)throw new Error(JSON.stringify({route:item.route,width,status:response.status(),...metrics}));
        reports.push({route:item.route,width,status:response.status(),overflow:metrics.scroll-width});
        if(item.baseRoute==='/'){
          await page.locator('.language-picker summary').click();const links=page.locator('.language-picker nav a');
          if(await links.count()!==7)throw new Error('Incomplete language selector');
          for(let i=0;i<7;i++)if(!(await links.nth(i).isVisible()))throw new Error(`Hidden language ${i}: ${item.route} at ${width}px`);
          await page.locator('.language-picker summary').click();
          if(width===390||width===1440)await page.screenshot({path:path.join(output,`${item.locale.code}-${width}.png`),fullPage:true});
        }
      }
    }
    // Switching languages keeps the same article rather than returning to home.
    for(const locale of locales){
      const route='/guides/export-browser-history-to-html/';await page.goto(origin+localeRoute(locale,route));
      for(const target of locales){
        await page.locator('.language-picker summary').click();await page.locator(`.language-picker a[hreflang="${target.code}"]`).click();
        await page.waitForURL(origin+localeRoute(target,route));
        if(await page.locator('html').getAttribute('lang')!==target.code)throw new Error('Incorrect language after switch');
      }
    }
    if(errors.length)throw new Error(errors.join('\n'));
    const result={pages:allPages.length,viewports,checks:reports.length,languageSwitches:49,errors,reports};
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(result,null,2)+'\n');
    console.log(`Verified ${result.pages} pages, ${result.checks} responsive checks and ${result.languageSwitches} language switches.`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
