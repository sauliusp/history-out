import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages } from './content/pages.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const origin = (process.env.SITE_ORIGIN || config.origin).replace(/\/$/, '');
if (!/^https:\/\/[^/]+$/.test(origin)) throw new Error('SITE_ORIGIN must be an HTTPS origin without a path.');
const indexable = process.env.SITE_NOINDEX !== 'true' && config.indexable;
const released = process.env.RELEASE_V2 === 'true' || config.storeVersion === config.latestVersion;
const store = 'https://chromewebstore.google.com/detail/historyout-export-chrome/idohnkdgejocejlkihihonhemndpiiei';
const support = 'https://www.buymeacoffee.com/saulius.developer';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = value => value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const cta = `<a class="button" href="${store}?utm_source=historyout_website&utm_medium=referral&utm_campaign=historyout">Get HistoryOut free <span aria-hidden="true">↗</span></a>`;
const brand = '<img src="/assets/logo.svg" width="144" height="58" alt="HistoryOut">';
const footer = `<footer class="site-footer"><div class="footer-intro"><a class="brand" href="/">${brand}</a><p>A useful little tool.<br>Your history, in your hands.</p><a class="support-link" href="${support}" target="_blank" rel="noopener noreferrer">Support HistoryOut ↗</a><p>Optional support for a free project.<br>Contribute through Buy Me a Coffee.</p></div><nav aria-label="Compare history tools"><h2>Compare</h2><a href="/alternatives/">Find your fit</a><a href="/alternatives/export-chrome-history/">Export Chrome History alternative</a><a href="/alternatives/history-trends-unlimited/">History Trends Unlimited alternative</a><a href="/alternatives/better-history/">Better History alternative</a></nav><nav aria-label="History export guides"><h2>Make it useful</h2><a href="/guides/export-browser-history-to-html/">Export history to HTML</a><a href="/guides/export-chrome-history-to-excel/">Export history to Excel</a><a href="/guides/filter-browser-history/">Find yesterday’s research</a><a href="/guides/browser-history-limits/">Understand history limits</a><a href="/browsers/">Chrome, Edge and Brave</a></nav><nav aria-label="About HistoryOut"><h2>HistoryOut</h2><a href="/welcome/">Getting started</a><a href="/changelog/">What’s new</a><a href="/privacy/">Privacy and permissions</a><a href="https://github.com/sauliusp/history-out">Source code ↗</a><a href="mailto:saulius.developer@gmail.com">Contact Saulius</a></nav><p class="footer-bottom">Made by Saulius Petreikis. Free to use. No account. No history uploaded by the extension.</p></footer>`;

