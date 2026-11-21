import { pages as englishPages } from './pages.mjs';
import zh from './locales/zh-CN.mjs';
import es from './locales/es.mjs';
import de from './locales/de.mjs';
import pt from './locales/pt-BR.mjs';
import fr from './locales/fr.mjs';
import ja from './locales/ja.mjs';

export const locales = [
  {code:'en', path:'', name:'English', og:'en_US'},
  {code:'zh-CN', path:'zh-cn', name:'简体中文', og:'zh_CN', catalog:zh},
  {code:'es', path:'es', name:'Español', og:'es_ES', catalog:es},
  {code:'de', path:'de', name:'Deutsch', og:'de_DE', catalog:de},
  {code:'pt-BR', path:'pt-br', name:'Português (Brasil)', og:'pt_BR', catalog:pt},
  {code:'fr', path:'fr', name:'Français', og:'fr_FR', catalog:fr},
  {code:'ja', path:'ja', name:'日本語', og:'ja_JP', catalog:ja},
];
export const englishUI = {
  cta:'Get HistoryOut free', how:'How it works', guides:'Guides', compare:'Compare', feedback:'Suggest a feature', get:'Get it free', skip:'Skip to content', mainNav:'Main navigation', home:'HistoryOut home', languages:'Language', footerLead:'A useful little tool.<br>Your history, in your hands.', support:'Support HistoryOut', supportNote:'Optional support for a free project.<br>Contribute through Buy Me a Coffee.', fit:'Find your fit', alternative:'alternative', useful:'Make it useful', html:'Export history to HTML', excel:'Export history to Excel', research:'Find yesterday’s research', limits:'Understand history limits', browsers:'Chrome, Edge and Brave', welcome:'Getting started', changes:'What’s new', privacy:'Privacy and permissions', source:'Source code', contact:'Contact Saulius', footer:'Made by Saulius. Free to use. No account. No history uploaded by the extension.', rollout:'Version {latest} is being prepared. The store currently offers version {store}.', imageAlt:'HistoryOut. Export browser history as CSV, JSON or HTML.', notFound:'That page is not here.', returnHome:'Return to HistoryOut', notFoundTitle:'Page not found', comparison:'Compare history tools'
};
export const localeRoute = (locale, route='/') => locale.path ? `/${locale.path}${route}` : route;
export function localizeLinks(html, locale) {
  const routes = new Set(englishPages.map(p=>p.route));
  html=html.replaceAll('href="/assets/sample-history.html"',`href="/assets/localized/${locale.code}/sample-history.html"`);
  return html.replace(/href="(\/[^"?]*)(\?[^"#]*)?(#[^"]*)?"/g,(whole,raw,query='',hash='')=>{
    const at=raw.indexOf('#'); if(at>=0){hash=raw.slice(at);raw=raw.slice(0,at);}
    return routes.has(raw)?`href="${localeRoute(locale,raw)}${query}${hash}"`:whole;
  });
}
const article=(title,lead,body,eyebrow='HistoryOut')=>`<article class="article"><a class="back" href="/">← HistoryOut</a><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${lead}</p>${body}</article>`;
function homePage(c,locale) {
  const h=c.home, u=c.ui, b=c.brand;
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span>${h.eyebrow}</p><h1>${h.heading}</h1><div class="hero-formats" aria-label="${h.formatsLabel}"><span>CSV</span><span>JSON</span><span>HTML</span></div><p class="hero-lead">${h.lead}</p>{{CTA}}<p class="trust">${h.trust}</p><a class="text-link" href="#demo">${h.demoLink} ↓</a></div><div class="hero-product export-product"><div class="product-label"><span>${h.productLabel}</span></div><div class="product-frame"><img src="/assets/localized/${locale.code}/historyout-export-hero.png" width="1600" height="1350" alt="${h.imageAlt}" class="product-shot" fetchpriority="high"></div><p class="caption">${h.caption}</p></div></section>
<p class="browser-note"><a href="/browsers/">${h.browsers} →</a></p><section class="proof-strip" aria-label="${h.principlesLabel}">${h.proof.map(([n,s])=>`<span><strong>${n}</strong> ${s}</span>`).join('')}</section>
<span id="how-historyout-works"></span><section id="how-it-works" class="section"><div class="section-heading"><p class="eyebrow">${h.formatsIntro}</p><h2>${h.formatsTitle}</h2></div><div class="steps format-steps">${h.formats.map(([format,title,body,link],i)=>`<article><span class="step-number">${format}</span><h3>${title}</h3><p>${body}</p><a class="text-link" href="${['/guides/export-chrome-history-to-excel/','/assets/sample-history.json','/assets/sample-history.html'][i]}"${i===1?' download':''}>${link} →</a></article>`).join('')}</div></section>
<aside class="studio-banner" aria-labelledby="studio-banner-title"><div class="studio-banner__inner"><div class="studio-banner__credit"><span>${b.credit}</span><a href="https://mortalitystudio.com/en/?utm_source=historyout&amp;utm_medium=referral&amp;utm_campaign=studio_banner">MortalityStudio</a></div><p class="studio-banner__stamp">${b.stamp}</p><h2 id="studio-banner-title" class="studio-banner__title">${b.heading}</h2><div class="studio-banner__pitch"><p>${b.body}</p><div class="studio-banner__links"><a class="studio-banner__link studio-banner__link--site" href="https://mortalitystudio.com/en/?utm_source=historyout&amp;utm_medium=referral&amp;utm_campaign=studio_banner"><strong>${b.site}</strong><span>MortalityStudio.com ↗</span></a><a class="studio-banner__link studio-banner__link--social" href="https://www.instagram.com/mortalitystudio/"><strong>${b.social}</strong><span>MortalityStudio · Instagram ↗</span></a></div></div></div></aside>
<section class="section demo-section" id="demo"><div><p class="eyebrow">${h.demoIntro}</p><h2>${h.demoTitle}</h2><p>${h.demoText}</p></div><video controls preload="metadata" playsinline aria-label="${h.demoLink}" poster="/assets/historyout-export-story-poster.png"><source src="/assets/historyout-export-demo.mp4" type="video/mp4"><track kind="captions" src="/assets/historyout-export-demo-captions.vtt" srclang="en" label="English"><a href="/assets/historyout-export-demo.mp4">${h.demoLink}</a></video></section>
<span id="why-use-historyout"></span><section class="use-case section"><div><p class="eyebrow">${h.customIntro}</p><h2>${h.customTitle}</h2><p>${h.customText}</p><p class="fine">${h.limits}</p></div><div class="format-list customization-list">${h.custom.map(([title,body],i)=>`<div><span class="format-tag">0${i+1}</span><h3>${title}</h3><p>${body}</p></div>`).join('')}</div></section>
<section class="section daily-section"><div class="section-heading"><p class="eyebrow">${h.dailyIntro}</p><h2>${h.dailyTitle}</h2></div><div class="daily-grid">${h.daily.map(([title,body])=>`<article><h3>${title}</h3><p>${body}</p></article>`).join('')}</div><a class="text-link" href="/guides/filter-browser-history/">${u.research} →</a></section>
<span id="overview"></span><section class="privacy-block"><div><h2>${h.privacyTitle}</h2></div><div><p>${h.privacyText}</p><a class="text-link" href="/privacy/">${u.privacy} →</a></div></section>
<section class="section"><div class="section-heading"><h2>${h.compareTitle}</h2></div><div class="link-grid"><a href="/alternatives/export-chrome-history/">Export Chrome History: ${u.alternative}</a><a href="/alternatives/history-trends-unlimited/">History Trends Unlimited: ${u.alternative}</a><a href="/alternatives/better-history/">Better History: ${u.alternative}</a><a href="/guides/export-chrome-history-to-excel/">${u.excel}</a></div></section>
<section class="section faq"><h2>${h.faqTitle}</h2>${h.faq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section><span id="download-section"></span><section class="section feedback-section"><div><h2>${h.feedbackTitle}</h2><p>${h.feedbackText}</p></div><div><a class="text-link" href="{{FEEDBACK}}" target="_blank" rel="noopener noreferrer">${u.feedback} ↗</a><p class="fine">${h.feedbackNote}</p></div></section><section class="closing"><p class="eyebrow">CSV. JSON. HTML.</p><h2>${h.closing}</h2>{{CTA}}</section>`;
}
export function getPages(locale) {
  if(locale.code==='en')return englishPages.map(page=>({...page,baseRoute:page.route,locale}));
  const c=locale.catalog;
  const translated=[{route:'/',title:c.home.title,description:c.home.lead,body:homePage(c,locale)}];
  for(const [route,[title,lead,body]] of Object.entries(c.articles))translated.push({route,title:`${title} | HistoryOut`,description:lead,body:article(title,lead,body)});
  for(const [route,key] of [['/welcome/','welcome'],['/changelog/','update']]){
    const l=c.lifecycle[key];translated.push({route,title:`${l.title} | HistoryOut`,description:l.lead,body:article(l.heading,l.lead,(key==='update'?'{{ROLLOUT}}':'')+l.body,l.eyebrow),...(key==='welcome'?{indexable:false}:{})});
  }
  const expected=englishPages.map(p=>p.route).sort().join('|');
  if(translated.map(p=>p.route).sort().join('|')!==expected)throw new Error(`Incomplete page catalog: ${locale.code}`);
  return translated.map(page=>({...page,baseRoute:page.route,route:localeRoute(locale,page.route),body:localizeLinks(page.body,locale),locale}));
}
export const allPages=locales.flatMap(getPages);
