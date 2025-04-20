import {
  isInRange,
  isDateSameOrAfter,
  findNextBoundary,
  formatDateIntoPartials,
  getStartOf,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../util/dates';
import { timeSlotsPerDate } from '../../util/generators';

export const TODAY = new Date();

export const isToday = (date, timeZone) => {
  if (!date) {
    return false;
  }
  const startOfDay = getStartOf(TODAY, 'day', timeZone);
  const startOfTomorrow = getStartOf(TODAY, 'day', timeZone, 1, 'days');
  return isInRange(date, startOfDay, startOfTomorrow, 'day', timeZone);
};

export const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
export const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');

export const endOfRange = (date, dayCountAvailableForBooking, timeZone) => {
  return getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');
};

/**
 * Get the start of the month in given time zone.
 *
 * @param {String} monthId (e.g. '2024-07')
 * @param {String} timeZone time zone id (E.g. 'Europe/Helsinki')
 * @returns {Date} start of month
 */
export const getMonthStartInTimeZone = (monthId, timeZone) => {
  const month = parseDateFromISO8601(`${monthId}-01`, timeZone); // E.g. new Date('2022-12')
  return getStartOf(month, 'month', timeZone, 0, 'months');
};

/**
 * Get the range of months that we have already fetched time slots.
 * (This range expands when user clicks Next-button on date picker).
 * monthlyTimeSlots look like this: { '2024-07': { timeSlots: []}, '2024-08': { timeSlots: []} }
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @param {String} timeZone IANA time zone key ('Europe/Helsinki')
 * @returns {Array<Date>} a tuple containing dates: the start and exclusive end month
 */
export const getMonthlyFetchRange = (monthlyTimeSlots, timeZone) => {
  const monthStrings = Object.entries(monthlyTimeSlots).reduce((picked, entry) => {
    return Array.isArray(entry[1].timeSlots) ? [...picked, entry[0]] : picked;
  }, []);
  const firstMonth = getMonthStartInTimeZone(monthStrings[0], timeZone);
  const lastMonth = getMonthStartInTimeZone(monthStrings[monthStrings.length - 1], timeZone);
  const exclusiveEndMonth = nextMonthFn(lastMonth, timeZone);
  return [firstMonth, exclusiveEndMonth];
};

/**
 * This merges the time slots, when consecutive time slots are back to back with same "seats" count.
 *
 * @param {Array<TimeSlot>} timeSlots
 * @returns {Array<TimeSlot>} array of time slots where unnecessary boundaries have been removed.
 */
export const removeUnnecessaryBoundaries = (timeSlots, seatsEnabled) => {
  return timeSlots.reduce((picked, ts) => {
    const hasPicked = picked.length > 0;
    if (hasPicked) {
      const rest = picked.slice(0, -1);
      const lastPicked = picked.slice(-1)[0];

      const isBackToBack = lastPicked.attributes.end.getTime() === ts.attributes.start.getTime();
      const hasSameSeatsCount = lastPicked.attributes.seats === ts.attributes.seats;
      const createJoinedTimeSlot = (ts1, ts2, seats) => ({
        ...ts1,
        attributes: { ...ts1.attributes, end: ts2.attributes.end, seats: seats },
      });
      const hasValidSeatsCount = seatsEnabled && hasSameSeatsCount;
      const isSingleSeatMode = !seatsEnabled;
      const seatsForJoinedTimeSlot = isSingleSeatMode ? 1 : ts.attributes.seats;
      return isBackToBack && (hasValidSeatsCount || isSingleSeatMode)
        ? [...rest, createJoinedTimeSlot(lastPicked, ts, seatsForJoinedTimeSlot)]
        : [...picked, ts];
    }
    return [ts];
  }, []);
};

/**
 * Join monthly time slots into a single array and remove unnecessary boundaries on month changes.
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @returns {Array<TimeSlot>}
 */
export const getAllTimeSlots = (monthlyTimeSlots, seatsEnabled) => {
  const timeSlotsRaw = Object.values(monthlyTimeSlots).reduce((picked, mts) => {
    return [...picked, ...(mts.timeSlots || [])];
  }, []);
  return removeUnnecessaryBoundaries(timeSlotsRaw, seatsEnabled);
};

/**
 * Get all the time slots from the given array that touch the specified date.
 *
 * @param {Array<TimeSlot>} timeSlots
 * @param {Date} date
 * @param {String} timeZone IANA time zone key
 * @returns {Array<TimeSlot>}
 */
export const getTimeSlotsOnDate = (timeSlots, date, timeZone) => {
  return timeSlots && timeSlots[0]
    ? timeSlots.filter(t => {
        return isInRange(date, t.attributes.start, t.attributes.end, 'day', timeZone);
      })
    : [];
};

/**
 * Get all the time slots from monthlyTimeSlots (Redux state) that touch the given date.
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @param {Date} date
 * @param {String} timeZone IANA time zone key
 * @returns {Array<TimeSlot>}
 */
const getMonthlyTimeSlotsOnDate = (
  monthlyTimeSlots,
  date,
  timeZone,
  seatsEnabled,
  minDurationStartingInDay
) => {
  const timeSlots = getAllTimeSlots(monthlyTimeSlots, seatsEnabled);
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const opts = { minDurationStartingInDay };
  const monthlyTimeSlotsData = timeSlotsPerDate(startMonth, endMonth, timeSlots, timeZone, opts);
  const startIdString = stringifyDateToISO8601(date, timeZone);
  return monthlyTimeSlotsData[startIdString]?.timeSlots || [];
};

export const getTimeSlotsOnSelectedDate = (
  timeSlotsOnSelectedDate,
  monthlyTimeSlots,
  bookingStartDate,
  timeZone,
  seatsEnabled,
  minDurationStartingInDay
) => {
  if (!bookingStartDate) {
    return [];
  }

  return timeSlotsOnSelectedDate.length > 0
    ? removeUnnecessaryBoundaries(timeSlotsOnSelectedDate, seatsEnabled)
    : bookingStartDate
    ? getMonthlyTimeSlotsOnDate(
        monthlyTimeSlots,
        bookingStartDate,
        timeZone,
        seatsEnabled,
        minDurationStartingInDay
      )
    : [];
};

export const showNextMonthStepper = (currentMonth, dayCountAvailableForBooking, timeZone) => {
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return !isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  );
};

export const showPreviousMonthStepper = (currentMonth, timeZone) => {
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);
  return isDateSameOrAfter(prevMonthDate, currentMonthDate);
};

export const getPlaceholder = (defaultPlaceholderTime = '08:00', timeZone, intl) => {
  let placeholder = defaultPlaceholderTime;
  try {
    const todayBoundary = findNextBoundary(TODAY, 1, 'hour', timeZone);
    placeholderTime = formatDateIntoPartials(todayBoundary, intl, { timeZone })?.time;
  } catch (error) {
    // No need to handle error
  }
  return placeholder;
};
