import { DateRange } from '../types/DateRange';
import { TransitionType } from '../types/TransitionType';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { OutputConfig } from '../types/OutputConfig';

export class HistoryService {
  private static instance: HistoryService;

  private transitionTypeLabelMap: Record<TransitionType, string> = {
    [TransitionType.LINK]: 'Clicked Link',
    [TransitionType.TYPED]: 'Manually Typed URL',
    [TransitionType.AUTO_BOOKMARK]: 'Opened from Bookmarks',
    [TransitionType.AUTO_SUBFRAME]: 'Automatically Loaded Frame',
    [TransitionType.MANUAL_SUBFRAME]: 'Manually Loaded Frame',
    [TransitionType.GENERATED]: 'Automatically Generated',
    [TransitionType.AUTO_TOPLEVEL]: 'Automatic Navigation',
    [TransitionType.FORM_SUBMIT]: 'Form Submission',
    [TransitionType.RELOAD]: 'Page Reload',
    [TransitionType.KEYWORD]: 'Search Keyword',
    [TransitionType.KEYWORD_GENERATED]: 'Generated from Search',
  };

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
      maxResults: 0,
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
    // Helper function to format timestamps efficiently
    const formatTimestamp = (timestamp: number): string => {
      // Reuse date object to avoid creating new instances
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(timestamp);
    };

    // Process items in chunks to avoid overwhelming the browser
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    const expandedItems: OutputHistoryItem[] = [];

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
        const itemLastVisitFormatted = formatTimestamp(item.lastVisitTime || 0);

        expandedItems.push(
          ...visits.map((visit) => {
            const transition =
              (visit.transition as TransitionType) || TransitionType.LINK;

            return {
              order: 0, // Will be updated after sorting
              id: item.id || '0',
              referringVisitId: visit.referringVisitId || '0',
              transition,
              transitionLabel: this.transitionTypeLabelMap[transition],
              visitId: visit.id?.toString() || '0',
              visitTime: visit.visitTime || 0,
              visitTimeFormatted: formatTimestamp(visit.visitTime || 0),
              title: item.title || '',
              lastVisitTime: item.lastVisitTime || 0,
              lastVisitTimeFormatted: itemLastVisitFormatted,
              typedCount: item.typedCount || 0,
              url: item.url || '',
              visitCount: item.visitCount || 0,
            };
          })
        );
      });
    }

    return expandedItems
      .sort((a, b) => b.visitTime - a.visitTime)
      .map((item, index) => ({
        ...item,
        order: index + 1,
      }));
  }
}
