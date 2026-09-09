import { DateRange } from '../types/DateRange';
import { OutputConfig } from '../types/OutputConfig';
import { OutputHistoryItem } from '../types/OutputHistoryItem';

export const OUTPUT_COLUMNS: (keyof OutputHistoryItem)[] = [
  'order', 'id', 'date', 'time', 'title', 'url', 'visitCount', 'typedCount',
  'transition', 'timestamp', 'domain',
];

/** New columns are opt-in so upgrading does not change existing exports. */
export const DEFAULT_OUTPUT_CONFIG: OutputConfig = {
  format: 'csv',
  historyRange: 'today',
  dateRange: null,
  fields: {
    order: true, id: true, date: true, time: true, title: true, url: true,
    visitCount: true, typedCount: true, transition: true,
    timestamp: false, domain: false,
  },
};

export function isValidDateRange(value: unknown): value is DateRange {
  if (!value || typeof value !== 'object') return false;
  const range = value as DateRange;
  return Number.isFinite(range.startTime) && Number.isFinite(range.endTime) &&
    range.startTime >= 0 && range.endTime >= range.startTime &&
    range.endTime < 8.64e15;
}

/** Read only known preferences, preserving every valid v1 field selection. */
export function normalizeOutputConfig(value: unknown): OutputConfig {
  const candidate = value && typeof value === 'object'
    ? value as Partial<OutputConfig> : {};
  const format = ['csv', 'json', 'html'].includes(candidate.format || '')
    ? candidate.format! : DEFAULT_OUTPUT_CONFIG.format;
  const historyRange = ['today', 'yesterday', 'day', 'week', 'month', 'all', 'custom'].includes(candidate.historyRange || '')
    ? candidate.historyRange! : DEFAULT_OUTPUT_CONFIG.historyRange;
  const fields = { ...DEFAULT_OUTPUT_CONFIG.fields };
  if (candidate.fields && typeof candidate.fields === 'object' && !Array.isArray(candidate.fields)) {
    OUTPUT_COLUMNS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(candidate.fields, key) &&
          typeof candidate.fields![key] === 'boolean') {
        fields[key] = candidate.fields![key];
      }
    });
  }
  return {
    format,
    historyRange,
    dateRange: historyRange === 'custom' && isValidDateRange(candidate.dateRange)
      ? { startTime: candidate.dateRange.startTime, endTime: candidate.dateRange.endTime }
      : null,
    fields,
  };
}
