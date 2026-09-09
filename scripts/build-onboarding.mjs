import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { welcome, update } from '../website/content/lifecycle.mjs';

const product = JSON.parse(readFileSync(new URL('../website/content/product.json', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('../extension-unpacked/manifest.json', import.meta.url)));
const target = new URL('../extension-unpacked/', import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const actions = `<div class="onboarding-actions"><a class="button" href="side-panel.html" data-open-historyout>Open HistoryOut <span aria-hidden="true">→</span></a><a class="workspace-link" href="side-panel.html">Open in a full tab</a></div><p id="open-status" role="status" class="fine">Open beside this page, or use the full-tab workspace.</p>`;
for (const [file, page] of [['welcome.html', welcome], ['updated.html', update]]) {
  const content = page.body.replaceAll('{{FEEDBACK}}', product.feedback)
    .replaceAll('{{CONTACT}}', product.contactEmail)
    .replaceAll('{{SUPPORT}}', 'https://www.buymeacoffee.com/saulius.developer')
    .replaceAll('src="/assets/icon128.png"', 'src="icons/icon128.png"')
    .replaceAll('href="/', `href="${product.website}/`);
  writeFileSync(new URL(file, target), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(page.title)} | HistoryOut</title><link rel="icon" href="icons/icon32.png"><link rel="stylesheet" href="onboarding.css"><script src="onboarding.js" defer></script></head>
<body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="side-panel.html" aria-label="Open HistoryOut in a full tab"><img src="assets/logo.svg" width="144" height="58" alt="HistoryOut"></a><nav aria-label="Useful links"><a href="${product.website}/" target="_blank" rel="noopener noreferrer">Website ↗</a><a href="${product.feedback}" target="_blank" rel="noopener noreferrer">Suggest a feature ↗</a></nav></header>
<main id="main" class="article onboarding"><p class="eyebrow">${page.eyebrow} · <span data-version>${manifest.version}</span></p><h1>${page.heading}</h1><p class="lead">${page.lead}</p>${actions}${content}</main>
<footer class="onboarding-footer"><span>Free. Your history stays on your device.</span><nav aria-label="Support links"><a href="${product.website}/privacy/" target="_blank" rel="noopener noreferrer">Privacy</a><a href="mailto:${product.contactEmail}">Contact Saulius</a><a href="${product.feedback}" target="_blank" rel="noopener noreferrer">Suggest a feature ↗</a></nav></footer></body></html>\n`);
}
copyFileSync(new URL('../website/public/assets/logo.svg', import.meta.url), new URL('assets/logo.svg', target));
const css = readFileSync(new URL('../website/public/style.css', import.meta.url), 'utf8');
writeFileSync(new URL('onboarding.css', target), css + `
/* Packaged lifecycle pages share the website's established HistoryOut style. */
.onboarding{padding-top:48px}.onboarding .lead{margin-bottom:24px}.onboarding-actions{display:flex;align-items:center;flex-wrap:wrap;gap:20px}.onboarding-actions .button{margin:0}.workspace-link{font-size:.875rem}.onboarding #open-status{min-height:1.6em;margin:18px 0 30px}.onboarding-footer{max-width:1240px;margin:auto;padding:28px 35px;border-top:1px solid var(--line);display:flex;gap:20px;justify-content:space-between;flex-wrap:wrap;font-size:.875rem;color:var(--muted)}.onboarding-footer nav{display:flex;gap:22px;flex-wrap:wrap}.onboarding a:focus-visible,.onboarding-footer a:focus-visible,.site-header a:focus-visible{outline:3px solid var(--blue);outline-offset:5px}.onboarding .feedback-note{border-top:1px solid var(--line);margin-top:40px;padding-top:4px}.onboarding .feedback-note h2{font-size:1.6rem}.site-header nav a{display:inline!important}@media(max-width:480px){.site-header{align-items:flex-start;gap:12px}.site-header nav{flex-direction:column;align-items:flex-end;gap:10px}.onboarding{padding-top:32px}.onboarding-footer{padding:24px 22px}}
`);
console.log(`Built local welcome and update pages for ${manifest.version}.`);