function structuredData(page, content) {
  const url = `${origin}${page.route}`;
  const author = {'@type':'Person', name:'Saulius Petreikis', url:'https://github.com/sauliusp'};
  const graph = [
    {'@type':'WebSite','@id':`${origin}/#website`, name:'HistoryOut', url:`${origin}/`, inLanguage:'en', publisher:author},
    {'@type':'WebPage','@id':`${url}#page`,name:page.title,description:page.description,url,isPartOf:{'@id':`${origin}/#website`},dateModified:config.updated,inLanguage:'en'},
  ];
  if (page.route === '/') graph.push({
    '@type':'SoftwareApplication','@id':`${origin}/#software`,name:'HistoryOut',
    operatingSystem:'Windows, macOS, Linux', applicationCategory:'UtilitiesApplication',
    softwareRequirements:'A compatible desktop Chromium browser', description:page.description,
    url,downloadUrl:store,softwareVersion:released?config.latestVersion:config.storeVersion,
    offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},author,image:`${origin}/assets/icon128.png`,
    sameAs:[store,'https://github.com/sauliusp/history-out'],
  });
  if (page.route !== '/') {
    const crumbs = [{'@type':'ListItem',position:1,name:'HistoryOut',item:`${origin}/`}];
    if (page.route.startsWith('/alternatives/') && page.route !== '/alternatives/') crumbs.push({'@type':'ListItem',position:2,name:'Compare history tools',item:`${origin}/alternatives/`});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:plain(content.match(/<h1>(.*?)<\/h1>/s)?.[1]||page.title),item:url});
    graph.push({'@type':'BreadcrumbList',itemListElement:crumbs});
  }
  if (/^\/(guides|alternatives)\/.+/.test(page.route)) graph.push({
    '@type':'Article',headline:page.title,description:page.description,author,publisher:author,
    datePublished:config.updated,dateModified:config.updated,mainEntityOfPage:{'@id':`${url}#page`},inLanguage:'en',
  });
  const questions = [...content.matchAll(/<details[^>]*>\s*<summary>(.*?)<\/summary>(.*?)<\/details>/gs)].map(m=>({'@type':'Question',name:plain(m[1]),acceptedAnswer:{'@type':'Answer',text:plain(m[2])}}));
  if (questions.length) graph.push({'@type':'FAQPage',mainEntity:questions});
  if (config.video && content.includes('<video')) graph.push({'@type':'VideoObject',name:config.video.title,description:config.video.description,thumbnailUrl:`${origin}${config.video.poster}`,uploadDate:config.video.uploadDate,duration:config.video.duration,contentUrl:`${origin}${config.video.file}`,...(config.video.youtubeUrl?{sameAs:config.video.youtubeUrl}:{}),transcript:config.video.transcript});
  return {'@context':'https://schema.org','@graph':graph};
}

export async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(path.join(root, 'public'), out, { recursive: true });
  for (const page of pages) {
    const canonical = `${origin}${page.route}`;
    const content = page.body.replaceAll('{{CTA}}', cta).replaceAll('{{STORE}}', store).replaceAll('{{SUPPORT}}', support).replaceAll('{{ROLLOUT}}', released ? '' : '<p class="rollout-note">The updated features shown here are prepared for release. The store currently offers version 1.0.1.</p>');
    const robots = indexable && page.indexable !== false ? 'index,follow,max-image-preview:large,max-video-preview:-1' : 'noindex,follow';
    const note = !released && !['/welcome/','/changelog/'].includes(page.route) ? '<div class="release-note">A fresh look and new ways to revisit your history. <a href="/changelog/">See what’s changing →</a><span>Store update pending.</span></div>' : '';
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="HistoryOut"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/social-card.png"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="720"><meta property="og:image:alt" content="HistoryOut. Find your way back. Export what matters."><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2479e0"><meta name="google-site-verification" content="J9EsmoQ_afZAfv1vTpVgo5bu_xHrSMfvtdjN_fUqgrs"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${JSON.stringify(structuredData(page,content)).replaceAll('<','\\u003c')}</script><script src="/site.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a>${note}<header class="site-header"><a class="brand" href="/" aria-label="HistoryOut home">${brand}</a><nav aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/guides/export-browser-history-to-html/">Guides</a><a href="/alternatives/">Compare</a><a class="nav-cta" href="${store}">Get it free ↗</a></nav></header><main id="main">${content}</main>${footer}</body></html>`;
    const target = page.route === '/' ? out : path.join(out, page.route);
    await mkdir(target, {recursive:true}); await writeFile(path.join(target,'index.html'),html);
  }
  await writeFile(path.join(out,'robots.txt'), indexable ? `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(out,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(p=>p.indexable!==false).map(p=>`<url><loc>${origin}${p.route}</loc><lastmod>${config.updated}</lastmod></url>`).join('')}</urlset>`);
  await writeFile(path.join(out,'404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | HistoryOut</title><link rel="stylesheet" href="/style.css"></head><body><main class="article"><h1>That page is not here.</h1><p><a href="/">Return to HistoryOut</a></p></main></body></html>');
  console.log(`Built ${pages.length} public pages. Search indexing: ${indexable}. Store release: ${released ? config.latestVersion : config.storeVersion}.`);
}
await build();
