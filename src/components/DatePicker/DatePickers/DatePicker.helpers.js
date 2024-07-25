/**
 * Add days to the given date.
 *
 * @param {Date} date
 * @param {Number} days
 * @returns the start of the future date
 */
export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);

  // Ensure that the returned date is the start of the day
  return getStartOfDay(newDate);
};

/**
 * Get the week rows for the calendar. Eahc week row contains Dates.
 * The first and last week might contain padded Dates from previous / next month.
 *
 * @param {Date} date signifying the month
 * @param {Number} firstDayOfWeek (0-6)
 * @returns Array of week arrays containing Date objects.
 */
export const getCalendarRows = (date, firstDayOfWeek) => {
  const shiftedFirstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
  const daysOfMonth = getDaysOfMonth(date, true, shiftedFirstDayOfWeek);

  const calendarRows = [];

  for (let i = 0; i < daysOfMonth.length; i += 7) {
    const row = daysOfMonth.slice(i, i + 7);
    calendarRows.push(row);
  }

  return calendarRows;
};

/**
 * Get the days of the month.
 * If padded is true, the array is filled with days from previous and next month
 * to complete the full week (when the month starts or ends).
 *
 * @param {Date} date signifying the month
 * @param {Boolean} padded should be true for rendered calendar days
 * @param {Number} firstDayOfWeek (1 - 7)
 * @returns array of dates
 */
export const getDaysOfMonth = (date, padded, firstDayOfWeek) => {
  const days = [];
  const firstOfMonth = getFirstOfMonth(date);
  const firstDayMonth = firstOfMonth.getDay() === 0 ? 7 : firstOfMonth.getDay();
  const lastOfMonth = getLastOfMonth(date);
  const lastDayOfMonth = lastOfMonth.getDay() === 0 ? 7 : lastOfMonth.getDay();
  const lastDayOfWeek = firstDayOfWeek === 1 ? 7 : firstDayOfWeek - 1;
  const leftPaddingDays = [];
  const rightPaddingDays = [];

  if (padded) {
    const leftPadding = (7 - firstDayOfWeek + firstDayMonth) % 7;

    let leftPaddingAmount = leftPadding;
    let leftPaddingDay = getPreviousDay(firstOfMonth);

    while (leftPaddingAmount > 0) {
      leftPaddingDays.push(leftPaddingDay);
      leftPaddingDay = getPreviousDay(leftPaddingDay);
      leftPaddingAmount -= 1;
    }

    leftPaddingDays.reverse();

    const rightPadding = (7 - lastDayOfMonth + lastDayOfWeek) % 7;

    let rightPaddingAmount = rightPadding;
    let rightPaddingDay = getNextDay(lastOfMonth);

    while (rightPaddingAmount > 0) {
      rightPaddingDays.push(rightPaddingDay);
      rightPaddingDay = getNextDay(rightPaddingDay);
      rightPaddingAmount -= 1;
    }
  }

  let currentDay = firstOfMonth;

  while (currentDay.getMonth() === date.getMonth()) {
    days.push(currentDay);
    currentDay = getNextDay(currentDay);
  }

  return [...leftPaddingDays, ...days, ...rightPaddingDays];
};

/**
 * Get the first date of the month.
 *
 * @param {Date} date signifying the month
 * @returns the first date of month (00:00)
 */
