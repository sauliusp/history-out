import { DateRange } from './DateRange';
import { ExportFormat } from './ExportFormat';
import { HistoryRange } from './HistoryRange';
import { OutputHistoryItem } from './OutputHistoryItem';

export interface OutputConfig {
  format: ExportFormat;
  historyRange: HistoryRange;
  dateRange: DateRange | null;
  fields: Record<keyof OutputHistoryItem, boolean>;
}
