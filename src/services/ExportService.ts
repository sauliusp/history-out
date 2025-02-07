import { ExportFormat } from '../types/ExportFormat';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { OutputConfig } from '../types/OutputConfig';

export class ExportService {
  private static instance: ExportService;

  columnLabelMap: Record<keyof OutputHistoryItem, string> = {
    order: 'Order',
    id: 'ID',
    title: 'Title',
    url: 'URL',
    visitTime: 'Visit Timestamp',
    visitTimeFormatted: 'Visit Time',
    lastVisitTime: 'Last Visit Timestamp',
    lastVisitTimeFormatted: 'Last Visit Time',
    visitCount: 'Times visited',
    typedCount: 'Times manually entered',
    transition: 'Accessed via',
    transitionLabel: 'Transition Title',
    referringVisitId: 'Referring Visit ID',
    visitId: 'Visit ID',
  };

  // Define a fixed order for columns
  readonly columnOrder: (keyof OutputHistoryItem)[] = [
    'order',
    'id',
    'visitTimeFormatted',
    'visitTime',
    'title',
    'url',
    'visitCount',
    'typedCount',
    'lastVisitTimeFormatted',
    'lastVisitTime',
    'transition',
    'transitionLabel',
    'referringVisitId',
    'visitId',
  ];

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  public exportData(
    items: Record<string, any>[],
    format: ExportFormat,
    fields: OutputConfig['fields']
  ): void {
    // Filter items based on selected fields
    const filteredItems = items.map((item) => {
      const filtered: Record<string, any> = {};
      Object.entries(fields).forEach(([key, include]) => {
        if (include) {
          filtered[key] = item[key];
        }
      });
      return filtered;
    });

    let dataToExport: string;

    switch (format) {
      case 'json':
        dataToExport = this.convertToJSON(filteredItems);
        break;
      case 'csv':
        dataToExport = this.convertToCSV(filteredItems);
        break;
      case 'html':
        dataToExport = this.convertToHTML(filteredItems);
        break;
      default:
        throw new Error('Unsupported format');
    }

    const dataFormatMap: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
    };

    // Create and trigger download
    const blob = new Blob([dataToExport], {
      type: dataFormatMap[format],
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private convertToJSON(items: Record<string, any>[]): string {
    return JSON.stringify(items, null, 2);
  }

  private convertToCSV(items: Record<string, any>[]): string {
    // Use columnOrder instead of Object.keys()
    const keys = this.columnOrder.filter((key) => key in items[0]);

    return [
      keys.map((key) => this.columnLabelMap[key]).join(','),
      ...items.map((item) =>
        keys
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
    // Use columnOrder instead of Object.keys()
    const keys = this.columnOrder.filter((key) => key in items[0]);

    const headerRow = keys
      .map(
        (key) =>
          `<th style="width: ${100 / keys.length}%">${
            this.columnLabelMap[key]
          }</th>`
      )
      .join('');

    const rows = items.map(
      (item) => `
      <tr>
        ${keys
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
