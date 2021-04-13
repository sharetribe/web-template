const moment = require('moment');

/** Helper functions for handling dates
 * These helper functions are copied from src/util/dates.js
 */

/**
 * Calculate the number of nights between the given dates.
 *
 * This uses moment#diff and, therefore, it just checks,
 * if there are 1000x60x60x24 milliseconds between date objects.
 *
 * Note: This should not be used for checking if the local date has
 *       changed between "2021-04-07 23:00" and "2021-04-08 05:00".
 *
 * @param {Date} startDate start of the time period
 * @param {Date} endDate end of the time period
 *
 * @throws Will throw if the end date is before the start date
 * @returns {Number} number of nights between the given dates
 */
exports.nightsBetween = (startDate, endDate) => {
  const nights = moment(endDate).diff(startDate, 'days');
  if (nights < 0) {
    throw new Error('End date cannot be before start date');
  }
  return nights;
};

/**
 * Calculate the number of days between the given dates.
 *
 * This uses moment#diff and, therefore, it just checks,
 * if there are 1000x60x60x24 milliseconds between date objects.
 *
 * Note: This should not be used for checking if the local date has
 *       changed between "2021-04-07 23:00" and "2021-04-08 05:00".
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
exports.daysBetween = (startDate, endDate) => {
  const days = moment(endDate).diff(startDate, 'days');
  if (days < 0) {
    throw new Error('End date cannot be before start date');
  }
  return days;
};
