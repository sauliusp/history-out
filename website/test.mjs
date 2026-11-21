import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const siteConfig=JSON.parse(await readFile(new URL('./site.config.json',import.meta.url),'utf8'));
import { allPages as pages, locales, localeRoute, englishUI } from './content/localized.mjs';
import { execFileSync } from 'node:child_process';

test('Every public page is prerendered with unique metadata and resolves its local links',async()=>{
  const titles=new Set();
  for(const page of pages){
    const html=await readFile(path.join('dist',page.route,'index.html'),'utf8');
    assert(html.includes('<h1>'));assert(html.includes('name="description"'));assert(html.includes('rel="canonical"'));
    assert(!html.includes(String.fromCharCode(8212)),`Em dash in ${page.route}`);
    assert(!titles.has(page.title));titles.add(page.title);
    assert(!html.includes('{{'),`Unresolved template in ${page.route}`);
    assert(html.includes('mailto:sauliusthedev@gmail.com'));
    assert(!html.includes('saulius.developer@gmail.com'));
    assert(html.includes('https://historyout.featurebase.app/'));
    assert(html.includes('name="google-site-verification"'));
    assert(!html.includes('store currently offers version 1.0.1'));
    for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
      const link=match[1];const local=path.join('dist',link);let info;
      try{info=await stat(local);}catch{assert.fail(`Broken local link ${link} on ${page.route}`);}
      if(info.isDirectory())await stat(path.join(local,'index.html'));
    }
    for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))assert(JSON.parse(match[1]));
    assert(!/src="https?:/.test(html),'No third-party scripts or image requests');
  }
});
test('Public pages are indexable and sitemap contains discovery routes',async()=>{
  const robots=await readFile('dist/robots.txt','utf8');assert(robots.includes('Allow: /'));assert(robots.includes('User-agent: OAI-SearchBot'));assert(!robots.includes('Disallow: /'));
  const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,pages.filter(p=>p.indexable!==false).length);
  for(const page of pages)assert((await readFile(path.join('dist',page.route,'index.html'),'utf8')).includes(page.indexable===false?'noindex,follow':'index,follow,max-image-preview:large'));
});

test('Brand, support, onboarding and comparison navigation are present',async()=>{
  for(const route of ['/','/welcome/','/changelog/']){
    const html=await readFile(path.join('dist',route,'index.html'),'utf8');
    assert(!html.includes('HistoryOut 2'));
    assert(html.includes('/assets/logo.svg'));
    assert(html.includes('/favicon.ico'));
    assert(html.includes('Support HistoryOut'));
    assert(html.includes('buymeacoffee.com/saulius.developer'));
    for(const route of ['/alternatives/export-chrome-history/','/alternatives/history-trends-unlimited/','/alternatives/better-history/'])assert(html.slice(html.indexOf('<footer')).includes(route));
  }
  const home=await readFile('dist/index.html','utf8');
  const schema=JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert(schema['@graph'].some(x=>x['@type']==='SoftwareApplication'));
  assert(schema['@graph'].some(x=>x['@type']==='FAQPage'));
  assert(home.includes('og:image'));
  await stat('dist/assets/social-card.png');
});

test('noindex previews advertise no sitemap routes and rebuilding restores public discovery', async () => {
  try {
    execFileSync(process.execPath, ['build.mjs'], {env:{...process.env,SITE_NOINDEX:'true'}, stdio:'pipe'});
    const sitemap = await readFile('dist/sitemap.xml','utf8');
    assert(!sitemap.includes('<loc>'));
    assert(!(await readFile('dist/robots.txt','utf8')).includes('Sitemap:'));
    for (const page of pages) {
      assert((await readFile(path.join('dist',page.route,'index.html'),'utf8')).includes('noindex,follow'));
    }
  } finally {
    execFileSync(process.execPath, ['build.mjs'], {env:{...process.env,SITE_NOINDEX:'false'}, stdio:'pipe'});
  }
  assert((await readFile('dist/sitemap.xml','utf8')).includes('<loc>https://exportchromehistory.app/</loc>'));
});


test('Every locale has all thirteen routes, complete UI copy and reciprocal language links',async()=>{
  assert.equal(pages.length,91);
  for(const locale of locales){
    const localized=pages.filter(p=>p.locale.code===locale.code);
    assert.equal(localized.length,13);
    if(locale.catalog){
      assert.deepEqual(Object.keys(locale.catalog.ui).sort(),Object.keys(englishUI).sort());
      for(const value of Object.values(locale.catalog.ui))assert.equal(typeof value,'string');
      for(const key of ['welcome','update'])for(const field of ['title','eyebrow','heading','lead','body'])assert(locale.catalog.lifecycle[key][field]?.trim());
      assert(locale.catalog.lifecycle.update.eyebrow.includes('2.2.0'));
    }
    for(const page of localized){
      const html=await readFile(path.join('dist',page.route,'index.html'),'utf8');
      assert(html.includes(`<html lang="${locale.code}">`));
      assert(html.includes(`<link rel="canonical" href="https://exportchromehistory.app${page.route}">`));
      for(const other of locales)assert(html.includes(`<link rel="alternate" hreflang="${other.code}" href="https://exportchromehistory.app${localeRoute(other,page.baseRoute)}">`));
      assert(html.includes(`<link rel="alternate" hreflang="x-default" href="https://exportchromehistory.app${page.baseRoute}">`));
      const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
      assert.equal(graph.find(n=>n['@type']==='WebPage').inLanguage,locale.code);
      for(const item of graph.filter(n=>['WebSite','Article'].includes(n['@type'])))assert.equal(item.inLanguage,locale.code);
      if(locale.code!=='en'){
        assert(!html.includes('href="/assets/sample-history.html"'));
        assert(!html.includes('Skip to content'));
        assert(!html.includes('Suggest a feature'));
      }
      if(page.baseRoute==='/'){
        assert.equal(html.includes('class="rollout-note"'),siteConfig.storeVersion!==siteConfig.latestVersion);
        assert(html.includes('<meta name="google-site-verification" content="J9EsmoQ_afZAfv1vTpVgo5bu_xHrSMfvtdjN_fUqgrs">'));
        assert(html.includes('<meta name="google-site-verification" content="hlwn87xUR2-EHONW0JGTG1KxwTAwF8AeoiSNcH6tqhg">'));
        const app=graph.find(n=>n['@type']==='SoftwareApplication');
        assert.equal(app.softwareVersion,siteConfig.storeVersion);
        assert.deepEqual(app.inLanguage,siteConfig.storeVersion===siteConfig.latestVersion?locales.map(l=>l.code):['en']);
        const video=graph.find(n=>n['@type']==='VideoObject');
        assert.equal(video.inLanguage,'en');
        assert.equal(video.sameAs,'https://www.youtube.com/watch?v=cGybkRSkk2Y');
      }
      if(page.baseRoute==='/changelog/')assert(html.includes('2.2.0'));
      for(const link of [...html.matchAll(/href="(\/[^"?#]*)(?:[?#][^"]*)?"/g)].map(m=>m[1])){
        if(locale.code!=='en'&&!link.startsWith('/assets/')&&!link.includes('.')&&!locales.some(l=>link===localeRoute(l,page.baseRoute)))assert(link.startsWith(`/${locale.path}/`),`Unexpected language escape ${link} from ${page.route}`);
      }
    }
  }
});
