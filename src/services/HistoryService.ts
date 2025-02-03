import { DateRange } from '../types/DateRange';
import { TransitionType } from '../types/TransitionType';

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
  ): Promise<Record<string, any>[]> {
    let order = 0;
    return await Promise.all(
      items.map(async (item) => {
        const visits = await this.getVisits(item.url!);
        const lastVisit = visits[0] || {};
        const isWebUrl = /^https?:\/\//.test(item.url || '');
        const transition =
          (lastVisit.transition as TransitionType) || TransitionType.LINK;
        const visitTime = lastVisit.visitTime || item.lastVisitTime || 0;

        return {
          order: order++,
          id: item.id || '0',
          isWebUrl,
          referringVisitId: lastVisit.referringVisitId || '0',
          transition,
          transitionLabel: this.transitionTypeLabelMap[transition],
          visitId: lastVisit.id?.toString() || '0',
          visitTime,
          visitTimeFormatted: new Date(visitTime).toLocaleString(),
          title: item.title || '',
          lastVisitTime: item.lastVisitTime || 0,
          lastVisitTimeFormatted: new Date(
            item.lastVisitTime || 0
          ).toLocaleString(),
          typedCount: item.typedCount || 0,
          url: item.url || '',
          visitCount: item.visitCount || 0,
        };
      })
    );
  }
}
