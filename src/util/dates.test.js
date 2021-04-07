import { createIntl, createIntlCache } from './reactIntl';
import {
  isDate,
  isSameDate,
  daysBetween,
  minutesBetween,
  formatDateWithProximity,
  formatDateIntoPartials,
  parseDateFromISO8601,
  stringifyDateToISO8601,
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
    it('should fail if end Date is before start Date', () => {
      const start = new Date(2017, 0, 2);
      const end = new Date(2017, 0, 1);
      expect(() => minutesBetween(start, end)).toThrow('End Date cannot be before start Date');
    });
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
});
