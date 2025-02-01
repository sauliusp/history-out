import { DateRange } from '../services/HistoryService';

export const getRangeFromType = (type: string): DateRange => {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  switch (type) {
    case 'day':
      return {
        startTime: now - DAY_MS,
        endTime: now,
      };
    case 'week':
      return {
        startTime: now - 7 * DAY_MS,
        endTime: now,
      };
    case 'month':
      return {
        startTime: now - 30 * DAY_MS,
        endTime: now,
      };
    case 'all':
      return {
        startTime: 0,
        endTime: now,
      };
    default:
      throw new Error('Invalid range type');
  }
};
