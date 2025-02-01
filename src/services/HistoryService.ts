export type HistoryRange = 'day' | 'week' | 'month' | 'all' | 'custom';
export type ExportFormat = 'csv' | 'json' | 'html';

export interface DateRange {
  startTime: number;
  endTime: number;
}

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
    return new Promise((resolve) => {
      chrome.history.search(
        {
          text: '',
          startTime: range.startTime,
          endTime: range.endTime,
          maxResults: 0,
        },
        (items) => {
          resolve(items);
        }
      );
    });
  }

  public async exportHistory(
    items: chrome.history.HistoryItem[],
    format: ExportFormat
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(items, null, 2);
      case 'csv':
        return this.convertToCSV(items);
      case 'html':
        return this.convertToHTML(items);
      default:
        throw new Error('Unsupported format');
    }
  }

  private convertToCSV(items: chrome.history.HistoryItem[]): string {
    const headers = ['Title', 'URL', 'Visit Time', 'Visit Count'];
    const rows = items.map((item) => [
      item.title || '',
      item.url || '',
      new Date(item.lastVisitTime || 0).toISOString(),
      item.visitCount || 0,
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
  }

  private convertToHTML(items: chrome.history.HistoryItem[]): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Browsing History</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>URL</th>
                <th>Visit Time</th>
                <th>Visit Count</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                    <tr>
                      <td>${item.title || ''}</td>
                      <td><a href="${item.url}">${item.url}</a></td>
                      <td>${new Date(
                        item.lastVisitTime || 0
                      ).toLocaleString()}</td>
                      <td>${item.visitCount || 0}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
}
