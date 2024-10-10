import {
  isAfterDate,
  isInRange,
  getDayOfWeek,
  getStartOf,
  stringifyDateToISO8601,
  parseDateTimeString,
} from './dates.js';
// NOTE: This file imports sanitize.js, which may lead to circular dependency

// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Omit duplicates from given array according to function
 * that identifies relevant data.
 *
 * @param {Array} arr an array over which the uniqueness is applied
 * @param {function} f function to extract data that should be unique.
 * @returns array with desired properties being unique.
 */
export const uniqueBy = (arr, f) => {
  var unique = {};
  return arr.reduce((distinct, x) => {
    var key = f(x);
    if (key != null && !unique[key]) {
      unique[key] = true;
      return [...distinct, x];
    }
    return distinct;
  }, []);
};

/**
 * Pipe initial state through given functions
 * Initial state is the first argument x0.
 * Other arguments should be functions: f3(f2(f1(x0)))
 *
 * @param {iterable} x0 initial state
 * @param  {...functions} fns functions that are applied.
 * @returns
 */
export const pipe = (x0, ...fns) => fns.reduce((x, f) => f(x), x0);

/**
 * Yield iterable items through given function.
 *
 * @param {function} f carried function for the generator items.
 * @returns generator function that assumes iterable over which "f" is applied.
 */
export const map = f =>
  function*(iterable) {
    for (let x of iterable) {
      yield f(x);
    }
  };

const getMillis = d => d.getTime();
const pastException = (x, startInMillis, endInMillis) =>
  getMillis(x.attributes.start) <= startInMillis && getMillis(x.attributes.end) < endInMillis;
const exceptionInRange = (x, startInMillis, endInMillis) =>
  startInMillis < getMillis(x.attributes.start) && getMillis(x.attributes.end) < endInMillis;

/**
 * Generates inverted time slots between start and end
 * from iterable that goes through AvailabilityExceptions
 *
 * @param {Date} start start of time slot
 * @param {Date} end exclusive end for the time slot inversion
 * @returns generator function that generates new time slots that doesn't have exception inside.
 */
const invertedRangesFromExceptions = (start, end) =>
  function*(iterable) {
    // Range start and end in milliseconds
    const startInMillis = getMillis(start);
    const endInMillis = getMillis(end);
    let currentStartInMillis = startInMillis;
    // Iterate over eXceptions
    for (let x of iterable) {
      if (pastException(x, currentStartInMillis, endInMillis)) {
        // Inconsequential past exception or range starts with an exception
        // Move start index
        currentStartInMillis = getMillis(x.attributes.end);
      } else if (exceptionInRange(x, currentStartInMillis, endInMillis)) {
        // Exception is completely inside the range
        yield { start: new Date(currentStartInMillis), end: new Date(x.attributes.start) };
        // Move start index
        currentStartInMillis = getMillis(x.attributes.end);
      } else {
        // Exception.start in range, but exception.end happens after the end of the range
        yield { start: new Date(currentStartInMillis), end: new Date(end) };
        return;
      }
    }

    // If iterable is completed, but there's still pending "currentStartInMillis",
    // yeald it with given end.
    if (currentStartInMillis < endInMillis) {
      yield { start: new Date(currentStartInMillis), end };
    }
  };

/**
 * Creates exception free time slots. Those slots are free for new exceptions (no clash).
 *
 * @param {Date} start of time range against which free slots are considered
 * @param {Date} end of time range against which free slots are considered
 * @param {Array<AvailabilityException>} exceptions
 * @returns Array of { start, end } objects.
 */
export const availableRanges = (start, end, exceptions) => {
  const availableRanges = pipe(
    exceptions,
    invertedRangesFromExceptions(start, end)
  );
  return [...availableRanges];
};

/**
 *
 * @param {Date} start of generated Date objects
 * @param {String} unit unit that moment library understands (e.g. 'day')
 * @param {String} timeZone IANA time zone key
 * @param {Function} untilFn function to determine, when to stop generator.
 * @param {Integer} step when the next yielded Date object should be pointing at.
 * @param {String} stepUnit step unit that moment library understands (e.g. 'days')
 */
