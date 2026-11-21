const catalogs: typeof import('./catalogs.json') = require('./catalogs.json');

export type Locale = keyof typeof catalogs;
export type Message = keyof typeof catalogs.en;
export const localeTags: Record<Locale, string> = { en: 'en', zh_CN: 'zh-CN', es: 'es', de: 'de', pt_BR: 'pt-BR', fr: 'fr', ja: 'ja' };

/** Chrome locale names use underscores; Intl and web routes use BCP 47 tags. */
export function resolveLocale(language: string): Locale {
  const tag = language.replace(/_/g, '-').toLowerCase();
  if (/^zh(?:-(?:cn|sg|hans)(?:-|$)|$)/.test(tag)) return 'zh_CN';
  if (/^pt(?:-br(?:-|$)|$)/.test(tag)) return 'pt_BR';
  const base = tag.split('-')[0];
  return ['es', 'de', 'fr', 'ja'].includes(base) ? base as Locale : 'en';
}
export function browserLanguage(): string {
  try {
    const language = typeof chrome !== 'undefined' ? chrome.i18n?.getUILanguage?.() : undefined;
    if (language) return language;
  } catch { /* Preview pages and tests may have only a subset of Chrome APIs. */ }
  return (typeof navigator !== 'undefined' && navigator.language) || 'en';
}
export function currentLocale(): Locale { return resolveLocale(browserLanguage()); }
/** Keep regional date/number conventions, even when that UI language falls back to English. */
export function formatLocale(): string {
  try { return new Intl.DateTimeFormat().resolvedOptions().locale || 'en'; }
  catch { return 'en'; }
}
export function t(key: Message, values: Record<string, string | number> = {}, locale: Locale = currentLocale()): string {
  const template = catalogs[locale][key] || catalogs.en[key];
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : placeholder);
}
export function formatNumber(value: number): string { return new Intl.NumberFormat(formatLocale()).format(value); }
type Unit = 'visits' | 'pages' | 'sites' | 'columns';
const singular: Record<Unit, Message> = { visits: 'visit', pages: 'page', sites: 'site', columns: 'column' };
export function unitText(unit: Unit, value: number): string {
  return t(new Intl.PluralRules(localeTags[currentLocale()]).select(value) === 'one' ? singular[unit] : unit);
}
export function countText(unit: Unit, value: number): string {
  return t('{count} {unit}', { count: formatNumber(value), unit: unitText(unit, value) });
}
export function websitePath(path: string): string {
  const locale = currentLocale();
  return `https://exportchromehistory.app${locale === 'en' ? '' : '/' + localeTags[locale].toLowerCase()}${path}`;
}
export function localizedError(key: Message): Error {
  const error = new Error(t(key));
  error.name = 'HistoryOutError';
  return error;
}
