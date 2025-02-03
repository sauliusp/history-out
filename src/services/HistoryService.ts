import { ExportFormat } from '../types/ExportFormat';
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

  private async convertToJSON(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const visits = await this.getVisits(item.url!);
        const lastVisit = visits[0] || {};
        const isWebUrl = /^https?:\/\//.test(item.url || '');
        const transition =
          (lastVisit.transition as TransitionType) || TransitionType.LINK;

        return {
          id: item.id || '0',
          isWebUrl,
          referringVisitId: lastVisit.referringVisitId || '0',
          transition,
          transitionLabel: this.transitionTypeLabelMap[transition],
          visitId: lastVisit.id?.toString() || '0',
          visitTime: lastVisit.visitTime || item.lastVisitTime,
          title: item.title || '',
          lastVisitTime: item.lastVisitTime || 0,
          typedCount: item.typedCount || 0,
          url: item.url || '',
          visitCount: item.visitCount || 0,
        };
      })
    );
    return JSON.stringify(enrichedItems, null, 2);
  }

  public async exportHistory(
    items: chrome.history.HistoryItem[],
    format: ExportFormat
  ): Promise<string> {
    switch (format) {
      case 'json':
        return await this.convertToJSON(items);
      case 'csv':
        return await this.convertToCSV(items);
      case 'html':
        return await this.convertToHTML(items);
      default:
        throw new Error('Unsupported format');
    }
  }

  public async getVisits(url: string): Promise<chrome.history.VisitItem[]> {
    const visits = await chrome.history.getVisits({ url });

    return visits;
  }

  private async convertToCSV(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const headers = [
      'order',
      'id',
      'date',
      'time',
      'title',
      'url',
      'visitCount',
      'typedCount',
      'transition type',
      'transition label',
    ];

    let order = 0;

    const rows = await Promise.all(
      items.map(async (item) => {
        const visits = await this.getVisits(item.url!);
        const transition = (
          visits.length > 0 ? visits[0].transition : TransitionType.LINK
        ) as TransitionType;
        const transitionLabel = this.transitionTypeLabelMap[transition];

        const visitDate = new Date(item.lastVisitTime || 0);
        const dateStr = visitDate.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        });
        const timeStr = visitDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        return [
          order++,
          item.id || '0',
          dateStr,
          timeStr,
          item.title || '',
          item.url || '',
          item.visitCount || 0,
          item.typedCount || 0,
          transition,
          transitionLabel,
        ];
      })
    );

    return [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' &&
            (cell.includes(',') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');
  }

  private async convertToHTML(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const rows = await Promise.all(
      items.map(async (item) => {
        const visits = await this.getVisits(item.url!);
        const transition = (
          visits.length > 0 ? visits[0].transition : TransitionType.LINK
        ) as TransitionType;
        return `
        <tr>
          <td>${item.title || ''}</td>
          <td><a href="${item.url}">${item.url}</a></td>
          <td>${new Date(item.lastVisitTime || 0).toLocaleString()}</td>
          <td>${item.visitCount || 0}</td>
          <td>${transition}</td>
        </tr>
      `;
      })
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Browsing History</title>
          <style>
            body {
              margin: 0;
              padding: 16px;
              max-width: 100%;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            }
            table { 
              border-collapse: collapse; 
              width: 100%;
              max-width: 100%;
              table-layout: fixed;
            }
            th, td { 
              padding: 8px; 
              text-align: left; 
              border: 1px solid #ddd;
              word-wrap: break-word;
              overflow-wrap: break-word;
              min-width: 0;
            }
            th { 
              background-color: #f2f2f2; 
            }
            td a {
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Title</th>
                <th style="width: 40%">URL</th>
                <th style="width: 15%">Visit Time</th>
                <th style="width: 10%">Visit Count</th>
                <th style="width: 15%">Transition Type</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
}