const timeUnitGenerator = function*(start, unit, timeZone, untilFn, step = 1, stepUnit = 'days') {
  let s = getStartOf(start, unit, timeZone);
  const defaultEnd = () => true;
  const testEnd = untilFn || defaultEnd;

  while (testEnd(s)) {
    yield s;
    s = getStartOf(s, unit, timeZone, step, stepUnit);
  }
};

/**
 * Generates Date between given range on desired time zone.
 * Note: end is exclusive
 *
 * @param {Date} start of desired date range
 * @param {Date} end of desired date range
 * @param {String} timeZone IANA time zone key
 * @returns An array of date objects in desired time zone
 */
export const generateDates = (start, end, timeZone) => {
  const untilFn = d => isAfterDate(end, d);
  return [...timeUnitGenerator(start, 'day', timeZone, untilFn)];
};
/**
 * Generates Dates for months (start of moments) between given range on desired time zone.
 * Note: end is exclusive
 *
 * @param {Date} start of desired date range
 * @param {Date} end of desired date range
 * @param {String} timeZone IANA time zone key
 * @returns An array of date objects in desired time zone
 */
export const generateMonths = (start, end, timeZone) => {
  const untilFn = d => isAfterDate(end, d);
  return [...timeUnitGenerator(start, 'month', timeZone, untilFn, 1, 'months')];
};

/**
 * Curry function for 'map'. Connect all the available slots that touch a given day
 * into a new object that has form: { id: '2023-01-22', slots: [] }
 *
 * @param {Array<Object>} availableSlots [{ start, end }]
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns function that gets day and available slots with them
 */
const toExceptionFreeSlotsPerDate = (availableSlots, timeZone) => day => {
  const availableSlotsOnDate = availableSlots.filter(s => {
    const dayStart = getStartOf(day, 'day', timeZone);
    const dayEnd = getStartOf(day, 'day', timeZone, 1, 'day');
    const dateRange = [dayStart, dayEnd];
    const slotRange = [s.start, s.end];

    const millisecondBeforeEndTime = end => new Date(end.getTime() - 1);
    const dayIsInsideSlot =
      isInRange(dayStart, ...slotRange, undefined, timeZone) &&
      isInRange(millisecondBeforeEndTime(dayEnd), ...slotRange, undefined, timeZone);
    const slotStartIsInsideDate = isInRange(s.start, ...dateRange, timeZone);
    const slotEndIsInsideDate = isInRange(millisecondBeforeEndTime(s.end), ...dateRange, timeZone);
    // Pick slots that overlap with the 'day'.
    return dayIsInsideSlot || slotStartIsInsideDate || slotEndIsInsideDate;
  });

  return {
    id: stringifyDateToISO8601(day, timeZone), // "2022-12-24"
    slots: availableSlotsOnDate,
  };
};

/**
 * Turn array of data to object literal where function extracts map key.
 * Given function needs to be able to return key value tuple out of each iterable item
 * > pipe([{ id: 'blaa', foo: 'bar' }], toHashMap(x => [x.id, x]))
 * //=> { blaa: { id: 'blaa', foo: 'bar' } }
 *
 * @param {function} f function to extract desired key and value tuple from iterable
 * @returns function that takes in iterator and returns object literal
 */
const toHashMap = f => iterator => {
  let obj = {};
  for (let x of iterator) {
    const [key, value] = f(x);
    obj[key] = value;
  }
  return obj;
};

//
/**
 * Get all the dates between start and end and all the available slots
 * that touch any of the generated dates.
 *
 * This assumes that start and end are correct moments in desired time zone.
 * This returns a hash-map that might look like:
 * {
 *  '2022-12-24': { slots },
 *  '2022-12-25': { slots },
 *  '2022-12-26': { slots },
 * }
 *
 * @param {Date} start of desired date range
 * @param {Date} end of desired date range
 * @param {*} exceptions
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns hash-map with dateIds as keys.
 */
export const exceptionFreeSlotsPerDate = (start, end, exceptions, timeZone) => {
  const s = getStartOf(start, 'day', timeZone);
  const e = getStartOf(end, 'day', timeZone);
  const availableSlots = availableRanges(s, e, exceptions);
  return pipe(
    generateDates(s, e, timeZone),
    map(toExceptionFreeSlotsPerDate(availableSlots, timeZone)),
    toHashMap(({ id, ...rest }) => [id, rest])
  );
};

