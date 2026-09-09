import { DateRange } from '../types/DateRange';

/** Calendar presets use the same local time zone as the displayed visit dates. */
export const getRangeFromType = (type: string, now: number = Date.now()): DateRange => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  switch (type) {
    case 'today':
      return { startTime: today.getTime(), endTime: now };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startTime: yesterday.getTime(), endTime: today.getTime() - 1 };
    }
    case 'day':
      return { startTime: now - DAY_MS, endTime: now };
    case 'week':
      return { startTime: now - 7 * DAY_MS, endTime: now };
    case 'month':
      return { startTime: now - 30 * DAY_MS, endTime: now };
    case 'all':
      return { startTime: 0, endTime: now };
    default:
      throw new Error('Invalid range type');
  }
};
