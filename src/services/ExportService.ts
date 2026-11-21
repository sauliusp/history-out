import { t, currentLocale, localeTags, formatNumber } from '../i18n';
import { ExportFormat } from '../types/ExportFormat';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { OutputConfig } from '../types/OutputConfig';
import { ColumnLabel } from '../types/ColumnLabel';
import { isValidDateRange, OUTPUT_COLUMNS } from '../utils/outputConfig';

function escapeHTML(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]!));
}

function csvCell(value: unknown): string {
  let cell = String(value ?? '');
  // Titles and URLs are untrusted. Prevent spreadsheet formula execution even
  // after leading whitespace; quote line breaks so they stay within one cell.
  if (typeof value === 'string' && (/^[\s\u0000-\u001f]*[=+\-@]/.test(cell) || /^[\t\r\n]/.test(cell))) {
    cell = `'${cell}`;
  }
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function isLinkableURL(value: unknown): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(String(value)).protocol);
  } catch {
    return false;
  }
}

export class ExportService {
  private static instance: ExportService;
  get columnLabelMap(): Record<keyof OutputHistoryItem, ColumnLabel> { return {
    order: { label: t("Order") },
    id: { label: t("Id") },
    date: { label: t("Date"), secondaryLabel: t("Visit date in your local time zone") },
    time: { label: t("Time"), secondaryLabel: t("Visit time in your local time zone") },
    title: { label: t("Title") },
    url: { label: t("Url") },
    visitCount: { label: t("Visit Count"), secondaryLabel: t("Browser lifetime total for this URL, not the selected range") },
    typedCount: { label: t("Typed Count"), secondaryLabel: t("Browser lifetime address-bar typing total for this URL") },
    transition: { label: t("Transition"), secondaryLabel: t("How this page visit was initiated") },
    timestamp: { label: t("Timestamp"), secondaryLabel: t("Visit time in Unix milliseconds, independent of time zone") },
    domain: { label: t("Domain"), secondaryLabel: t("The URL hostname, including any subdomain") },
  }; }
  readonly columnOrder = OUTPUT_COLUMNS;
  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) ExportService.instance = new ExportService();
    return ExportService.instance;
  }

  /** Pure serializer shared by downloads and tests. Only selected known keys leave memory. */
  public serializeData(
    items: readonly OutputHistoryItem[],
    format: ExportFormat,
    fields: OutputConfig['fields']
  ): string {
    const keys = this.columnOrder.filter((key) => fields[key] === true);
    if (!keys.length) throw new Error(t("Select at least one export field."));
    if (format === 'json') {
      return JSON.stringify(items.map((item) => {
        const result: Record<string, string | number> = {};
        keys.forEach((key) => { result[key] = item[key] ?? ''; });
        return result;
      }), null, 2);
    }
    if (format === 'csv') {
      return [keys.join(','), ...items.map((item) => keys.map((key) => csvCell(item[key])).join(','))].join('\r\n');
    }
    if (format !== 'html') throw new Error(t("Unsupported format"));
    const headers = keys.map((key) => {
      const { label, secondaryLabel } = this.columnLabelMap[key];
      return `<th scope="col"${secondaryLabel ? ` title="${escapeHTML(secondaryLabel)}"` : ''}>${escapeHTML(label)}</th>`;
    }).join('');
    const rows = items.map((item) => `<tr>${keys.map((key) => {
      const value = item[key];
      const escaped = escapeHTML(value);
      return `<td>${key === 'url' && isLinkableURL(value)
        ? `<a target="_blank" rel="noopener noreferrer" href="${escaped}">${escaped}</a>` : escaped}</td>`;
    }).join('')}</tr>`).join('\n');
    return `<!DOCTYPE html>
<html lang="${localeTags[currentLocale()]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escapeHTML(t('Browsing History'))} | HistoryOut</title>
<style>
*{box-sizing:border-box}body{font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f5f7fb;color:#122c48;line-height:1.55}
main{max-width:1480px;margin:0 auto;padding:36px 28px}header{padding:32px;border:1px solid #dce3f0;border-radius:18px;background:#fff;margin-bottom:24px}
.brand{font-size:15px;font-weight:800;letter-spacing:-.025em;color:#185adb;margin:0 0 20px}.badge{display:inline-block;margin-left:10px;padding:3px 8px;border-radius:5px;background:#edf1ff;color:#5c6f96;font-size:12px;letter-spacing:.03em;vertical-align:middle}
h1{font-size:36px;line-height:1.15;letter-spacing:-.045em;margin:0 0 12px}.description{color:#65738b;max-width:600px;margin:0 0 24px}.summary{display:flex;gap:28px;color:#65738b;font-size:12px}.summary strong{font-size:22px;color:#122c48;display:block;line-height:1.3;letter-spacing:-.025em}
.table-wrap{overflow-x:auto;border:1px solid #dce3f0;border-radius:12px;background:#fff}table{border-collapse:collapse;width:100%;min-width:${keys.length <= 4 ? '100%' : '640px'};table-layout:fixed;font-size:12px}caption{text-align:left;padding:16px 18px;font-weight:700;color:#122c48}th,td{padding:12px 10px;text-align:left;border-top:1px solid #e5eaf3;overflow-wrap:anywhere;vertical-align:top}th{background:#edf1f9;color:#4f6285;font-size:12px}tbody tr:nth-child(even){background:#fafbfe}a{word-break:break-all;color:#185adb;text-decoration:none}a:hover{text-decoration:underline}footer{color:#7b89a0;font-size:12px;padding:18px 2px}@media(max-width:640px){main{padding:18px 12px}header{padding:24px 20px}h1{font-size:28px}}
</style>
</head>
<body>
<main>
<header>
<p class="brand">HistoryOut <span class="badge">${escapeHTML(t('LOCAL EXPORT'))}</span></p>
<h1>${escapeHTML(t('Your browsing history.'))}</h1>
<p class="description">${escapeHTML(t('A useful record of the pages you chose to keep. Open a page to pick up where you left off.'))}</p>
<div class="summary"><div><strong>${formatNumber(items.length)}</strong>${escapeHTML(t(new Intl.PluralRules(localeTags[currentLocale()]).select(items.length) === 'one' ? 'exported row' : 'exported rows'))}</div><div><strong>${keys.length}</strong>${escapeHTML(t(new Intl.PluralRules(localeTags[currentLocale()]).select(keys.length) === 'one' ? 'selected column' : 'selected columns'))}</div></div>
</header>
<div class="table-wrap"><table><caption>${escapeHTML(t('Browsing History'))}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>
<footer>${escapeHTML(t('Created on your device. HistoryOut does not upload your browsing data. Share this file only with people you choose.'))}</footer>
</main>
</body>
</html>`;
  }

  public exportData(items: OutputHistoryItem[], format: ExportFormat, fields: OutputConfig['fields']): void {
    const data = this.serializeData(items, format, fields);
    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json;charset=utf-8',
      csv: 'text/csv;charset=utf-8',
      html: 'text/html;charset=utf-8',
    };
    const blob = new Blob([data], { type: mimeTypes[format] });
    const objectURL = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectURL;
    anchor.download = `history-export.${format}`;
    try {
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      // Give Chrome time to consume the URL before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    }
  }

  /** Strict validation for callers; use normalizeOutputConfig() for v1 migration. */
  public isConfigValid(config: unknown): config is OutputConfig {
    if (!config || typeof config !== 'object') return false;
    const candidate = config as OutputConfig;
    return ['csv', 'json', 'html'].includes(candidate.format) &&
      ['today', 'yesterday', 'day', 'week', 'month', 'all', 'custom'].includes(candidate.historyRange) &&
      (candidate.dateRange === null || isValidDateRange(candidate.dateRange)) &&
      !!candidate.fields && typeof candidate.fields === 'object' && !Array.isArray(candidate.fields) &&
      this.columnOrder.every((key) => Object.prototype.hasOwnProperty.call(candidate.fields, key) &&
        typeof candidate.fields[key] === 'boolean');
  }
}