/**
 * Filter those exceptions that touch the given date (00:00 - 23:59.999)
 * @param {Array<Date>} dateRange array with start of date and end of date
 * @param {Array<AvailabilityException>} exceptions
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns filtered list of exceptions or empty array
 */
const getExceptionsOnDate = (dateRange, exceptions, timeZone) => {
  const [dayStart, dayEnd] = dateRange;
  return exceptions.filter(e => {
    const exceptionRange = [e.attributes.start, e.attributes.end];

    const inclusiveEndTime = end => new Date(end.getTime() - 1);
    const dayStartInsideException = isInRange(dayStart, ...exceptionRange, undefined, timeZone);
    const dayEndInsideException = isInRange(
      inclusiveEndTime(dayEnd),
      ...exceptionRange,
      undefined,
      timeZone
    );
    const dayIsInsideException = dayStartInsideException && dayEndInsideException;

    const exceptionStartIsInsideDate = isInRange(e.attributes.start, ...dateRange, timeZone);
    const exceptionEndIsInsideDate = isInRange(
      inclusiveEndTime(e.attributes.end),
      ...dateRange,
      timeZone
    );
    // Pick slots that overlap with the 'day'.
    return dayIsInsideException || exceptionStartIsInsideDate || exceptionEndIsInsideDate;
  });
};

/**
 * Find next exception from given array that includes to the given date moment or starts after given date.
 * @param {Date} date (pointing to a certain millisecond moment)
 * @param {Array<AvailabilityException>} exceptions
 * @returns an exception entity
 */
const findNextException = (date, exceptions) => {
  const dateInMillis = getMillis(date);
  return exceptions.find(exception => {
    const start = getMillis(exception.attributes.start);
    const end = getMillis(exception.attributes.end);
    // is inside entry or exception is after given date moment
    return (start <= dateInMillis && dateInMillis < end) || start > dateInMillis;
  });
};

/**
 * Parse ISO8601 time-string (14:00) to localized Date object.
 * @param {Date} date for which the hour info is going to be applied.
 * @param {String} timeString (E.g. 09:00)
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns Date object
 */
const parseLocalizedTime = (date, timeString, timeZone) => {
  const dateString = stringifyDateToISO8601(date, timeZone);
  return parseDateTimeString(`${dateString} ${timeString}`, timeZone);
};

/**
 * End time (00:00) means the start of the next day, but otherwise it refers the given date.
 * @param {Date} date for which the hour info is going to be applied.
 * @param {String} endTime (E.g. 23:00)
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns
 */
const getEndTimeAsDate = (date, endTime, timeZone) =>
  endTime == '00:00'
    ? getStartOf(date, 'day', timeZone, 1, 'days')
    : parseLocalizedTime(date, endTime, timeZone);

/**
 * Find the next entry of Availability plan:
 * either given date is included to the entry or next entry is picked.
 *
 * @param {Date} date
 * @param {Array<Any>} dayEntries [{ dayOfWeek: 'mon', startTime: '01:00', endTime: '14:00', seats: 1 }]
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns object literal like { start, end, seats } or null
 */
const findNextPlanEntryInfo = (date, dayEntries, timeZone) => {
  const dateInMillis = getMillis(date);
  const entry = dayEntries.find(e => {
    const start = getMillis(parseLocalizedTime(date, e.startTime, timeZone));
    const end = getMillis(getEndTimeAsDate(date, e.endTime, timeZone));
    // is inside entry or entry is after given date moment
    return (start <= dateInMillis && dateInMillis < end) || start > dateInMillis;
  });

  if (entry) {
    const start = parseLocalizedTime(date, entry.startTime, timeZone);
    const end = getEndTimeAsDate(date, entry.endTime, timeZone);
    return { start, end, seats: entry.seats };
  }
  return null;
};

/**
 * Curry function that creates data for any "day" Date that the returned function gets.
 * Returned info: { id: "2023-01-01", planEntries, exceptions, ranges, hasAvailability }
 *
 * @param {AvailabilityPlan} plan
 * @param {Array<AvailabilityException>} exceptions
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns info of plan entries and exceptions relavant to the given "day" and seats-ranges inside it
 */