export const getFirstOfMonth = date => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const firstOfMonth = getLocalDateFromISOString(
    `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
  );

  return firstOfMonth;
};

/**
 * Return the date part of the ISO date string: "2024-07-17"
 *
 * @param {Date} date
 * @returns string that contains ISO formatted date (e.g. "2025-01-01")
 */
export const getISODateString = date => {
  if (!(date instanceof Date)) {
    return;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

/**
 * Get the last date of the month.
 *
 * @param {Date} date signifying the month
 * @returns the last date of month (00:00)
 */
export const getLastOfMonth = date => {
  const newDate = getFirstOfMonth(date);

  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(newDate.getDate() - 1);

  return newDate;
};

/**
 * Get a Date object that points to the start of date on a local time zone.
 *
 * @param {String} dateString should follow ISO format: "2024-07-17"
 * @returns a Date object.
 */
export const getLocalDateFromISOString = dateString => {
  return removeTimezoneOffset(new Date(dateString));
};

/**
 * Gen an array of tuples containing short and long version of the weekday
 * [['Sun', 'Sunday'], ['Mon', 'Monday'], ...]
 *
 * @param {Number} firstDayOfWeek (1-7)
 * @param {ReactIntl} intl
 * @returns localized week days
 */
export const getLocalizedWeekDays = (firstDayOfWeek, intl) =>
  getWeekDays(firstDayOfWeek === 0 ? 7 : firstDayOfWeek, intl);

/**
 * Get the localized names of the months.
 *
 * @param {ReactIntl} intl
 * @returns an array of month names
 */
export const getMonths = intl => {
  return new Array(12).fill(undefined).map((_, month) => {
    const date = getLocalDateFromISOString(`2023-${String(month + 1).padStart(2, '0')}-01`);

    return intl.formatDate(date, { month: 'long' });
  });
};

/**
 * Get the next day.
 *
 * @param {Date} date
 * @returns the date after the given date
 */
export const getNextDay = date => {
  return addDays(date, 1);
};

/**
 * Get the first day of the next month.
 *
 * @param {Date} date
 * @returns the first day of the next month (signified by the given date).
 */
export const getNextMonth = date => {
  const newDate = new Date(date);

  newDate.setDate(1);
  newDate.setMonth(newDate.getMonth() + 1);

  return newDate;
};

/**
 * Get the previous day.
 *
 * @param {Date} date
 * @returns the date before the given date
 */
export const getPreviousDay = date => {
  return subDays(date, 1);
};

/**
 * Get the first day of the previous month.
 *
 * @param {Date} date
 * @returns the first day of the previous month (signified by the given date).
 */
export const getPreviousMonth = date => {
  const newDate = new Date(date);

  newDate.setDate(1);
  newDate.setMonth(newDate.getMonth() - 1);

  return newDate;
};

/**
 * Get the start of the day.
 *
 * Note: We trust that JavaScript returns the correct moment.
 * E.g. Atlantic/Azores has DST change from 00:00 -> 01:00 (there's no 00:00 on that day)
 * There, JS/Date returns 01:00 on that date.
 *
 * @param {Date} day
 * @returns the start of the day (00:00)
 */
export const getStartOfDay = day => {
  const year = day.getFullYear();
  const month = day.getMonth();
  const date = day.getDate();

  // Create a new Date object. We trust that JavaScript returns the correct moment.
  // E.g. Atlantic/Azores has DST change from 00:00 -> 01:00 (there's no 00:00 on that day)
  // JS/Date returns 01:00 on that date.
  return new Date(year, month, date, 0, 0, 0, 0);
};

/**
 * Generate an array of tuples containing short and long version of the weekday
 * [['Sun', 'Sunday'], ['Mon', 'Monday'], ...]
 *
 * @param {Number} firstDayOfWeek (1-7)
 * @param {ReactIntl} intl
 * @returns Array of tuples containing short and long version of the weekday
 */
export const getWeekDays = (firstDayOfWeek, intl) => {
  return new Array(7)
    .fill(undefined)
    .map((_, index) => ((firstDayOfWeek + index) % 7) + 1)
    .map(day => {
      const date = getLocalDateFromISOString(`2023-01-0${day}`);

      return [
        intl.formatDate(date, { weekday: 'short' }),
        intl.formatDate(date, { weekday: 'long' }),
      ];
    });
};

// range: { from: Date; to: Date }
/**
 * Check if the given date inside the range (with inclusive boundaries)
 *
 * @param {Date} date
 * @param {Object} range { from: Date; to: Date }
 * @returns true if date is within the range.
 */
export const isDateInRange = (date, range) => {
  if (!date || !range || !range.from || !range.to) {
    return false;
  }

  const earlyDate = range.from < range.to ? range.from : range.to;
  const laterDate = range.from < range.to ? range.to : range.from;

  return date >= earlyDate && date <= laterDate;
};

/**
 * This checks if the given string can be converted to Date object.
 * A valid date string must follow either the ISO format ("2024-01-22") or US date format ("01/22/2024").
 *
 * @param {String} str must follow ISO format or US date format.
 * @returns true if date string can be converted to Date object
 */
export const isValidDateString = str => {
  const isISODate =
    /\d{4}-\d{2}-\d{2}/.test(str) || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str);
  const isUSDate = /\d{2}\/\d{2}\/\d{4}/.test(str);
  const d = new Date(str);
  return (isISODate || isUSDate) && d instanceof Date && !isNaN(d);
};

/**
 * Check if the given dates point to the same day.
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns true if year, month and date match.
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) {
    return false;
  }

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * This removes the time zone offset from the given date.
 * It is useful when the given date points to the start of of day on UTC.
 *
 * @param {Date} date pointing to the start of of day on UTC
 * @returns start of the date on local time zone
 */
export const removeTimezoneOffset = date => {
  const newDate = new Date(date);

  newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());

  return newDate;
};

/**
 * Subtract days from the given date.
 *
 * @param {Date} date
 * @param {Number} days
 * @returns the start of the past date
 */
export const subDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);

  // Ensure that the returned date is the start of the day
  return getStartOfDay(newDate);
};
