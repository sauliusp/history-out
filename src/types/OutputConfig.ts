import { DateRange } from './DateRange';
import { ExportFormat } from './ExportFormat';
import { HistoryRange } from './HistoryRange';
import { OutputHistoryItem } from './OutputHistoryItem';

export interface OutputConfig {
  format: ExportFormat;
  historyRange: HistoryRange;
  dateRange: DateRange | null;
  fields: {
    [K in keyof OutputHistoryItem]: boolean;
  };
}