const toAvailabilityPerDate = (plan, exceptions, timeZone) => day => {
  const entries = plan
    ? plan.entries.filter(entry => entry.dayOfWeek === WEEKDAYS[getDayOfWeek(day, timeZone)])
    : [];
  const dayStart = getStartOf(day, 'day', timeZone);
  const dayEnd = getStartOf(day, 'day', timeZone, 1, 'day');
  const dateRange = [dayStart, dayEnd];
  const exceptionsOnDate = getExceptionsOnDate(dateRange, exceptions, timeZone);

  let hasAvailability = false;
  let ranges = [];
  let currentStart = dayStart;
  // currentStart is the cursor within this loop
  while (getMillis(currentStart) < getMillis(dayEnd)) {
    // Find next relevant exception (if there is any)
    const nextException = findNextException(currentStart, exceptionsOnDate);
    const exceptionRange = [nextException?.attributes?.start, nextException?.attributes?.end];
    const isInExceptionRange =
      !!nextException && isInRange(currentStart, ...exceptionRange, undefined, timeZone);

    // Find next plan entry (if there is any)
    const nextPlanEntry = findNextPlanEntryInfo(currentStart, entries, timeZone);
    const planRange = [nextPlanEntry?.start, nextPlanEntry?.end];
    const isInPlanRange =
      !!nextPlanEntry && isInRange(currentStart, ...planRange, undefined, timeZone);

    if (isInExceptionRange) {
      // If currentStart is inside an exception, the exception is picked as the next range
      const end =
        getMillis(nextException.attributes.end) < getMillis(dayEnd)
          ? nextException.attributes.end
          : dayEnd;
      ranges.push({
        start: currentStart,
        end,
        seats: nextException.attributes.seats,
        exception: nextException,
      });
      hasAvailability = hasAvailability || !!nextException.attributes.seats;
      currentStart = end; // update currentStart handle
    } else if (isInPlanRange) {
      // Alternatively, if currentStart is inside a plan entry,
      // the entry is picked until next exception (or entry's own end)
      const planEnd = nextPlanEntry.end;

      const end =
        nextException && getMillis(nextException.attributes.start) <= getMillis(planEnd)
          ? nextException.attributes.start
          : planEnd;

      ranges.push({
        start: currentStart,
        end,
        seats: nextPlanEntry.seats,
        plan: nextPlanEntry,
      });
      hasAvailability = hasAvailability || !!nextPlanEntry.seats;
      currentStart = end; // update currentStart handle
    } else {
      // If no exception or plan entry is relevant at currentStart,
      // Then we create *seats: 0* range until next exception/entry/day end is found
      const isNextRangeAnException =
        nextException &&
        (!nextPlanEntry ||
          (nextPlanEntry &&
            getMillis(nextException.attributes.start) <= getMillis(nextPlanEntry.start)));
      const isNextRangeAPlanEntry = !isNextRangeAnException && nextPlanEntry;
      const end = isNextRangeAnException
        ? nextException.attributes.start
        : isNextRangeAPlanEntry
        ? nextPlanEntry.start
        : dayEnd;
      ranges.push({
        start: currentStart,
        end,
        seats: 0,
      });
      currentStart = end;
      // If found end happens after dayend, break the while-loop
      if (getMillis(end) >= getMillis(dayEnd)) {
        break;
      }
    }
  }

  return {
    id: stringifyDateToISO8601(day, timeZone), // "2022-12-24"
    planEntries: entries,
    exceptions: exceptionsOnDate,
    ranges,
    hasAvailability,
  };
};

/**
 * Generates a hashmap of date infos, where each date contains
 * - *id* (date id string in ISO 8601 format)
 * - *planEntries* that touch the date
 * - *exceptions* that touch the date
 * - *ranges* array generated from plan entries and exceptions
 * - *hasAvailability* (boolean) if any of the ranges has seats available
 *
 * { "2023-01-01": { id: "2023-01-01", planEntries, exceptions, ranges, hasAvailability } }
 *
 * @param {Date} start of generated range of date infos
 * @param {Date} end of generated range of date infos
 * @param {AvailabilityPlan} plan
 * @param {Array<AvailabilityException} exceptions
 * @returns hashmap of date info grouped by date id (e.g. "2023-01-01" )
 */
