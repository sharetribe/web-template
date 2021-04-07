import moment from 'moment-timezone/builds/moment-timezone-with-data-10-year-range.min';

/**
 * Input names for the DateRangePicker from react-dates.
 */
export const START_DATE = 'startDate';
export const END_DATE = 'endDate';

/**
 * Check if the browser's DateTimeFormat API supports time zones.
 *
 * @returns {Boolean} true if the browser returns current time zone.
 */
export const isTimeZoneSupported = () => {
  if (!Intl || typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return false;
  }

  const dtf = new Intl.DateTimeFormat();
  if (typeof dtf === 'undefined' || typeof dtf.resolvedOptions === 'undefined') {
    return false;
  }
  return !!dtf.resolvedOptions().timeZone;
};

/**
 * Check if the given time zone key is valid.
 *
 * @param {String} name of the time zone in IANA format
 *
 * @returns {Boolean} true if the browser recognizes the key.
 */
export const isValidTimeZone = timeZone => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch (e) {
    return false;
  }
};

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

const getTimeZoneMaybe = timeZone => {
  if (timeZone) {
    if (!isTimeZoneSupported()) {
      throw new Error(`Your browser doesn't support time zones.`);
    }

    if (!isValidTimeZone(timeZone)) {
      throw new Error(`Given time zone key (${timeZone}) is not valid.`);
    }
    return { timeZone };
  }
  return {};
};

/**
 * Format the given date. Printed string depends on how close the date is the current day.
 * E.g. "Today, 9:10 PM", "Sun 6:02 PM", "Jul 20, 6:02 PM", "Jul 20 2020, 6:02 PM"
 *
 * @param {Date} date Date to be formatted
 * @param {Object} intl Intl object from react-intl
 * @param {String} todayString translation for the current day
 * @param {Object} [opts] options. Can be used to pass in timeZone. It should represent IANA time zone key.
 *
 * @returns {String} formatted date
 */
export const formatDateWithProximity = (date, intl, todayString, opts = {}) => {
  const paramsValid = intl && date instanceof Date && typeof todayString === 'string';
  if (!paramsValid) {
    throw new Error(`Invalid params for formatDate: (${date}, ${intl}, ${todayString})`);
  }

  // If timeZone parameter is set, use it as formatting option
  const { timeZone } = opts;
  const timeZoneMaybe = getTimeZoneMaybe(timeZone);

  // By default we can use moment() directly but in tests we need to use a specific dates.
  // Tests inject now() function to intl wich returns predefined date
  const now = intl.now ? moment(intl.now()) : moment();

  // isSame: if the two moments have different time zones, the time zone of the first moment will be used for the comparison.
  const localizedNow = timeZoneMaybe.timeZone ? now.tz(timeZone) : now;

  if (localizedNow.isSame(date, 'day')) {
    // e.g. "Today, 9:10 PM"
    const formattedTime = intl.formatDate(date, {
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    });
    return `${todayString}, ${formattedTime}`;
  } else if (localizedNow.isSame(date, 'week')) {
    // e.g.
    // en-US: "Sun 6:02 PM"
    // en-GB: "Sun 18:02"
    // fr-FR: "dim. 18:02"
    return intl.formatDate(date, {
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    });
  } else if (localizedNow.isSame(date, 'year')) {
    // e.g.
    // en-US: "Jul 20, 6:02 PM"
    // en-GB: "20 Jul, 18:02"
    // fr-FR: "20 juil., 18:02"
    return intl.formatDate(date, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    });
  } else {
    // e.g.
    // en-US: "Jul 20, 2020, 6:02 PM"
    // en-GB: "20 Jul 2020, 18:02"
    // fr-FR: "20 juil. 2020, 18:02"
    return intl.formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    });
  }
};

/**
 * Formats date to into multiple different ways:
 * - date "Mar 24"
 * - time "8:07 PM"
 * - dateAndTime: "Mar 24, 8:07 PM"
 *
 * If date is on different year, it will show it.
 *
 * @param {Date} date to be formatted
 * @param {Object} intl Intl object from react-intl
 * @param {Object} [opts] options. Can be used to pass in timeZone. It should represent IANA time zone key.
 *
 * @returns {Object} "{ date, time, dateAndTime }"
 */
export const formatDateIntoPartials = (date, intl, opts = {}) => {
  // If timeZone parameter is set, use it as formatting option
  const { timeZone } = opts;
  const timeZoneMaybe = getTimeZoneMaybe(timeZone);

  // By default we can use moment() directly but in tests we need to use a specific dates.
  // Tests inject now() function to intl wich returns predefined date
  const now = intl.now ? moment(intl.now()) : moment();

  // isSame: if the two moments have different time zones, the time zone of the first moment will be used for the comparison.
  const localizedNow = timeZoneMaybe.timeZone ? now.tz(timeZone) : now;
  const yearMaybe = localizedNow.isSame(date, 'year') ? {} : { year: 'numeric' };

  return {
    date: intl.formatDate(date, {
      month: 'short',
      day: 'numeric',
      ...yearMaybe,
      ...timeZoneMaybe,
    }),
    time: intl.formatDate(date, {
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    }),
    dateAndTime: intl.formatDate(date, {
      ...yearMaybe,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      ...timeZoneMaybe,
    }),
  };
};

/**
 * Parses given date string in ISO8601 format('YYYY-MM-DD') to date in
 * the given time zone.
 *
 * This is used in search when filtering by time-based availability.
 *
 * Example:
 * ('2020-04-15', 'Etc/UTC') => new Date('2020-04-15T00:00:00.000Z')
 * ('2020-04-15', 'Europe/Helsinki') => new Date('2020-04-14T21:00:00.000Z')
 *
 * @param {String} dateString in 'YYYY-MM-DD' format
 * @param {String} [timeZone] time zone id, see:
 *   https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 *
 * @returns {Date} date
 */
export const parseDateFromISO8601 = (dateString, timeZone = null) => {
  return timeZone
    ? moment.tz(dateString, timeZone).toDate()
    : moment(dateString, 'YYYY-MM-DD').toDate();
};

/**
 * Converts date to string ISO8601 format ('YYYY-MM-DD').
 * This string is used e.g. in urlParam.
 *
 * @param {Date} date
 * @param {String} [timeZone] time zone id, see:
 *   https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 *
 * @returns {String} string in 'YYYY-MM-DD' format
 */
export const stringifyDateToISO8601 = (date, timeZone = null) => {
  return timeZone
    ? moment(date)
        .tz(timeZone)
        .format('YYYY-MM-DD')
    : moment(date).format('YYYY-MM-DD');
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
