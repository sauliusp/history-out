import { OutputHistoryItem } from '../types/OutputHistoryItem';

export interface HistoryFilters {
  query?: string;
  domain?: string;
  uniqueUrls?: boolean;
  stripQuery?: boolean;
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return '';
  }
}

/** Only removes query and fragment; it does not redact paths or credentials. */
export function stripUrlQuery(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareHistoryItems(a: OutputHistoryItem, b: OutputHistoryItem): number {
  return (b.timestamp ?? 0) - (a.timestamp ?? 0) ||
    compareText(a.url, b.url) || compareText(a.id, b.id) ||
    compareText(a.transition, b.transition) || compareText(a.title, b.title) ||
    a.order - b.order;
}

function normalizeDomainFilter(domain: string): string {
  const input = domain.trim();
  if (!input) return '';
  return getDomain(input.includes('://') ? input : `https://${input}`);
}

/** Pure in-memory view. Search uses the original title and URL before cleanup. */
export function filterHistory(
  items: readonly OutputHistoryItem[],
  filters: HistoryFilters = {}
): OutputHistoryItem[] {
  const query = (filters.query || '').trim().toLowerCase();
  const requestedDomain = (filters.domain || '').trim();
  const domain = normalizeDomainFilter(requestedDomain);
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (query && !item.title.toLowerCase().includes(query) && !item.url.toLowerCase().includes(query)) return false;
      if (!requestedDomain) return true;
      const hostname = getDomain(item.url);
      return !!domain && (hostname === domain || hostname.endsWith(`.${domain}`));
    })
    .map((item) => ({ ...item, url: filters.stripQuery ? stripUrlQuery(item.url) : item.url }))
    .sort(compareHistoryItems)
    .filter((item) => {
      if (!filters.uniqueUrls) return true;
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .map((item, index) => ({ ...item, order: index + 1 }));
}

export interface HistorySummary {
  visits: number;
  uniquePages: number;
  domains: number;
  topDomains: { domain: string; visits: number }[];
}

/** Counts rows in the supplied view, never the lifetime visitCount metadata. */
export function summarizeHistory(items: readonly OutputHistoryItem[]): HistorySummary {
  const pages = new Set<string>();
  const domainCounts = new Map<string, number>();
  items.forEach((item) => {
    pages.add(item.url);
    const domain = getDomain(item.url);
    if (domain) domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
  });
  return {
    visits: items.length,
    uniquePages: pages.size,
    domains: domainCounts.size,
    topDomains: Array.from(domainCounts, ([domain, visits]) => ({ domain, visits }))
      .sort((a, b) => b.visits - a.visits || compareText(a.domain, b.domain)),
  };
}
