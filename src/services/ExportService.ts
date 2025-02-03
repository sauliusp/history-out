import { ExportFormat } from '../types/ExportFormat';

export class ExportService {
  private static instance: ExportService;

  private columnLabelMap: Record<string, string> = {
    order: 'Order',
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
  };

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  public async exportData(
    items: Record<string, any>[],
    format: ExportFormat
  ): Promise<string> {
    switch (format) {
      case 'json':
        return this.convertToJSON(items);
      case 'csv':
        return this.convertToCSV(items);
      case 'html':
        return this.convertToHTML(items);
      default:
        throw new Error('Unsupported format');
    }
  }

  private convertToJSON(items: Record<string, any>[]): string {
    return JSON.stringify(items, null, 2);
  }

  private convertToCSV(items: Record<string, any>[]): string {
    const headers = Object.keys(this.columnLabelMap);

    return [
      headers.map((key) => this.columnLabelMap[key]).join(','),
      ...items.map((item) =>
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

  private convertToHTML(items: Record<string, any>[]): string {
    const headers = Object.keys(this.columnLabelMap);

    const headerRow = headers
      .map(
        (key) =>
          `<th style="width: ${100 / headers.length}%">${
            this.columnLabelMap[key]
          }</th>`
      )
      .join('');

    const rows = items.map(
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
