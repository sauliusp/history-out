import { DateRange } from '../types/DateRange';
import { TransitionType } from '../types/TransitionType';
import { OutputHistoryItem } from '../types/OutputHistoryItem';

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

  public async getVisits(url: string): Promise<chrome.history.VisitItem[]> {
    const visits = await chrome.history.getVisits({ url });
    return visits;
  }

  public async prepareHistoryItems(
    items: chrome.history.HistoryItem[]
  ): Promise<OutputHistoryItem[]> {
    // Fetch all visits in parallel
    const visitsPromises = items.map((item) =>
      this.getVisits(item.url!).then((visits) => ({ item, visits }))
    );

    // Wait for all visits to resolve
    const itemsWithVisits = await Promise.all(visitsPromises);

    const expandedItems: OutputHistoryItem[] = [];

    // Process results
    itemsWithVisits.forEach(({ item, visits }) => {
      visits.forEach((visit) => {
        const transition =
          (visit.transition as TransitionType) || TransitionType.LINK;

        expandedItems.push({
          order: expandedItems.length, // Maintain overall order
          id: item.id || '0',
          referringVisitId: visit.referringVisitId || '0',
          transition,
          transitionLabel: this.transitionTypeLabelMap[transition],
          visitId: visit.id?.toString() || '0',
          visitTime: visit.visitTime || 0,
          visitTimeFormatted: new Date(visit.visitTime || 0).toLocaleString(),
          title: item.title || '',
          lastVisitTime: item.lastVisitTime || 0,
          lastVisitTimeFormatted: new Date(
            item.lastVisitTime || 0
          ).toLocaleString(),
          typedCount: item.typedCount || 0,
          url: item.url || '',
          visitCount: item.visitCount || 0,
        });
      });
    });

    const sortedItems = expandedItems.sort((a, b) => b.visitTime - a.visitTime);

    return sortedItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
  }
}
