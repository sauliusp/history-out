import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pages } from './content/pages.mjs';

test('Every public page is prerendered with unique metadata and resolves its local links',async()=>{
  const titles=new Set();
  for(const page of pages){
    const html=await readFile(path.join('dist',page.route,'index.html'),'utf8');
    assert(html.includes('<h1>'));assert(html.includes('name="description"'));assert(html.includes('rel="canonical"'));
    assert(!html.includes(String.fromCharCode(8212)),`Em dash in ${page.route}`);
    assert(!titles.has(page.title));titles.add(page.title);
    assert(!html.includes('{{'),`Unresolved template in ${page.route}`);
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
