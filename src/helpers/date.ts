import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

export function previousWeek(date: Date, tz: string) {
  const startOfCurrentWeek = dayjs(date).tz(tz).startOf('isoWeek');

  return {
    start: startOfCurrentWeek.subtract(1, 'week'),
    end: startOfCurrentWeek.subtract(1, 'second')
  };
}

export function formatShortDate(date: Date, tz = 'UTC') {
  return dayjs(date).tz(tz).format('MMMM Do, YYYY');
}
