import moment from 'moment-timezone/builds/moment-timezone-with-data-10-year-range.min';

/**
 * Input names for the DateRangePicker from react-dates.
 */
export const START_DATE = 'startDate';
export const END_DATE = 'endDate';

/**
 * Check that the given parameter is a Date object.
 *
 * @param {Date} object that should be a Date.
 *
 * @returns {boolean} true if given parameter is a Date object.
 */
export const isDate = d =>
  d && Object.prototype.toString.call(d) === '[object Date]' && !Number.isNaN(d.getTime());

/**
 * Check if the given parameters represent the same Date value (timestamps are compared)
 *
 * @param {Date} first param that should be a Date and it should have same timestamp as second param.
 * @param {Date} second param that should be a Date and it should have same timestamp as second param.
 *
 * @returns {boolean} true if given parameters have the same timestamp.
 */
export const isSameDate = (a, b) => a && isDate(a) && b && isDate(b) && a.getTime() === b.getTime();

/**
 * Compare is dateA is after dateB
 *
 * @param {Date} dateA date instance
 * @param {Date} dateB date instance
 *
 * @returns {Date} true if dateA is after dateB
 */
export const isAfterDate = (dateA, dateB) => {
  return moment(storedAt).isAfter(moment(dateB));
};

////////////////////////////////////////////////////////////////////
// Manipulate time: time-of-day between different time zones etc. //
////////////////////////////////////////////////////////////////////

/**
 * Returns a new date, which indicates the same time of day in a given time zone
 * as given date is in local time zone
 *
 * @param {Date} date
 * @param {String} timeZone
 *
 * @returns {Date} date in given time zone
 */
export const timeOfDayFromLocalToTimeZone = (date, timeZone) => {
  return moment.tz(moment(date).format('YYYY-MM-DD HH:mm:ss'), timeZone).toDate();
};

/**
 * Returns a new date, which indicates the same time of day in a local time zone
 * as given date is in specified time zone
 *
 * @param {Date} date
 * @param {String} timeZone
 *
 * @returns {Date} date in given time zone
 */
export const timeOfDayFromTimeZoneToLocal = (date, timeZone) => {
  return moment(
    moment(date)
      .tz(timeZone)
      .format('YYYY-MM-DD HH:mm:ss')
  ).toDate();
};

/**
 * Get start of time unit (e.g. start of day)
 *
 * @param {Date} date date instance to be converted
 * @param {String} unit time-unit (e.g. "day")
 * @param {String} timeZone time zone id
 *
 * @returns {Date} date object converted to the start of given unit
 */
export const getStartOf = (date, unit, timeZone) => {
  const m = timeZone
    ? moment(date)
        .clone()
        .tz(timeZone)
    : moment(date).clone();

  return m.startOf(unit).toDate();
};

/**
 * Adds time-units to the date
 *
 * @param {Date} date date to be manipulated
 * @param {int} offset offset of time-units (e.g. "3" days)
 * @param {String} unit time-unit (e.g. "days")
 * @param {String} timeZone time zone name
 *
 * @returns {Date} date with given offset added
 */
export const addTime = (date, offset, unit, timeZone) => {
  const m = timeZone
    ? moment(date)
        .clone()
        .tz(timeZone)
    : moment(date).clone();
  return m.add(offset, unit).toDate();
};

/**
 * Subtract time-units from the date
 *
 * @param {Date} date date to be manipulated
 * @param {int} offset offset of time-units (e.g. "3" days)
 * @param {String} unit time-unit (e.g. "days")
 * @param {String} timeZone time zone name
 *
 * @returns {Date} date with given offset subtracted
 */
export const subtractTime = (date, offset, unit, timeZone) => {
  const m = timeZone
    ? moment(date)
        .clone()
        .tz(timeZone)
    : moment(date).clone();
  return m.subtract(offset, unit).toDate();
};

///////////////
// Durations //
///////////////

/**
 * Calculate the number of days between the given dates
 *
 * @param {Date} startDate start of the time period
 * @param {Date} endDate end of the time period. NOTE: with daily
 * bookings, it is expected that this date is the exclusive end date,
 * i.e. the last day of the booking is the previous date of this end
 * date.
 *
 * @throws Will throw if the end date is before the start date
 * @returns {Number} number of days between the given dates
 */
export const daysBetween = (startDate, endDate) => {
  const days = moment(endDate).diff(startDate, 'days');
  if (days < 0) {
    throw new Error('End date cannot be before start date');
  }
  return days;
};

/**
 * Calculate the number of minutes between the given dates
 *
 * @param {Date} startDate start of the time period
 * @param {Date} endDate end of the time period.
 *
 * @throws Will throw if the end date is before the start date
 * @returns {Number} number of minutes between the given Date objects
 */
export const minutesBetween = (startDate, endDate) => {
  const minutes = moment(endDate).diff(startDate, 'minutes');
  if (minutes < 0) {
    throw new Error('End Date cannot be before start Date');
  }
  return minutes;
};

