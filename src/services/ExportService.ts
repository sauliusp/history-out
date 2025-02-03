import { ExportFormat } from '../types/ExportFormat';
import { TransitionType } from '../types/TransitionType';
import { HistoryService } from './HistoryService';

export class ExportService {
  private static instance: ExportService;
  private historyService: HistoryService;

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

  private columnLabelMap: Record<string, string> = {
    id: 'ID',
    title: 'Title',
    url: 'URL',
    visitTime: 'Visit Time',
    visitTimeFormatted: 'Visit Time Formatted',
    lastVisitTime: 'Last Visit Time',
    lastVisitTimeFormatted: 'Last Visit Time Formatted',
    visitCount: 'Times visited',
    typedCount: 'Times URL manually entered',
    transition: 'Accessed via',
    transitionLabel: 'Transition Title',
    isWebUrl: 'Web URL',
    referringVisitId: 'Referring Visit ID',
    visitId: 'Visit ID',
    order: 'Order',
  };

  private constructor() {
    this.historyService = HistoryService.getInstance();
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
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

  private async prepareItemsForExport(
    items: chrome.history.HistoryItem[]
  ): Promise<Record<string, any>[]> {
    const preparedItems = await this.historyService.prepareHistoryItems(items);
    return preparedItems.map((item) => ({
      ...item,
      transitionLabel:
        this.transitionTypeLabelMap[item.transition as TransitionType],
    }));
  }

  private async convertToJSON(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const preparedItems = await this.prepareItemsForExport(items);
    return JSON.stringify(preparedItems, null, 2);
  }

  private async convertToCSV(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const preparedItems = await this.prepareItemsForExport(items);
    const headers = Object.keys(this.columnLabelMap);

    return [
      headers.map((key) => this.columnLabelMap[key]).join(','),
      ...preparedItems.map((item) =>
        headers
          .map((key) => {
            const cell = item[key]?.toString() || '';
            return cell.includes(',') || cell.includes('"')
              ? `"${cell.replace(/"/g, '""')}"`
              : cell;
          })
          .join(',')
      ),
    ].join('\n');
  }

  private async convertToHTML(
    items: chrome.history.HistoryItem[]
  ): Promise<string> {
    const preparedItems = await this.prepareItemsForExport(items);
    const headers = Object.keys(this.columnLabelMap);

    const headerRow = headers
      .map(
        (key) =>
          `<th style="width: ${100 / headers.length}%">${
            this.columnLabelMap[key]
          }</th>`
      )
      .join('');

    const rows = preparedItems.map(
      (item) => `
      <tr>
        ${headers
          .map((key) => {
            const value = item[key];
            return key === 'url'
              ? `<td><a href="${value}">${value}</a></td>`
              : `<td>${value}</td>`;
          })
          .join('')}
      </tr>
    `
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
              <tr>${headerRow}</tr>
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
