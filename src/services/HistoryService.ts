import { DateRange } from '../types/DateRange';
import { TransitionType } from '../types/TransitionType';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { compareHistoryItems, getDomain } from '../utils/historyUtils';
import { isValidDateRange } from '../utils/outputConfig';

export interface HistoryLoadOptions {
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('History loading cancelled.', 'AbortError');
}

/** Chrome calls cannot be stopped, but cancellation discards their results. */
function withAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(new DOMException('History loading cancelled.', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener('abort', abort); resolve(value); },
      (error) => { signal.removeEventListener('abort', abort); reject(error); }
    );
    if (signal.aborted) abort();
  });
}

function validateRange(range: DateRange): void {
  if (!isValidDateRange(range)) throw new Error('Choose a valid start and end date.');
}

export class HistoryService {
  private static instance: HistoryService;
  private constructor() {}

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) HistoryService.instance = new HistoryService();
    return HistoryService.instance;
  }

  public async getHistory(range: DateRange, options: HistoryLoadOptions = {}): Promise<chrome.history.HistoryItem[]> {
    validateRange(range);
    checkAborted(options.signal);
    // search() returns pages by their last visit. Including newer candidate URLs
    // prevents missing an in-range visit to a page that was visited again later.
    // Exact date filtering happens in getVisits(). The limit is never silently hit.
    const maxResults = 1000000;
    const items = await withAbort(chrome.history.search({
      text: '',
      startTime: Math.max(0, range.startTime - 1),
      endTime: Math.max(Date.now(), range.endTime) + 1,
      maxResults,
    }), options.signal);
    checkAborted(options.signal);
    if (items.length >= maxResults) {
      throw new Error('Your browser returned too many pages to safely export. Choose a more recent start date.');
    }
    return items;
  }

  public async getVisits(url: string, dateRange: DateRange): Promise<chrome.history.VisitItem[]> {
    validateRange(dateRange);
    const visits = await chrome.history.getVisits({ url });
    return visits.filter((visit) => typeof visit.visitTime === 'number' &&
      Number.isFinite(visit.visitTime) && visit.visitTime >= dateRange.startTime &&
      visit.visitTime <= dateRange.endTime);
  }

  public async prepareHistoryItems(
    items: chrome.history.HistoryItem[],
    dateRange: DateRange,
    options: HistoryLoadOptions = {}
  ): Promise<OutputHistoryItem[]> {
    validateRange(dateRange);
    checkAborted(options.signal);
    const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
    const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
    // Chrome normally returns one row per URL. Defend against duplicate/empty URLs.
    const seenUrls = new Set<string>();
    const candidates = items.filter((item) => {
      if (!item.url || seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });
    const expanded: OutputHistoryItem[] = [];
    let cursor = 0;
    let completed = 0;
    let stopped = false;
    options.onProgress?.(0, candidates.length);
    const worker = async () => {
      try {
        while (!stopped && cursor < candidates.length) {
          checkAborted(options.signal);
          const item = candidates[cursor++];
          const visits = await withAbort(this.getVisits(item.url!, dateRange), options.signal);
          checkAborted(options.signal);
          if (stopped) return;
          const seenVisits = new Set<string>();
          for (let visitIndex = 0; visitIndex < visits.length; visitIndex++) {
            // A heavily visited single URL must not block cancellation or typing.
            if (visitIndex > 0 && visitIndex % 256 === 0) {
              await new Promise<void>((resolve) => setTimeout(resolve, 0));
              checkAborted(options.signal);
              if (stopped) return;
            }
            const visit = visits[visitIndex];
            if (visit.visitId && seenVisits.has(visit.visitId)) continue;
            if (visit.visitId) seenVisits.add(visit.visitId);
            const timestamp = visit.visitTime!;
            expanded.push({
              order: 0,
              id: item.id || '0',
              timestamp,
              domain: getDomain(item.url!),
              date: dateFormatter.format(timestamp),
              time: timeFormatter.format(timestamp),
              title: item.title || '',
              url: item.url!,
              // These are Chrome's lifetime URL totals, not range-specific totals.
              visitCount: item.visitCount ?? 0,
              typedCount: item.typedCount ?? 0,
              transition: (visit.transition as TransitionType) || TransitionType.LINK,
            });
          }
          completed += 1;
          options.onProgress?.(completed, candidates.length);
        }
      } catch (error) {
        stopped = true;
        throw error;
      }
    };
    // A small worker pool keeps large exports responsive and limits API pressure.
    await Promise.all(Array.from({ length: Math.min(8, candidates.length) }, worker));
    checkAborted(options.signal);
    return expanded.sort(compareHistoryItems).map((item, index) => ({ ...item, order: index + 1 }));
  }
}
