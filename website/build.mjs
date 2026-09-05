import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages } from './content/pages.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
const origin = process.env.SITE_ORIGIN || 'https://historyout.sauliusdev.chatgpt.site';
const released = process.env.RELEASE_V2 === 'true';
if (released && !process.env.SITE_ORIGIN) throw new Error('Public release requires SITE_ORIGIN set to the verified canonical domain.');
const store = 'https://chromewebstore.google.com/detail/historyout-export-chrome/idohnkdgejocejlkihihonhemndpiiei';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cta = `<a class="button" href="${store}?utm_source=historyout_website&utm_medium=referral&utm_campaign=v2">${released ? 'Get HistoryOut free' : 'Get the current free version'} <span aria-hidden="true">↗</span></a>`;

export async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(path.join(root, 'public'), out, { recursive: true });
  for (const page of pages) {
    const canonical = `${origin}${page.route}`;
    const schema = page.route === '/' ? {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'HistoryOut',
      operatingSystem: 'Chrome on desktop', applicationCategory: 'UtilitiesApplication',
      description: page.description, url: canonical, downloadUrl: store,
      softwareVersion: released ? '2.0.0' : '1.0.1', offers: {'@type':'Offer', price:'0', priceCurrency:'USD'},
      author: {'@type':'Person',name:'Saulius Petreikis'},
    } : {'@context':'https://schema.org','@type':'WebPage', name:page.title, description:page.description, url:canonical};
    const content = page.body.replaceAll('{{CTA}}', cta).replaceAll('{{STORE}}', store);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="${released ? 'index,follow' : 'noindex,nofollow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${canonical}"><meta name="theme-color" content="#122c48"><meta name="google-site-verification" content="J9EsmoQ_afZAfv1vTpVgo5bu_xHrSMfvtdjN_fUqgrs"><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head><body><a class="skip" href="#main">Skip to content</a>${released ? '' : '<div class="release-note">Version 2 preview · The Chrome Web Store currently offers version 1.0.1.</div>'}<header class="site-header"><a class="brand" href="/" aria-label="HistoryOut home"><img src="/assets/icon128.png" width="30" height="30" alt="">HistoryOut<span class="version">2</span></a><nav aria-label="Main navigation"><a href="/#how-it-works">How it works</a><a href="/guides/export-chrome-history-to-excel/">Guides</a><a href="/alternatives/">Compare</a><a class="nav-cta" href="${store}">Chrome Web Store ↗</a></nav></header><main id="main">${content}</main><footer class="site-footer"><div><a class="brand" href="/">HistoryOut</a><p>A useful little tool. Your history, in your hands.</p></div><nav aria-label="Footer navigation"><a href="/browsers/">Browsers</a><a href="/privacy/">Privacy</a><a href="/changelog/">What’s new</a><a href="https://github.com/sauliusp/history-out">Source code ↗</a><a href="mailto:saulius.developer@gmail.com">Support</a></nav><p class="fine">Free. No account. No history uploaded by the extension.</p></footer></body></html>`;
    const target = page.route === '/' ? out : path.join(out, page.route);
    await mkdir(target, {recursive:true}); await writeFile(path.join(target,'index.html'),html);
  }
  await writeFile(path.join(out,'robots.txt'), released ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(out,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${origin}${p.route}</loc></url>`).join('')}</urlset>`);
  await writeFile(path.join(out,'404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | HistoryOut</title><link rel="stylesheet" href="/style.css"><main class="article"><h1>That page is not here.</h1><p><a href="/">Return to HistoryOut</a></p></main></html>');
  console.log(`Built ${pages.length} pages (${released ? 'public release' : 'private v2 preview'}).`);
}
await build();