export const availabilityPerDate = (start, end, plan, exceptions) => {
  const timeZone = plan?.timezone;
  const s = getStartOf(start, 'day', timeZone);
  const e = getStartOf(end, 'day', timeZone);
  return pipe(
    generateDates(s, e, timeZone),
    map(toAvailabilityPerDate(plan, exceptions, timeZone)),
    toHashMap(x => [x.id, x])
  );
};

/**
 * Filter those timeSlots that touch the given date (00:00 - 23:59.999)
 * @param {Array<Date>} dateRange array with start of date and end of date
 * @param {Array<TimeSlot>} timeSlots
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @returns filtered list of time slots or an empty array
 */
const getTimeSlotsOnDate = (dateRange, timeSlots, timeZone) => {
  const [dayStart, dayEnd] = dateRange;
  return timeSlots.filter(ts => {
    const timeSlotRange = [ts.attributes.start, ts.attributes.end];

    const inclusiveEndTime = end => new Date(end.getTime() - 1);
    const dayStartInsideTimeSlot = isInRange(dayStart, ...timeSlotRange, undefined, timeZone);
    const dayEndInsideTimeSlot = isInRange(
      inclusiveEndTime(dayEnd),
      ...timeSlotRange,
      undefined,
      timeZone
    );
    const dayIsInsideTimeSlot = dayStartInsideTimeSlot && dayEndInsideTimeSlot;

    const timeSlotStartIsInsideDate = isInRange(ts.attributes.start, ...dateRange, timeZone);
    const timeSlotEndIsInsideDate = isInRange(
      inclusiveEndTime(ts.attributes.end),
      ...dateRange,
      timeZone
    );
    // Pick slots that overlap with the 'day'.
    return dayIsInsideTimeSlot || timeSlotStartIsInsideDate || timeSlotEndIsInsideDate;
  });
};

/**
 * Curry function that creates data for any "day" Date that the returned function gets.
 * Returned info: { id: "2023-01-01", timeSlots, hasAvailability }
 *
 * @param {Array<TimeSlot>} timeSlots
 * @param {String} timeZone IANA time zone key (e.g. "Europe/Helsinki")
 * @param {Number} minSeats timeSlot should have at least this many seats available
 * @returns info of time slots relavant to the given "day" and seats-ranges inside it
 */
const toTimeSlotsPerDate = (timeSlots, timeZone, minSeats = 1) => day => {
  const entries = Array.isArray(timeSlots)
    ? timeSlots.filter(ts => ts.attributes.seats >= minSeats)
    : [];
  const dayStart = getStartOf(day, 'day', timeZone);
  const dayEnd = getStartOf(day, 'day', timeZone, 1, 'day');
  const dateRange = [dayStart, dayEnd];
  const timeSlotsOnDate = getTimeSlotsOnDate(dateRange, entries, timeZone);

  return {
    id: stringifyDateToISO8601(day, timeZone), // "2022-12-24"
    timeSlots: timeSlotsOnDate,
    hasAvailability: timeSlotsOnDate.length > 0,
  };
};

/**
 * Generates a hashmap of date infos, where each date contains
 * - *id* (date id string in ISO 8601 format)
 * - *timeSlots* that touch the date
 * - *hasAvailability* (boolean) if there are timeSlots on that day
 *
 * { "2023-01-01": { id: "2023-01-01", timeSlots, hasAvailability } }
 *
 * @param {Date} start of generated range of date infos
 * @param {Date} end of generated range of date infos
 * @param {Array<TimeSlot>} timeSlots
 * @param {String} timeZone
 * @param {Object} options
 * @returns hashmap of date info grouped by date id (e.g. "2023-01-01" )
 */
export const timeSlotsPerDate = (start, end, timeSlots, timeZone, options) => {
  const { seats = 1 } = options || {};
  const s = getStartOf(start, 'day', timeZone);
  const e = getStartOf(end, 'day', timeZone);
  return pipe(
    generateDates(s, e, timeZone),
    map(toTimeSlotsPerDate(timeSlots, timeZone, seats)),
    toHashMap(x => [x.id, x])
  );
};
