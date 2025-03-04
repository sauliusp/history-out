import { DateRange } from '../types/DateRange';
import { TransitionType } from '../types/TransitionType';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { OutputConfig } from '../types/OutputConfig';

export class HistoryService {
  private static instance: HistoryService;

  private constructor() {}

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  public async getHistory(
    range: DateRange
  ): Promise<chrome.history.HistoryItem[]> {
    const items = await chrome.history.search({
      text: '',
      startTime: range.startTime,
      endTime: range.endTime,
      maxResults: 1000000,
    });

    return items;
  }

  public async getVisits(
    url: string,
    dateRange: DateRange
  ): Promise<chrome.history.VisitItem[]> {
    const visits = await chrome.history.getVisits({ url });

    return visits.filter((visit) => {
      const vTime = visit.visitTime || 0;

      return vTime >= dateRange.startTime && vTime <= dateRange.endTime;
    });
  }

  public async prepareHistoryItems(
    items: chrome.history.HistoryItem[],
    dateRange: DateRange
  ): Promise<OutputHistoryItem[]> {
    // Helper functions to format dates and times efficiently
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });

    // Process items in chunks to avoid overwhelming the browser
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    const expandedItems: (OutputHistoryItem & { timestamp: number })[] = [];

    // Process chunks sequentially
    for (const chunk of chunks) {
      const chunkVisitsPromises = chunk.map((item) =>
        this.getVisits(item.url!, dateRange).then((visits) => ({
          item,
          visits,
        }))
      );

      const chunkItemsWithVisits = await Promise.all(chunkVisitsPromises);

      // Process results for this chunk
      chunkItemsWithVisits.forEach(({ item, visits }) => {
        expandedItems.push(
          ...visits.map((visit) => {
            const visitTime = visit.visitTime || 0;
            return {
              order: 0, // Will be updated after sorting
              id: item.id || '0',
              timestamp: visitTime,
              date: dateFormatter.format(visitTime),
              time: timeFormatter.format(visitTime),
              title: item.title || '',
              url: item.url || '',
              visitCount: item.visitCount || 0,
              typedCount: item.typedCount || 0,
              transition:
                (visit.transition as TransitionType) || TransitionType.LINK,
            };
          })
        );
      });
    }

    return expandedItems
      .sort((a, b) => b.timestamp - a.timestamp) // Need to keep timestamp for sorting
      .map((item, index) => {
        const { timestamp, ...finalItem } = item; // Remove visitTime from final output
        return {
          ...finalItem,
          order: index + 1,
        };
      });
  }
}
