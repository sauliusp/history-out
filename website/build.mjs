import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { allPages, locales, englishUI, localeRoute, localizeLinks } from './content/localized.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'dist');
const config=JSON.parse(await readFile(path.join(root,'site.config.json'),'utf8'));
const origin=(process.env.SITE_ORIGIN||config.origin).replace(/\/$/,'');
if(!/^https:\/\/[^/]+$/.test(origin))throw new Error('SITE_ORIGIN must be an HTTPS origin without a path.');
const indexable=process.env.SITE_NOINDEX!=='true'&&config.indexable;
const released=process.env.RELEASE_V2==='true'||config.storeVersion===config.latestVersion;
const store='https://chromewebstore.google.com/detail/historyout-export-chrome/idohnkdgejocejlkihihonhemndpiiei';
const product=JSON.parse(await readFile(path.join(root,'content/product.json'),'utf8'));
const support='https://www.buymeacoffee.com/saulius.developer';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=value=>value.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
const brand='<img src="/assets/logo.svg" width="144" height="58" alt="HistoryOut">';
const uiFor=locale=>locale.catalog?.ui||englishUI;
const alternatives=route=>locales.map(l=>`<link rel="alternate" hreflang="${l.code}" href="${origin}${localeRoute(l,route)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${origin}${route}">`;
function languageSelector(page,u){return `<details class="language-picker"><summary aria-label="${escape(u.languages)}">${page.locale.name} <span aria-hidden="true">⌄</span></summary><nav aria-label="${escape(u.languages)}">${locales.map(l=>`<a href="${localeRoute(l,page.baseRoute)}" lang="${l.code}" hreflang="${l.code}"${l.code===page.locale.code?' aria-current="page"':''}>${l.name}</a>`).join('')}</nav></details>`;}
function footer(u,locale){return localizeLinks(`<footer class="site-footer"><div class="footer-intro"><a class="brand" href="/">${brand}</a><p>${u.footerLead}</p><a class="support-link" href="${support}" target="_blank" rel="noopener noreferrer">${u.support} ↗</a><p>${u.supportNote}</p></div><nav aria-label="${u.comparison}"><h2>${u.compare}</h2><a href="/alternatives/">${u.fit}</a><a href="/alternatives/export-chrome-history/">Export Chrome History: ${u.alternative}</a><a href="/alternatives/history-trends-unlimited/">History Trends Unlimited: ${u.alternative}</a><a href="/alternatives/better-history/">Better History: ${u.alternative}</a></nav><nav aria-label="${u.guides}"><h2>${u.useful}</h2><a href="/guides/export-browser-history-to-html/">${u.html}</a><a href="/guides/export-chrome-history-to-excel/">${u.excel}</a><a href="/guides/filter-browser-history/">${u.research}</a><a href="/guides/browser-history-limits/">${u.limits}</a><a href="/browsers/">${u.browsers}</a></nav><nav aria-label="HistoryOut"><h2>HistoryOut</h2><a href="/welcome/">${u.welcome}</a><a href="/changelog/">${u.changes}</a><a href="/privacy/">${u.privacy}</a><a href="${product.feedback}" target="_blank" rel="noopener noreferrer">${u.feedback} ↗</a><a href="https://github.com/sauliusp/history-out">${u.source} ↗</a><a href="mailto:${product.contactEmail}">${u.contact}</a></nav><p class="footer-bottom">${u.footer}</p></footer>`,locale);}
function structuredData(page,content){
  const url=`${origin}${page.route}`,locale=page.locale,u=uiFor(locale),base=`${origin}${localeRoute(locale)}`;
  const author={'@type':'Person',name:'Saulius',url:'https://github.com/sauliusp'};
  const graph=[{'@type':'WebSite','@id':`${base}#website`,name:'HistoryOut',url:base,inLanguage:locale.code,publisher:author},{'@type':'WebPage','@id':`${url}#page`,name:page.title,description:page.description,url,isPartOf:{'@id':`${base}#website`},dateModified:config.updated,inLanguage:locale.code}];
  if(page.baseRoute==='/')graph.push({'@type':'SoftwareApplication','@id':`${base}#software`,name:'HistoryOut',operatingSystem:'Windows, macOS, Linux',applicationCategory:'UtilitiesApplication',softwareRequirements:'Chromium',description:page.description,url,downloadUrl:store,softwareVersion:released?config.latestVersion:config.storeVersion,inLanguage:released?locales.map(l=>l.code):['en'],offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},author,image:`${origin}/assets/icon128.png`,sameAs:[store,'https://github.com/sauliusp/history-out']});
  if(page.baseRoute!=='/'){
    const crumbs=[{'@type':'ListItem',position:1,name:'HistoryOut',item:base}];
    if(page.baseRoute.startsWith('/alternatives/')&&page.baseRoute!=='/alternatives/')crumbs.push({'@type':'ListItem',position:2,name:u.comparison,item:`${base}alternatives/`});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:plain(content.match(/<h1>(.*?)<\/h1>/s)?.[1]||page.title),item:url});graph.push({'@type':'BreadcrumbList',itemListElement:crumbs});
  }
  if(/^\/(guides|alternatives)\/.+/.test(page.baseRoute))graph.push({'@type':'Article',headline:page.title,description:page.description,author,publisher:author,datePublished:config.updated,dateModified:config.updated,mainEntityOfPage:{'@id':`${url}#page`},inLanguage:locale.code});
  const questions=[...content.matchAll(/<details[^>]*>\s*<summary>(.*?)<\/summary>(.*?)<\/details>/gs)].map(m=>({'@type':'Question',name:plain(m[1]),acceptedAnswer:{'@type':'Answer',text:plain(m[2])}}));
  if(questions.length)graph.push({'@type':'FAQPage',mainEntity:questions});
  if(config.video&&content.includes('<video'))graph.push({'@type':'VideoObject',name:config.video.title,description:config.video.description,inLanguage:'en',thumbnailUrl:`${origin}${config.video.poster}`,uploadDate:config.video.uploadDate,duration:config.video.duration,contentUrl:`${origin}${config.video.file}`,...(config.video.youtubeUrl?{sameAs:config.video.youtubeUrl}:{}),transcript:config.video.transcript});
  return {'@context':'https://schema.org','@graph':graph};
}
export async function build(){
  await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(path.join(root,'public'),out,{recursive:true});
  for(const page of allPages){
    const locale=page.locale,u=uiFor(locale),canonical=`${origin}${page.route}`;
    const cta=`<a class="button" href="${store}?hl=${locale.code}&amp;utm_source=historyout_website&amp;utm_medium=referral&amp;utm_campaign=historyout&amp;utm_content=${locale.code}">${u.cta} <span aria-hidden="true">↗</span></a>`;
    const rollout=u.rollout.replace('{latest}',escape(config.latestVersion)).replace('{store}',escape(config.storeVersion));
    const sourceBody=page.baseRoute==='/'?page.body.replace('{{CTA}}','{{CTA}}{{ROLLOUT}}'):page.body;
    const content=sourceBody.replaceAll('{{CTA}}',cta).replaceAll('{{STORE}}',`${store}?hl=${locale.code}`).replaceAll('{{SUPPORT}}',support).replaceAll('{{FEEDBACK}}',product.feedback).replaceAll('{{CONTACT}}',product.contactEmail).replaceAll('{{ROLLOUT}}',released?'':`<p class="rollout-note">${rollout}</p>`);
    const robots=indexable&&page.indexable!==false?'index,follow,max-image-preview:large,max-video-preview:-1':'noindex,follow';
    const social=locale.code==='en'?'/assets/social-card.png':`/assets/localized/${locale.code}/social-card.png`;
    const nav=localizeLinks(`<a class="brand" href="/" aria-label="${u.home}">${brand}</a><nav class="main-navigation" aria-label="${u.mainNav}"><a href="/#how-it-works">${u.how}</a><a href="/guides/export-browser-history-to-html/">${u.guides}</a><a href="/alternatives/">${u.compare}</a><a href="${product.feedback}" target="_blank" rel="noopener noreferrer">${u.feedback} ↗</a><a class="nav-cta" href="${store}?hl=${locale.code}">${u.get} ↗</a></nav>`,locale);
    const html=`<!doctype html><html lang="${locale.code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}">${alternatives(page.baseRoute)}<meta property="og:type" content="website"><meta property="og:site_name" content="HistoryOut"><meta property="og:locale" content="${locale.og}">${locales.filter(l=>l!==locale).map(l=>`<meta property="og:locale:alternate" content="${l.og}">`).join('')}<meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}${social}"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="720"><meta property="og:image:alt" content="${escape(u.imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2479e0"><meta name="google-site-verification" content="J9EsmoQ_afZAfv1vTpVgo5bu_xHrSMfvtdjN_fUqgrs"><meta name="google-site-verification" content="hlwn87xUR2-EHONW0JGTG1KxwTAwF8AeoiSNcH6tqhg"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${JSON.stringify(structuredData(page,content)).replaceAll('<','\\u003c')}</script><script src="/site.js" defer></script></head><body><a class="skip" href="#main">${u.skip}</a><header class="site-header">${nav}${languageSelector(page,u)}</header><main id="main">${content}</main>${footer(u,locale)}</body></html>`;
    const target=path.join(out,page.route);await mkdir(target,{recursive:true});await writeFile(path.join(target,'index.html'),html);
  }
  await writeFile(path.join(out,'robots.txt'),indexable?`User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
  const sitemap=allPages.filter(p=>indexable&&p.indexable!==false).map(p=>`<url><loc>${origin}${p.route}</loc><lastmod>${config.updated}</lastmod>${locales.map(l=>`<xhtml:link rel="alternate" hreflang="${l.code}" href="${origin}${localeRoute(l,p.baseRoute)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${p.baseRoute}"/></url>`).join('');
  await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemap}</urlset>`);
  for(const locale of locales){const u=uiFor(locale),target=path.join(out,locale.path);await mkdir(target,{recursive:true});await writeFile(path.join(target,'404.html'),`<!doctype html><html lang="${locale.code}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${u.notFoundTitle} | HistoryOut</title><link rel="stylesheet" href="/style.css"></head><body><main class="article"><h1>${u.notFound}</h1><p><a href="${localeRoute(locale)}">${u.returnHome}</a></p></main></body></html>`);}
  console.log(`Built ${allPages.length} pages in ${locales.length} languages. Search indexing: ${indexable}. Store release: ${released?config.latestVersion:config.storeVersion}.`);
}
await build();
