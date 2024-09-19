import { createIntl, createIntlCache } from './reactIntl';
import {
  getTimeZoneNames,
  isDate,
  isSameDate,
  isSameDay,
  isInRange,
  getStartOf,
  daysBetween,
  minutesBetween,
  diffInTime,
  formatDateWithProximity,
  formatDateIntoPartials,
  parseDateFromISO8601,
  parseDateTimeString,
  stringifyDateToISO8601,
  findNextBoundary,
  getSharpHours,
  getStartHours,
  getEndHours,
  monthIdString,
  getStartOfWeek,
} from './dates';

describe('date utils', () => {
  const cache = createIntlCache();
  const intl = createIntl(
    {
      locale: 'en-US',
      messages: {},
    },
    cache
  );
  // Tests inject now() function to intl wich returns predefined date
  // Note: fakeIntl uses this same moment
  intl.now = () => Date.UTC(2017, 10, 23, 12, 59);

  describe('getTimeZoneNames()', () => {
    it('should return false if parameters is string', () => {
      const europeZonesPattern = new RegExp('^(Europe)');
      const europeTimeZones = getTimeZoneNames(europeZonesPattern);
      expect(europeTimeZones.includes('America/New_York')).toBeFalsy();
    });
    it('should return "Europe/Helsinki" if Europe time zones are returned', () => {
      const europeZonesPattern = new RegExp('^(Europe)');
      const europeTimeZones = getTimeZoneNames(europeZonesPattern);
      expect(europeTimeZones.includes('Europe/Helsinki')).toBeTruthy();
    });
  });

  describe('isDate()', () => {
    it('should return false if parameters is string', () => {
      expect(isDate('Monday')).toBeFalsy();
    });
    it('should return false if parameters is number', () => {
      expect(isDate('1546293600000')).toBeFalsy();
    });
    it('should return false if parameters is incorrect Date', () => {
      expect(isDate(new Date('random string'))).toBeFalsy();
    });
    it('should return true if parameters is Date', () => {
      expect(isDate(new Date(1546293600000))).toBeTruthy();
    });
  });

  describe('isSameDate()', () => {
    it('should return falsy if parameters do not match', () => {
      const a = new Date(1546293600000);
      const b = new Date(1546293600001);
      expect(isSameDate(a, b)).toBeFalsy();
    });
    it('should be truthy if parameters match', () => {
      expect(isSameDate(new Date(2019, 0, 1), new Date(2019, 0, 1))).toBeTruthy();
    });
  });

  describe('isSameDay()', () => {
    it('should fail if the dates are pointing to different days', () => {
      const d1 = new Date(Date.UTC(2019, 0, 1, 10, 0, 0));
      const d2 = new Date(Date.UTC(2019, 0, 2, 10, 0, 0));
      expect(isSameDay(d1, d2, 'Etc/UTC')).toBeFalsy();

      // 1 second difference around midnight
      const d3 = new Date(Date.UTC(2019, 0, 1, 23, 59, 59));
      const d4 = new Date(Date.UTC(2019, 0, 2, 0, 0, 0));
      expect(isSameDay(d3, d4, 'Etc/UTC')).toBeFalsy();
    });
    it('should succeed if the dates are pointing to the same days', () => {
      const d1 = new Date(Date.UTC(2019, 0, 1, 10, 0, 0));
      const d2 = new Date(Date.UTC(2019, 0, 1, 10, 0, 0));
      expect(isSameDay(d1, d2, 'Etc/UTC')).toBeTruthy();
    });
  });

  describe('isInRange()', () => {
    const d1 = new Date(Date.UTC(2019, 0, 1, 10, 0, 0));
    const d2 = new Date(Date.UTC(2019, 0, 2, 10, 0, 0));
    let undefined;

    it('should fail if day is wrong', () => {
      const date = new Date(Date.UTC(2019, 0, 3, 10, 0, 0));
      expect(isInRange(date, d1, d2, 'day', 'Etc/UTC')).toBeFalsy();
    });

    it('should fail if date is same as exclusive end', () => {
      expect(isInRange(d2, d1, d2, undefined, 'Etc/UTC')).toBeFalsy();
    });

    it('should succeed if date is same as inclusive end', () => {
      const inclusiveEnd = new Date(d2.getTime() - 1);
      expect(isInRange(inclusiveEnd, d1, d2, undefined, 'Etc/UTC')).toBeTruthy();
    });

    it('should fail if day is same as exclusive end', () => {
      const d3 = new Date(Date.UTC(2019, 0, 2, 0, 0, 0));
      expect(isInRange(d3, d1, d3, 'day', 'Etc/UTC')).toBeFalsy();
    });

    it('should succeed if day is same as inclusive start', () => {
      expect(isInRange(d1, d1, d2, 'day', 'Etc/UTC')).toBeTruthy();
    });

    it('should succeed if date is same as the beginning of start day', () => {
      const date = new Date(Date.UTC(2019, 0, 1, 0, 0, 0));
      expect(isInRange(date, d1, d2, 'day', 'Etc/UTC')).toBeTruthy();
    });

    it('should succeed if date is same as the end of start day', () => {
      const date = new Date(Date.UTC(2019, 0, 1, 23, 59, 59));
      expect(isInRange(date, d1, d2, 'day', 'Etc/UTC')).toBeTruthy();
    });
  });

  describe('getStartOf()', () => {
    const date = new Date(Date.UTC(2019, 0, 1, 10, 0, 0));

    it('should find start of day in UTC', () => {
      const beginningOfDay = new Date(Date.UTC(2019, 0, 1, 0, 0, 0));
      expect(getStartOf(date, 'day', 'Etc/UTC')).toEqual(beginningOfDay);
    });

    it('should find start of day in Europe/Helsinki', () => {
      const beginningOfDayInHelsinki = new Date(Date.UTC(2018, 11, 31, 22, 0, 0));
      expect(getStartOf(date, 'day', 'Europe/Helsinki')).toEqual(beginningOfDayInHelsinki);
    });

    it('should find start of day with offset in Etc/UTC', () => {
      const twoDaysOff = new Date(Date.UTC(2019, 0, 3, 0, 0, 0));
      expect(getStartOf(date, 'day', 'Etc/UTC', 2, 'days')).toEqual(twoDaysOff);
    });

    it('should find start of previous month with offset in Etc/UTC', () => {
      const date = new Date(Date.UTC(2022, 2, 1, 10, 0, 0));
      const prevMonth = new Date(Date.UTC(2022, 1, 1, 0, 0, 0));
      expect(getStartOf(date, 'month', 'Etc/UTC', -1, 'months')).toEqual(prevMonth);
    });

    it('should find start of next month with offset in Etc/UTC', () => {
      const date = new Date(Date.UTC(2022, 2, 1, 10, 0, 0));
      const nextMonth = new Date(Date.UTC(2022, 3, 1, 0, 0, 0));
      expect(getStartOf(date, 'month', 'Etc/UTC', 1, 'months')).toEqual(nextMonth);
    });
  });

  describe('daysBetween()', () => {
    it('should fail if end date is before start date', () => {
      const start = new Date(2017, 0, 2);
      const end = new Date(2017, 0, 1);
      expect(() => daysBetween(start, end)).toThrow('End date cannot be before start date');
    });
    it('should handle equal start and end dates', () => {
      const d = new Date(2017, 0, 1);
      expect(daysBetween(d, d)).toEqual(0);
    });
    it('should calculate night count for a single day', () => {
      const start = new Date(2017, 0, 1);
      const end = new Date(2017, 0, 2);
      expect(daysBetween(start, end)).toEqual(1);
    });
    it('should calculate day count', () => {
      const start = new Date(2017, 0, 1);
      const end = new Date(2017, 0, 3);
      expect(daysBetween(start, end)).toEqual(2);
    });
  });

  describe('minutesBetween()', () => {
    it('should handle equal start and end Dates', () => {
      const d = new Date(2017, 0, 1, 10, 35, 0);
      expect(minutesBetween(d, d)).toEqual(0);
    });
    it('should calculate minutes count for one hour', () => {
      const start = new Date(2017, 0, 1, 10, 35, 0);
      const end = new Date(2017, 0, 1, 11, 35, 0);
      expect(minutesBetween(start, end)).toEqual(60);
    });
    it('should calculate minutes', () => {
      const start = new Date(2017, 0, 1, 10, 35, 0);
      const end = new Date(2017, 0, 1, 10, 55, 0);
      expect(minutesBetween(start, end)).toEqual(20);
    });
  });

  describe('diffInTime()', () => {
    it('should calculate 18 years between 2000-01-01 and 2018-01-01', () => {
      const birth = new Date(Date.UTC(2000, 0, 1));
      const now = new Date(Date.UTC(2018, 0, 1));
      expect(diffInTime(now, birth, 'years', true)).toEqual(18);
    });
  });

  describe('formatDateWithProximity()', () => {
    it('formats a date today', () => {
      const d = new Date(Date.UTC(2017, 10, 23, 13, 51));
      expect(formatDateWithProximity(d, intl, 'Today', { timeZone: 'Etc/UTC' })).toEqual(
        'Today, 1:51 PM'
      );
    });
    it('formats a date on same week', () => {
      const d = new Date(Date.UTC(2017, 10, 22, 13, 51));
      expect(formatDateWithProximity(d, intl, 'Today', { timeZone: 'Etc/UTC' })).toEqual(
        'Wed 1:51 PM'
      );
    });
    it('formats a date on same year', () => {
      const d = new Date(Date.UTC(2017, 10, 2, 13, 51));
      expect(formatDateWithProximity(d, intl, 'Today', { timeZone: 'Etc/UTC' })).toEqual(
        'Nov 2, 1:51 PM'
      );
    });
    it('formats a date on different year', () => {
      const d = new Date(Date.UTC(2020, 10, 2, 13, 51));
      expect(formatDateWithProximity(d, intl, 'Today', { timeZone: 'Etc/UTC' })).toEqual(
        'Nov 2, 2020, 1:51 PM'
      );
    });
    it('formats 2017-11-23 00:00 UTC as "Wed 7:00 PM" in New York tz. (I.e. not as "Today, 12:00 AM")', () => {
      const d = new Date(Date.UTC(2017, 10, 23, 0, 0));
      expect(formatDateWithProximity(d, intl, 'Today', { timeZone: 'America/New_York' })).toEqual(
        'Wed 7:00 PM'
      );
    });
  });

  describe('formatDateIntoPartials()', () => {
    it('formats a date into its partials', () => {
      const d = new Date(Date.UTC(2017, 10, 23, 13, 51));
      const partials = formatDateIntoPartials(d, intl, { timeZone: 'Etc/UTC' });
      expect(partials.time).toEqual('1:51 PM');
      expect(partials.date).toEqual('Nov 23');
      expect(partials.dateAndTime).toEqual('Nov 23, 1:51 PM');
    });
  });

  describe('parseDateFromISO8601()', () => {
    it('should return date', () => {
      const dateString = '2018-11-23';
      const date = new Date(2018, 10, 23);
      expect(parseDateFromISO8601(dateString)).toEqual(date);
    });

    it('should read ISO 8601 date as date in Etc/UTC and return date and time in UTC formatted ISO 8601', () => {
      expect(parseDateFromISO8601('2020-04-07', 'Etc/UTC').toISOString()).toEqual(
        '2020-04-07T00:00:00.000Z'
      );
    });

    it('should read ISO 8601 date as date in Europe/Helsinki and return date and time in UTC formetted ISO 8601', () => {
      expect(parseDateFromISO8601('2020-02-07', 'Europe/Helsinki').toISOString()).toEqual(
        '2020-02-06T22:00:00.000Z'
      );
    });
  });

  describe('parseDateTimeString()', () => {
    it('should return date', () => {
      const dateTimeString = '2018-11-23 14:00';
      const date = new Date(2018, 10, 23, 14, 0, 0);
      expect(parseDateTimeString(dateTimeString)).toEqual(date);
    });

    it('should read ISO 8601 date as date in Etc/UTC and return date and time in UTC formatted ISO 8601', () => {
      expect(parseDateTimeString('2020-04-07 01:00', 'Etc/UTC').toISOString()).toEqual(
        '2020-04-07T01:00:00.000Z'
      );
    });

    it('should read ISO 8601 date as date in Europe/Helsinki and return date and time in UTC formetted ISO 8601', () => {
      expect(parseDateTimeString('2020-02-07 01:00', 'Europe/Helsinki').toISOString()).toEqual(
        '2020-02-06T23:00:00.000Z'
      );
    });
  });

  describe('stringifyDateToISO8601()', () => {
    it('should return string in YYYY-MM-DD format', () => {
      const date = new Date(2018, 10, 23);
      expect(stringifyDateToISO8601(date)).toEqual('2018-11-23');
    });

    it('should read given date in Etc/UTC and return ISO 8601 date string', () => {
      expect(stringifyDateToISO8601(new Date('2020-04-07T00:00:00.000Z'), 'Etc/UTC')).toEqual(
        '2020-04-07'
      );
    });

    it('should read given date in Europe/Helsinki and return ISO 8601 date string', () => {
      expect(
        stringifyDateToISO8601(new Date('2020-02-06T22:00:00.000Z'), 'Europe/Helsinki')
      ).toEqual('2020-02-07');
    });

    it('should read given date in America/New_York and return ISO 8601 date string', () => {
      const date = new Date(Date.UTC(2020, 3, 7));
      // UTC 2020-04-07 00:00 is previous day in New York
      expect(stringifyDateToISO8601(date, 'America/New_York')).toEqual('2020-04-06');
    });
  });

  describe('findNextBoundary()', () => {
    it('should return 01:00 as next boundary when starting from 00:45', () => {
      expect(findNextBoundary(new Date('2019-09-18T00:45:00.000Z'), 'hour', 'Etc/UTC')).toEqual(
        new Date('2019-09-18T01:00:00.000Z')
      );
    });
    it('should return 02:00 as next boundary when starting from 01:00', () => {
      expect(findNextBoundary(new Date('2019-09-18T01:00:00.000Z'), 'hour', 'Etc/UTC')).toEqual(
        new Date('2019-09-18T02:00:00.000Z')
      );
    });
  });

  describe('getSharpHours()', () => {
    it('should return sharp hours, when startTime and endTime are sharp hours', () => {
      const startHour = new Date('2019-09-18T08:00:00.000Z');
      const endHour = new Date('2019-09-18T09:00:00.000Z');
      expect(getSharpHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([
        { timestamp: 1568793600000, timeOfDay: '11:00 AM' },
        { timestamp: 1568797200000, timeOfDay: '12:00 PM' },
      ]);
    });
    it('should return sharp hours, when startTime and endTime are half hours', () => {
      const startHour = new Date('2019-09-18T08:30:00.000Z');
      const endHour = new Date('2019-09-18T09:30:00.000Z');
      expect(getSharpHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([
        { timestamp: 1568797200000, timeOfDay: '12:00 PM' },
      ]);
    });
  });

  describe('getStartHours()', () => {
    it('should return sharp hours, when startTime and endTime are sharp hours', () => {
      const startHour = new Date('2019-09-18T08:00:00.000Z');
      const endHour = new Date('2019-09-18T09:00:00.000Z');
      expect(getStartHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([
        { timestamp: 1568793600000, timeOfDay: '11:00 AM' },
      ]);
    });
    it('should return sharp hours, when startTime and endTime are half hours', () => {
      const startHour = new Date('2019-09-18T08:30:00.000Z');
      const endHour = new Date('2019-09-18T09:30:00.000Z');
      expect(getStartHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([
        { timestamp: 1568797200000, timeOfDay: '12:00 PM' },
      ]);
    });
  });

  describe('getEndHours()', () => {
    it('should return sharp hours, when startTime and endTime are sharp hours', () => {
      const startHour = new Date('2019-09-18T08:00:00.000Z');
      const endHour = new Date('2019-09-18T09:00:00.000Z');
      expect(getEndHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([
        { timestamp: 1568797200000, timeOfDay: '12:00 PM' },
      ]);
    });
    it('should return sharp hours, when startTime and endTime are half hours', () => {
      const startHour = new Date('2019-09-18T08:30:00.000Z');
      const endHour = new Date('2019-09-18T09:30:00.000Z');
      expect(getEndHours(startHour, endHour, 'Europe/Helsinki', intl)).toEqual([]);
    });
  });

  describe('monthIdString()', () => {
    it('should return string in YYYY-MM format without timeZone param', () => {
      const date = new Date(2018, 10, 23);
      expect(monthIdString(date)).toContain('2018-11');
    });

    it('should return string in YYYY-MM format with timeZone param', () => {
      const date = new Date(2018, 10, 23);
      expect(monthIdString(date, 'Etc/UTC')).toEqual('2018-11');
    });

    it('should return string in YYYY-MM format with Etc/UTC tz to equal moment(date).utc().format("YYYY-MM")', () => {
      const date = new Date(2018, 10, 23);
      const pad = num => {
        return num >= 0 && num < 10 ? `0${num}` : `${num}`;
      };
      expect(monthIdString(date, 'Etc/UTC')).toEqual(
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`
      );
    });
  });

  describe('getStartOfWeek(date, timeZone, firstDayOfWeek)', () => {
    it('should return the start of week', () => {
      let firstDayOfWeek = 1; // Monday
      let startOfWeek = getStartOfWeek(
        new Date('2023-01-01T08:30:00.000Z'),
        'Etc/UTC',
        firstDayOfWeek
      );
      const expectedMonday = new Date('2022-12-26T00:00:00.000Z');
      expect(startOfWeek).toEqual(expectedMonday);

      firstDayOfWeek = 0; // Sunday
      startOfWeek = getStartOfWeek(new Date('2023-01-01T08:30:00.000Z'), 'Etc/UTC', firstDayOfWeek);
      const expectedSunday = new Date('2023-01-01T00:00:00.000Z');
      expect(startOfWeek).toEqual(expectedSunday);

      firstDayOfWeek = 6; // Saturday
      startOfWeek = getStartOfWeek(new Date('2023-01-01T08:30:00.000Z'), 'Etc/UTC', firstDayOfWeek);
      const expectedSaturday = new Date('2022-12-31T00:00:00.000Z');
      expect(startOfWeek).toEqual(expectedSaturday);
    });
  });
});
