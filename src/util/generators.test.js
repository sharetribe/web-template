import { parseDateFromISO8601 } from './dates';
import {
  uniqueBy,
  pipe,
  map,
  availableRanges,
  generateDates,
  generateMonths,
  exceptionFreeSlotsPerDate,
  availabilityPerDate,
  timeSlotsPerDate,
} from './generators';

describe('generators and iterators', () => {
  describe('uniqueBy(arr, f)', () => {
    it('should remove duplicates according to given by-function', () => {
      const arr = [{ id: 1 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const uniqArr = uniqueBy(arr, x => x.id);
      expect(JSON.stringify(uniqArr)).toEqual(JSON.stringify(arr.slice(1)));
    });
    it('if given by-function does not find property, element is not included', () => {
      const arr = [{}, {}, { id: 2 }, { id: 3 }, { id: 4 }];
      const uniqArr = uniqueBy(arr, x => x.id);
      expect(JSON.stringify(uniqArr)).toEqual(JSON.stringify(arr.slice(2)));
    });
  });

  describe('pipe((x0, ...fns)', () => {
    it('should combine functions and apply them against first argument', () => {
      // 4*2*3
      const ret = pipe(
        4,
        x => x * 2,
        x => x * 3
      );
      expect(ret).toEqual(24);
    });
  });
  describe('map(f)', () => {
    it('should flatten and remove duplicates according to entity id', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const iterable = pipe(
        arr,
        map(x => x * 2)
      );
      const ret = [...iterable];
      const expectedResult = JSON.stringify([2, 4, 6, 8, 10, 12]);
      expect(JSON.stringify(ret)).toEqual(expectedResult);
    });
  });

  describe('availableRanges(start, end, exceptions)', () => {
    it('should ', () => {
      const exceptions = [
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 3, 0, 0, 0)),
          },
        },
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 10, 8, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 10, 17, 0, 0)),
          },
        },
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 15, 0, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 17, 0, 0, 0)),
          },
        },
      ];
      const exceptionFreeSlots = availableRanges(
        new Date(Date.UTC(2022, 11, 24, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 30, 0, 0, 0)),
        exceptions
      );
      const expectedResult = JSON.stringify([
        { start: '2022-12-24T00:00:00.000Z', end: '2023-01-01T00:00:00.000Z' },
        { start: '2023-01-03T00:00:00.000Z', end: '2023-01-10T08:00:00.000Z' },
        { start: '2023-01-10T17:00:00.000Z', end: '2023-01-15T00:00:00.000Z' },
        { start: '2023-01-17T00:00:00.000Z', end: '2023-01-30T00:00:00.000Z' },
      ]);
      expect(JSON.stringify(exceptionFreeSlots)).toEqual(expectedResult);
    });
  });

  describe('generateDates(start, end, timeZone)', () => {
    it('should return dates in UTC, when asked', () => {
      const arrayOfDateStrings = generateDates(
        parseDateFromISO8601('2022-12-01', 'Etc/UTC'),
        parseDateFromISO8601('2022-12-05', 'Etc/UTC'),
        'Etc/UTC'
      );

      const expectedResult = JSON.stringify([
        new Date('2022-12-01T00:00:00.000Z'),
        new Date('2022-12-02T00:00:00.000Z'),
        new Date('2022-12-03T00:00:00.000Z'),
        new Date('2022-12-04T00:00:00.000Z'),
      ]);

      expect(JSON.stringify(arrayOfDateStrings)).toEqual(expectedResult);
    });
    it('should return dates in "Europe/Helsinki", when asked', () => {
      const arrayOfDateStrings = generateDates(
        parseDateFromISO8601('2022-12-01', 'Europe/Helsinki'),
        parseDateFromISO8601('2022-12-05', 'Europe/Helsinki'),
        'Europe/Helsinki'
      );

      // Helsinki is -2 hours off from UTC on winter
      const expectedResult = JSON.stringify([
        new Date('2022-11-30T22:00:00.000Z'),
        new Date('2022-12-01T22:00:00.000Z'),
        new Date('2022-12-02T22:00:00.000Z'),
        new Date('2022-12-03T22:00:00.000Z'),
      ]);
      expect(JSON.stringify(arrayOfDateStrings)).toEqual(expectedResult);
    });
  });

  describe('generateMonths(start, end, timeZone)', () => {
    it('should return dates in UTC, when asked', () => {
      const arrayOfDateStrings = generateMonths(
        parseDateFromISO8601('2022-12-01', 'Etc/UTC'),
        parseDateFromISO8601('2023-03-05', 'Etc/UTC'),
        'Etc/UTC'
      );

      const expectedResult = JSON.stringify([
        new Date('2022-12-01T00:00:00.000Z'),
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-02-01T00:00:00.000Z'),
        new Date('2023-03-01T00:00:00.000Z'),
      ]);

      expect(JSON.stringify(arrayOfDateStrings)).toEqual(expectedResult);
    });
    it('should return dates in "Europe/Helsinki", when asked', () => {
      const arrayOfDateStrings = generateMonths(
        parseDateFromISO8601('2022-12-01', 'Europe/Helsinki'),
        parseDateFromISO8601('2023-03-05', 'Europe/Helsinki'),
        'Europe/Helsinki'
      );

      // Helsinki is -2 hours off from UTC on winter
      const expectedResult = JSON.stringify([
        new Date('2022-11-30T22:00:00.000Z'),
        new Date('2022-12-31T22:00:00.000Z'),
        new Date('2023-01-31T22:00:00.000Z'),
        new Date('2023-02-28T22:00:00.000Z'),
      ]);
      expect(JSON.stringify(arrayOfDateStrings)).toEqual(expectedResult);
    });
  });

  describe('exceptionFreeSlotsPerDate(start, end, exceptions, timeZone)', () => {
    it('should return dates until exclusive endin given tz, and mapping available slots inside', () => {
      const exceptions = [
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 3, 0, 0, 0)),
          },
        },
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 6, 8, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 6, 17, 0, 0)),
          },
        },
        {
          attributes: {
            start: new Date(Date.UTC(2023, 0, 9, 0, 0, 0)),
            end: new Date(Date.UTC(2023, 0, 11, 0, 0, 0)),
          },
        },
      ];

      const arrayOfDateStrings = exceptionFreeSlotsPerDate(
        parseDateFromISO8601('2023-01-02', 'Europe/Helsinki'),
        parseDateFromISO8601('2023-01-10', 'Europe/Helsinki'),
        exceptions,
        'Europe/Helsinki'
      );

      // Helsinki is -2 hours off from UTC on winter
      const expectedResult = JSON.stringify({
        '2023-01-02': { slots: [] },
        '2023-01-03': {
          slots: [
            {
              start: new Date('2023-01-03T00:00:00.000Z'),
              end: new Date('2023-01-06T08:00:00.000Z'),
            },
          ],
        },
        '2023-01-04': {
          slots: [
            {
              start: new Date('2023-01-03T00:00:00.000Z'),
              end: new Date('2023-01-06T08:00:00.000Z'),
            },
          ],
        },
        '2023-01-05': {
          slots: [
            {
              start: new Date('2023-01-03T00:00:00.000Z'),
              end: new Date('2023-01-06T08:00:00.000Z'),
            },
          ],
        },
        '2023-01-06': {
          slots: [
            {
              start: new Date('2023-01-03T00:00:00.000Z'),
              end: new Date('2023-01-06T08:00:00.000Z'),
            },
            {
              start: new Date('2023-01-06T17:00:00.000Z'),
              end: new Date('2023-01-09T22:00:00.000Z'),
            },
          ],
        },
        '2023-01-07': {
          slots: [
            {
              start: new Date('2023-01-06T17:00:00.000Z'),
              end: new Date('2023-01-09T22:00:00.000Z'),
            },
          ],
        },
        '2023-01-08': {
          slots: [
            {
              start: new Date('2023-01-06T17:00:00.000Z'),
              end: new Date('2023-01-09T22:00:00.000Z'),
            },
          ],
        },
        '2023-01-09': {
          slots: [
            {
              start: new Date('2023-01-06T17:00:00.000Z'),
              end: new Date('2023-01-09T22:00:00.000Z'),
            },
          ],
        },
      });
      expect(JSON.stringify(arrayOfDateStrings)).toEqual(expectedResult);
    });
  });

  describe('availabilityPerDate(start, end, plan, exceptions)', () => {
    it('should return dates until end date, and map entries, exceptions to them', () => {
      const start = parseDateFromISO8601('2023-01-02', 'Europe/Helsinki'); // Monday
      const end = parseDateFromISO8601('2023-01-05', 'Europe/Helsinki'); // Wednesday
      const plan = {
        type: 'availability-plan/time',
        timezone: 'Europe/Helsinki',
        entries: [
          { dayOfWeek: 'mon', startTime: '09:00', endTime: '17:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '09:00', endTime: '12:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '13:00', endTime: '17:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
        ],
      };
      const exceptions = [
        {
          attributes: {
            start: parseDateFromISO8601('2023-01-02', 'Europe/Helsinki'),
            end: parseDateFromISO8601('2023-01-03', 'Europe/Helsinki'),
            seats: 0,
          },
        },
        {
          attributes: {
            start: new Date('2023-01-03T08:00:00.000Z'), // 10 am in Europe/Helsinki
            end: new Date('2023-01-03T11:00:00.000Z'), // 1 pm in Europe/Helsinki
            seats: 0,
          },
        },
      ];

      // prettier-ignore
      const expectedResult = JSON.stringify({
        "2023-01-02": {
          "id": "2023-01-02",
          "planEntries": [{ "dayOfWeek": "mon", "startTime": "09:00", "endTime": "17:00", "seats": 1 }],
          "exceptions": [{ "attributes": { "start": "2023-01-01T22:00:00.000Z", "end": "2023-01-02T22:00:00.000Z", "seats": 0 } }],
          "ranges": [
            {
              "start": "2023-01-01T22:00:00.000Z",
              "end": "2023-01-02T22:00:00.000Z",
              "seats": 0,
              "exception": {
                "attributes": {
                  "start": "2023-01-01T22:00:00.000Z",
                  "end": "2023-01-02T22:00:00.000Z",
                  "seats": 0
                }
              }
            }
          ],
          "hasAvailability": false
        },
        "2023-01-03": {
          "id": "2023-01-03",
          "planEntries": [
            { "dayOfWeek": "tue", "startTime": "09:00", "endTime": "12:00", "seats": 1 },
            { "dayOfWeek": "tue", "startTime": "13:00", "endTime": "17:00", "seats": 1 },
          ],
          "exceptions": [{ "attributes": { "start": "2023-01-03T08:00:00.000Z", "end": "2023-01-03T11:00:00.000Z", "seats": 0 } }],
          "ranges": [
            {
              "start": "2023-01-02T22:00:00.000Z",
              "end": "2023-01-03T07:00:00.000Z",
              "seats": 0
            },
            {
              "start": "2023-01-03T07:00:00.000Z",
              "end": "2023-01-03T08:00:00.000Z",
              "seats": 1,
              "plan": {
                "start": "2023-01-03T07:00:00.000Z",
                "end": "2023-01-03T10:00:00.000Z",
                "seats": 1
              }
            },
            {
              "start": "2023-01-03T08:00:00.000Z",
              "end": "2023-01-03T11:00:00.000Z",
              "seats": 0,
              "exception": {
                "attributes": {
                  "start": "2023-01-03T08:00:00.000Z",
                  "end": "2023-01-03T11:00:00.000Z",
                  "seats": 0
                }
              }
            },
            {
              "start": "2023-01-03T11:00:00.000Z",
              "end": "2023-01-03T15:00:00.000Z",
              "seats": 1,
              "plan": {
                "start": "2023-01-03T11:00:00.000Z",
                "end": "2023-01-03T15:00:00.000Z",
                "seats": 1
              }
            },
            {
              "start": "2023-01-03T15:00:00.000Z",
              "end": "2023-01-03T22:00:00.000Z",
              "seats": 0
            }
          ],
          "hasAvailability": true
        },
        "2023-01-04": {
          "id": "2023-01-04",
          "planEntries": [{ "dayOfWeek": "wed", "startTime": "00:00", "endTime": "00:00", "seats": 1 }],
          "exceptions": [],
          "ranges": [
            {
              "start": "2023-01-03T22:00:00.000Z",
              "end": "2023-01-04T22:00:00.000Z",
              "seats": 1,
              "plan": {
                "start": "2023-01-03T22:00:00.000Z",
                "end": "2023-01-04T22:00:00.000Z",
                "seats": 1
              }
            }
          ],
          "hasAvailability": true
        }
      });

      const dateInfoHashMap = availabilityPerDate(start, end, plan, exceptions);
      expect(JSON.stringify(dateInfoHashMap)).toEqual(expectedResult);
    });
  });

  describe('timeSlotsPerDate(start, end, timeSlots, timeZone, options)', () => {
    it('should return dates until end date, and map entries, exceptions to them', () => {
      const start = parseDateFromISO8601('2023-01-02', 'Europe/Helsinki'); // Monday
      const end = parseDateFromISO8601('2023-01-05', 'Europe/Helsinki'); // Wednesday
      const timeZone = 'Europe/Helsinki';
      const options = { seats: 1 };

      const timeSlots = [
        {
          attributes: {
            start: parseDateFromISO8601('2023-01-02', 'Europe/Helsinki'),
            end: parseDateFromISO8601('2023-01-03', 'Europe/Helsinki'),
            seats: 1,
          },
        },
        {
          attributes: {
            start: new Date('2023-01-03T08:00:00.000Z'), // 10 am in Europe/Helsinki
            end: new Date('2023-01-03T11:00:00.000Z'), // 1 pm in Europe/Helsinki
            seats: 1,
          },
        },
      ];

      // prettier-ignore
      const expectedResult = JSON.stringify({
        "2023-01-02": {
          "id": "2023-01-02",
          "timeSlots": [
            {
              "attributes": {
                "start": "2023-01-01T22:00:00.000Z",
                "end": "2023-01-02T22:00:00.000Z",
                "seats": 1
              }
            }
          ],
          "hasAvailability": true
        },
        "2023-01-03": {
          "id": "2023-01-03",
          "timeSlots": [
            {
              "attributes": {
                "start": "2023-01-03T08:00:00.000Z",
                "end": "2023-01-03T11:00:00.000Z",
                "seats": 1
              }
            }
          ],
          "hasAvailability": true
        },
        "2023-01-04": {
          "id": "2023-01-04",
          "timeSlots": [],
          "hasAvailability": false
        }
      });

      const dateInfoHashMap = timeSlotsPerDate(start, end, timeSlots, timeZone, options);
      expect(JSON.stringify(dateInfoHashMap)).toEqual(expectedResult);
    });
  });
});
