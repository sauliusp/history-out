export type HistoryRange = 'day' | 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  startTime: number;
  endTime: number;
}
