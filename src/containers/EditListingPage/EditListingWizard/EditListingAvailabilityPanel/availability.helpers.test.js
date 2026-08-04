import {
  getParsedHourMinutes,
  getTotalMinutesFromTime,
  compareEntriesByStartTime,
} from './availability.helpers';

describe('availability helpers', () => {
  describe('getParsedHourMinutes(time)', () => {
    it('should parse hour and minutes from a "HH:MM" string', () => {
      expect(getParsedHourMinutes('09:05')).toEqual({ hour: 9, minutes: 5 });
      expect(getParsedHourMinutes('23:45')).toEqual({ hour: 23, minutes: 45 });
    });

    it('should parse the "24:00" end-of-day sentinel', () => {
      expect(getParsedHourMinutes('24:00')).toEqual({ hour: 24, minutes: 0 });
    });
  });

  describe('getTotalMinutesFromTime(time)', () => {
    it('should return total minutes since midnight', () => {
      expect(getTotalMinutesFromTime('00:00')).toEqual(0);
      expect(getTotalMinutesFromTime('09:05')).toEqual(545);
      expect(getTotalMinutesFromTime('12:15')).toEqual(735);
    });

    it('should return 1440 for the "24:00" end-of-day sentinel', () => {
      expect(getTotalMinutesFromTime('24:00')).toEqual(1440);
    });
  });

  describe('compareEntriesByStartTime(defaultCompareReturn)', () => {
    it('should sort entries that share an hour but differ in minutes', () => {
      const entries = [
        { startTime: '12:30', endTime: '12:45', seats: 1 },
        { startTime: '12:00', endTime: '12:15', seats: 1 },
        { startTime: '12:15', endTime: '12:30', seats: 1 },
      ];
      const sorted = [...entries].sort(compareEntriesByStartTime());
      expect(sorted.map(e => e.startTime)).toEqual(['12:00', '12:15', '12:30']);
    });

    it('should sort entries across different hours', () => {
      const entries = [
        { startTime: '06:00', endTime: '08:00', seats: 1 },
        { startTime: '02:00', endTime: '04:00', seats: 1 },
      ];
      const sorted = [...entries].sort(compareEntriesByStartTime());
      expect(sorted.map(e => e.startTime)).toEqual(['02:00', '06:00']);
    });

    it('should return the given default value when either entry has no startTime', () => {
      const unset = { startTime: null, endTime: null };
      const set = { startTime: '09:00', endTime: '10:00' };
      expect(compareEntriesByStartTime()(unset, set)).toEqual(0);
      expect(compareEntriesByStartTime(-1)(unset, set)).toEqual(-1);
    });
  });
});
