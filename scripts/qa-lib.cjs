const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');

// Fictional research trail for QA and marketing only. Never copied into a package.
function installFixture(){
  const specs=[
    ['developer.mozilla.org','Responsive images: a practical guide','/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images'],
    ['developer.mozilla.org','CSS grid layout: research notes','/en-US/docs/Web/CSS/CSS_grid_layout'],
    ['developer.mozilla.org','Web accessibility: getting started','/en-US/docs/Learn/Accessibility'],
    ['developer.mozilla.org','Container queries for responsive layouts','/en-US/docs/Web/CSS/CSS_containment/Container_queries'],
    ['web.dev','A faster web: image performance','/learn/images/performance'],
    ['web.dev','Core Web Vitals: project checklist','/articles/vitals'],
    ['web.dev','Designing a more accessible web','/learn/accessibility'],
    ['web.dev','Responsive design foundations','/learn/design'],
    ['github.com','Research project: launch checklist','/example/research-project/issues/12'],
    ['github.com','Design system: component decisions','/example/design-system/discussions/8'],
    ['figma.com','Research project: homepage review','/design/demo/homepage-review'],
    ['notion.so','Website research: source notes','/demo/website-research'],
    ['w3.org','Web Content Accessibility Guidelines','/WAI/standards-guidelines/wcag'],
    ['smashingmagazine.com','Building better responsive interfaces','/2026/08/responsive-interfaces/'],
  ];
  const now=Date.now();const midnight=new Date(now);midnight.setHours(0,0,0,0);
  const available=Math.max(60000,now-midnight.getTime()-60000);
  const rows=[];const visits={};let visitId=0;
  specs.forEach(([domain,title,pathname],index)=>{
    const url=`https://${domain}${pathname}${index%3===0?'?utm_source=research#overview':''}`;
    const times=Array.from({length:Math.max(1,6-index%6)},(_,n)=>midnight.getTime()+available*(0.96-(index*6+n)*0.011));
    times.push(now-86400000-index*60000);
    visits[url]=times.map((visitTime,n)=>({id:String(index+1),visitId:String(++visitId),visitTime,referringVisitId:'0',transition:n?'link':'typed'}));
    rows.push({id:String(index+1),url,title,lastVisitTime:Math.max(...times),visitCount:times.length+3,typedCount:1});
  });
  window.__fixture={reads:0,delay:0,fail:false,empty:false,rows,visits};
  const wait=()=>window.__fixture.delay>0?new Promise(r=>setTimeout(r,window.__fixture.delay)):Promise.resolve();
  window.chrome={
    history:{search:async q=>{window.__fixture.reads++;await wait();if(window.__fixture.fail)throw new Error('History is temporarily unavailable. Try again.');if(window.__fixture.empty)return [];return rows.filter(r=>r.lastVisitTime>=q.startTime&&r.lastVisitTime<=q.endTime).sort((a,b)=>b.lastVisitTime-a.lastVisitTime).slice(0,q.maxResults);},getVisits:async({url})=>{await wait();return visits[url]||[];}},
    storage:{local:{get:async key=>({[key]:JSON.parse(localStorage.getItem(key)||'null')}),set:async values=>Object.entries(values).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)))}},
    runtime:{getURL:p=>`/${p}`,getManifest:()=>({version:'2.0.0'})},
  };
}

async function startServer(){
  const server=createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/panel'){
      res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HistoryOut demo</title><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');return;
    }
    const root=path.resolve(url.pathname.startsWith('/launch/')?'.':'extension-unpacked');
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    try{const body=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.csv':'text/csv','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};
}
async function openFixture(browser,origin,options={}){
  const context=await browser.newContext({viewport:{width:400,height:900},locale:'en-GB',timezoneId:'Europe/Vilnius',acceptDownloads:true,...options});
  await context.addInitScript(installFixture);
  const page=await context.newPage();
  await page.clock.setFixedTime(new Date('2026-09-05T14:00:00Z'));
  await page.goto(origin+'/panel');
  await page.getByRole('button',{name:'Preview',exact:true}).waitFor();
  return {page,context};
}
module.exports={chromium,startServer,openFixture,installFixture};
