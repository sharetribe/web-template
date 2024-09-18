import {
  isInRange,
  getStartOf,
  isDateSameOrAfter,
  monthIdString,
  parseDateFromISO8601,
  stringifyDateToISO8601,
  getStartOfWeek,
} from '../../../../util/dates';

// Marketplace API allows fetching exceptions to 366 days into the future.
export const MAX_AVAILABILITY_EXCEPTIONS_RANGE = 366;
const TODAY = new Date();

// Helper for the pickers of DatePicker (weekly and monthly calendars)
export const getStartOfWeekFn = (currentMoment, timeZone, firstDayOfWeek, offset = 0) => {
  const startOfWeek = getStartOfWeek(currentMoment, timeZone, firstDayOfWeek);
  return getStartOf(startOfWeek, 'day', timeZone, offset, 'days');
};

export const getStartOfNextWeek = (currentMoment, timeZone, firstDayOfWeek, offset = 7) =>
  getStartOfWeekFn(currentMoment, timeZone, firstDayOfWeek, offset);
export const getStartOfPrevWeek = (currentMoment, timeZone, firstDayOfWeek, offset = 7) =>
  getStartOfWeekFn(currentMoment, timeZone, firstDayOfWeek, -1 * offset, 'days');

export const getStartOfMonth = (currentMoment, timeZone, offset = 0) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
export const getStartOfNextMonth = (currentMoment, timeZone, offset = 1) =>
  getStartOfMonth(currentMoment, timeZone, offset);
export const getStartOfPrevMonth = (currentMoment, timeZone, offset = 1) =>
  getStartOfMonth(currentMoment, timeZone, -1 * offset);

export const getExclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, 1, 'days');
};
export const getInclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, -1, 'days');
};

// DatePicker returns wrapped date objects
export const extractDateFromFieldDateInput = dateValue => dateValue?.date || null;

// DatePicker returns wrapped date objects
export const extractDateFromFieldDateRangeInput = dates => {
  return dates?.startDate || dates?.endDate ? dates : { startDate: null, endDate: null };
};

export const endOfAvailabilityExceptionRange = (timeZone, date) => {
  return getStartOf(date, 'day', timeZone, MAX_AVAILABILITY_EXCEPTIONS_RANGE - 1, 'days');
};

const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');

const fetchExceptionData = (
  date,
  listingId,
  timeZone,
  onFetchExceptions,
  firstDayOfWeek,
  isWeekly = true
) => {
  const endOfRangeDate = endOfRange(TODAY, MAX_AVAILABILITY_EXCEPTIONS_RANGE, timeZone);

  // Don't fetch timeSlots for past months or too far in the future
  if (isInRange(date, TODAY, endOfRangeDate)) {
    // Use "today", if the first day of given month is in the past
    // TODO
    const start = isDateSameOrAfter(TODAY, date) ? TODAY : date;

    // Use endOfRangeDate, if the first day of the next date range is too far in the future
    const nextRangeDate = isWeekly
      ? getStartOfNextWeek(date, timeZone, firstDayOfWeek)
      : getStartOfNextMonth(date, timeZone);
    const end = isDateSameOrAfter(nextRangeDate, endOfRangeDate)
      ? getStartOf(endOfRangeDate, 'day', timeZone)
      : nextRangeDate;

    // Fetch time slots for given time range
    onFetchExceptions({ listingId, isWeekly, start, end, timeZone });
  }
};

// Update current week
// When clicking next or prev buttons on weekly calendar,
// we fetch data for the week that comes after next week.
export const handleWeekClick = params => weekFn => {
  const {
    currentWeek,
    setCurrentWeek,
    weeklyExceptionQueries,
    listingId,
    timeZone,
    onFetchExceptions,
    firstDayOfWeek,
  } = params;
  const updatedWeek = weekFn(currentWeek, timeZone, firstDayOfWeek);
  setCurrentWeek(updatedWeek);

  // Callback function after the week has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchExceptionData(
    weekFn(currentWeek, timeZone, firstDayOfWeek, 14),
    listingId,
    timeZone,
    onFetchExceptions,
    firstDayOfWeek
  );

  // If previous fetch for the week data failed, try again.
  const weekId = stringifyDateToISO8601(currentWeek, timeZone);
  const currentWeekData = weeklyExceptionQueries[weekId];
  if (currentWeekData?.fetchTimeSlotsError) {
    fetchExceptionData(currentWeek, listingId, timeZone, onFetchExceptions, firstDayOfWeek);
  }
};

// Update current month and call callback function.
// When clicking next or prev buttons on monthly calendar,
// we fetch data for the month that comes after next month.
export const handleMonthClick = params => monthFn => {
  const {
    currentMonth,
    setCurrentMonth,
    monthlyExceptionQueries,
    listingId,
    timeZone,
    onFetchExceptions,
    onMonthChanged,
  } = params;
  const updatedMonth = monthFn(currentMonth, timeZone);
  setCurrentMonth(updatedMonth);

  // Callback function after month has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchExceptionData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    timeZone,
    onFetchExceptions,
    undefined,
    false
  );

  // If previous fetch for the month data failed, try again.
  const monthId = monthIdString(currentMonth, timeZone);
  const currentMonthData = monthlyExceptionQueries[monthId];
  if (currentMonthData?.fetchTimeSlotsError) {
    fetchExceptionData(currentMonth, listingId, timeZone, onFetchExceptions, undefined, false);
  }

  if (onMonthChanged) {
    const monthId = monthIdString(updatedMonth, timeZone);
    onMonthChanged(monthId);
  }
};

const getMonthStartInTimeZone = (monthId, timeZone) => {
  const month = parseDateFromISO8601(`${monthId}-01`, timeZone); // E.g. new Date('2022-12')
  return getStartOfMonth(month, timeZone);
};
// Get the range of months that we have already fetched content
// (as a reaction to user's Next-button clicks on date picker).
export const getMonthlyFetchRange = (monthlyExceptionQueries, timeZone) => {
  const monthStrings = Object.keys(monthlyExceptionQueries);
  const firstMonth = getMonthStartInTimeZone(monthStrings[0], timeZone);
  const lastMonth = getMonthStartInTimeZone(monthStrings[monthStrings.length - 1], timeZone);
  const exclusiveEndMonth = getStartOfNextMonth(lastMonth, timeZone);
  return [firstMonth, exclusiveEndMonth];
};