/**
 * Calculate the difference between the given dates
 *
 * @param {Date} startDate start of the time period
 * @param {Date} endDate end of the time period.
 *
 * @returns {Number} time difference between the given Date objects using given unit
 */
export const diffInTime = (startDate, endDate, unit, useFloat = false) => {
  return startDate.diff(endDate, unit, useFloat);
};

////////////////////////////
// Parsing and formatting //
////////////////////////////

/**
 * Format the given date
 *
 * @param {Object} intl Intl object from react-intl
 * @param {String} todayString translation for the current day
 * @param {Date} d Date to be formatted
 *
 * @returns {String} formatted date
 */
export const formatDate = (intl, todayString, d) => {
  const paramsValid = intl && d instanceof Date && typeof todayString === 'string';
  if (!paramsValid) {
    throw new Error(`Invalid params for formatDate: (${intl}, ${todayString}, ${d})`);
  }

  // By default we can use moment() directly but in tests we need to use a specific dates.
  // fakeIntl used in tests contains now() function wich returns predefined date
  const now = intl.now ? moment(intl.now()) : moment();
  const formattedTime = intl.formatTime(d);
  let formattedDate;

  if (now.isSame(d, 'day')) {
    // e.g. "Today, 9:10pm"
    formattedDate = todayString;
  } else if (now.isSame(d, 'week')) {
    // e.g. "Wed, 8:00pm"
    formattedDate = intl.formatDate(d, {
      weekday: 'short',
    });
  } else if (now.isSame(d, 'year')) {
    // e.g. "Aug 22, 7:40pm"
    formattedDate = intl.formatDate(d, {
      month: 'short',
      day: 'numeric',
    });
  } else {
    // e.g. "Jul 17 2016, 6:02pm"
    const date = intl.formatDate(d, {
      month: 'short',
      day: 'numeric',
    });
    const year = intl.formatDate(d, {
      year: 'numeric',
    });
    formattedDate = `${date} ${year}`;
  }

  return `${formattedDate}, ${formattedTime}`;
};

/**
 * Converts string given in ISO8601 format to date object.
 * This is used e.g. when when dates are parsed form urlParams
 *
 * @param {String} dateString in 'YYYY-MM-DD'format
 *
 * @returns {Date} parsed date object
 */
export const parseDateFromISO8601 = dateString => {
  return moment(dateString, 'YYYY-MM-DD').toDate();
};

/**
 * Converts date to string ISO8601 format ('YYYY-MM-DD').
 * This string is used e.g. in urlParam.
 *
 * @param {Date} date
 *
 * @returns {String} string in 'YYYY-MM-DD'format
 */
export const stringifyDateToISO8601 = date => {
  return moment(date).format('YYYY-MM-DD');
};

/**
 * Formats string ('YYYY-MM-DD') to UTC format ('0000-00-00T00:00:00.000Z').
 * This is used in search query.
 *
 * @param {String} string in 'YYYY-MM-DD'format
 *
 * @returns {String} string in '0000-00-00T00:00:00.000Z' format
 */
export const formatDateStringToUTC = dateString => {
  return moment.utc(dateString).toDate();
};

/**
 * Formats date to into multiple different ways:
 * - date "Mar 24"
 * - time "8:07 PM"
 * - dateAndTime: "Mar 24, 8:07 PM"
 *
 * @param {Object} intl Intl object from react-intl
 * @param {Date} date to be formatted
 *
 * @returns {Object} "{ date, time, dateAndTime }"
 */
export const formatDateToText = (intl, date) => {
  return {
    date: intl.formatDate(date, {
      month: 'short',
      day: 'numeric',
    }),
    time: intl.formatDate(date, {
      hour: 'numeric',
      minute: 'numeric',
    }),
    dateAndTime: intl.formatTime(date, {
      month: 'short',
      day: 'numeric',
    }),
  };
};

//////////
// Misc //
//////////

/**
 * Format the given date to month id/string
 *
 * @param {Date} date to be formatted
 *
 * @returns {String} formatted month string
 */
export const monthIdString = date => moment(date).format('YYYY-MM');

/**
 * Format the given date to UTC month id/string
 *
 * @param {Date} date to be formatted
 *
 * @returns {String} formatted month string
 */
export const monthIdStringInUTC = date =>
  moment(date)
    .utc()
    .format('YYYY-MM');

/**
 * Formats string ('YYYY-MM-DD') to UTC format ('0000-00-00T00:00:00.000Z') and adds one day.
 * This is used as end date of the search query.
 * One day must be added because end of the availability is exclusive in API.
 *
 * @param {String} string in 'YYYY-MM-DD'format
 *
 * @returns {String} string in '0000-00-00T00:00:00.000Z' format
 */

export const getExclusiveEndDate = dateString => {
  return moment
    .utc(dateString)
    .add(1, 'days')
    .startOf('day')
    .toDate();
};
