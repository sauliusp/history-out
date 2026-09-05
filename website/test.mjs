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
test('Preview is not indexable and sitemap contains all real routes',async()=>{
  const robots=await readFile('dist/robots.txt','utf8');assert(robots.includes('Disallow: /'));
  const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,pages.length);
  for(const page of pages)assert((await readFile(path.join('dist',page.route,'index.html'),'utf8')).includes('noindex,nofollow'));
});
