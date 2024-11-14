import React, { useState, useEffect } from 'react';

import appSettings from '../../../../../config/settings';
import {
  getStartOf,
  isDateSameOrAfter,
  isInRange,
  isSameDay,
  stringifyDateToISO8601,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
} from '../../../../../util/dates';
import { exceptionFreeSlotsPerDate } from '../../../../../util/generators';
import { required, bookingDatesRequired, composeValidators } from '../../../../../util/validators';
import { FieldDateRangePicker } from '../../../../../components';

import {
  getStartOfNextMonth,
  getStartOfPrevMonth,
  extractDateFromFieldDateRangeInput,
  endOfAvailabilityExceptionRange,
  handleMonthClick,
  getMonthlyFetchRange,
  getInclusiveEndDate,
  getExclusiveEndDate,
} from '../availability.helpers';

import css from './ExceptionDateRange.module.css';

// Marketplace API allows fetching exceptions to 366 days into the future.
const MAX_RANGE_FOR_EXCEPTIONS = 366;
const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

// Format form's value for the DatePicker input: convert timeOfDay to the local time
const formatFieldDateInput = (isDaily, timeZone) => v => {
  const { startDate, endDate } = v || {};
  // Format the Final Form field's value for the DateRangeInput
  // DateRangeInput operates on local time zone, but the form uses listing's time zone
  const formattedStart = startDate ? timeOfDayFromTimeZoneToLocal(startDate, timeZone) : startDate;
  const endDateForPicker = isDaily && endDate ? getInclusiveEndDate(endDate, timeZone) : endDate;
  const formattedEnd = endDateForPicker
    ? timeOfDayFromTimeZoneToLocal(endDateForPicker, timeZone)
    : endDateForPicker;
  return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
};

// Parse DatePicker input's value: convert timeOfDay to the given time zone
const parseFieldDateInput = (isDaily, timeZone) => v => {
  const { startDate, endDate } = v || {};
  // Parse the DateRangeInput's value (local noon) for the Final Form
  // The form expects listing's time zone and start of day aka 00:00
  const parsedStart = startDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
    : startDate;
  const parsedEnd = endDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
    : endDate;
  const endDateForAPI = parsedEnd && isDaily ? getExclusiveEndDate(parsedEnd, timeZone) : parsedEnd;
  return v ? { startDate: parsedStart, endDate: endDateForAPI } : v;
};

const showNextMonthStepper = (currentMonth, timeZone) => {
  const nextMonthDate = getStartOfNextMonth(currentMonth, timeZone);
  const endOfRange = endOfAvailabilityExceptionRange(timeZone, TODAY);

  return !isDateSameOrAfter(nextMonthDate, endOfRange);
};

const showPreviousMonthStepper = (currentMonth, timeZone) => {
  const prevMonthDate = getStartOfPrevMonth(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);
  return isDateSameOrAfter(prevMonthDate, currentMonthDate);
};

const isDayBlocked = params => day => {
  const { exceptionStartDay, exceptionEndDay, availableDates, isDaily, timeZone } = params;
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);

  const dayData = availableDates[stringifyDateToISO8601(localizedDay, timeZone)];
  const hasAvailabilityOnDay = dayData == null ? false : dayData?.slots?.length > 0;

  if (!isDaily && exceptionStartDay) {
    // Nightly
    // For the unit type night, we check that the available range of the selected exceptionStartDay
    // ends on a given _day_
    const startDayIdString = stringifyDateToISO8601(exceptionStartDay, timeZone);
    const startDayData = availableDates[startDayIdString];
    const startDayException = startDayData == null ? true : startDayData?.slots?.[0];
    const { start, end } = startDayException || {};
    // If both exceptionStartDay and exceptionEndDay have been selected, we allow selecting other ranges
    const hasAvailability =
      exceptionStartDay && exceptionEndDay
        ? hasAvailabilityOnDay
        : isInRange(localizedDay, start, end, 'day', timeZone);
    const exceptionEndsOnThisDay = end && isSameDay(localizedDay, end, timeZone);

    return !(hasAvailability || exceptionEndsOnThisDay);
  } else {
    // Daily
    return !hasAvailabilityOnDay;
  }
};

const isOutsideRange = timeZone => day => {
  // 'day' is pointing to browser's local time-zone (DatePicker gives these).
  // However, exceptionStartDay and other times refer to listing's timeZone.
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
  const rangeStart = getStartOf(TODAY, 'day', timeZone);
  const rangeEnd = getStartOf(rangeStart, 'day', timeZone, MAX_RANGE_FOR_EXCEPTIONS, 'days');
  // past days and days on next year are outside of actionable availability range.
  const isOutsideRange = !isInRange(localizedDay, rangeStart, rangeEnd);
  return isOutsideRange;
};

const isBlockedBetween = (availableDates, isDaily, timeZone) => ([startDate, endDate]) => {
  const localizedStartDay = timeOfDayFromLocalToTimeZone(startDate, timeZone);
  const localizedEndDay = timeOfDayFromLocalToTimeZone(endDate, timeZone);
  const dayData = availableDates[stringifyDateToISO8601(localizedStartDay, timeZone)];
  const slot = dayData?.slots?.[0];
  if (!slot) {
    return true;
  }

  // endDate should be included in the slot mapped with startDate
  const isExcludedEnd = !isDaily && isSameDay(localizedEndDay, slot.end, timeZone);
  const isBlockedBetween = !(isInRange(localizedEndDay, slot.start, slot.end) || isExcludedEnd);
  return isBlockedBetween;
};

// Function that can be passed to nested components
// so that they can notify this component when the
// focused input changes.
const handleFocusedInputChange = setFocusedInput => focusedInput => {
  setFocusedInput(focusedInput);
};

//////////////////////////////////////////
// EditListingAvailabilityExceptionForm //
//////////////////////////////////////////
/**
 * @typedef {Object} AvailabilityException
 * @property {string} id
 * @property {'availabilityException'} type 'availabilityException'
 * @property {Object} attributes            API entity's attributes
 * @property {Date} attributes.start        The start of availability exception (inclusive)
 * @property {Date} attributes.end          The end of availability exception (exclusive)
 * @property {Number} attributes.seats      The number of seats available (0 means 'unavailable')
 */
/**
 * @typedef {Object} MonthlyExceptionQueryInfo
 * @property {Object?} fetchExceptionsError
 * @property {boolean} fetchExceptionsInProgress
 */

/**
 * A DateRange field for the form
 *
 * @component
 * @param {Object} props
 * @param {string?} props.formId
 * @param {UUID?} props.listingId listing's id
 * @param {ReactIntl} props.intl
 * @param {Array<AvailabilityException>} props.allExceptions
 * @param {Object.<string, MonthlyExceptionQueryInfo>?} props.monthlyExceptionQueries E.g. '2022-12': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Function} props.onFetchExceptions Redux Thunk function to fetch AvailabilityExceptions
 * @param {Function} props.onMonthChanged Redux Thunk function to fetch AvailabilityExceptions
 * @param {string} props.timeZone IANA time zone key (listing's time zone)
 * @param {boolean} props.isDaily
 * @param {Object} props.values form's values
 * @returns {JSX.Element} containing date range field
 */
const ExceptionDateRange = props => {
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', props.timeZone));
  const {
    formId,
    listingId,
    intl,
    onFetchExceptions,
    onMonthChanged,
    monthlyExceptionQueries,
    allExceptions,
    timeZone,
    values,
    isDaily,
  } = props;

  const idPrefix = `${formId}` || 'EditListingAvailabilityExceptionForm';
  const { exceptionRange } = values;
  const {
    startDate: exceptionStartDay,
    endDate: exceptionEndDay,
  } = extractDateFromFieldDateRangeInput(exceptionRange);
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyExceptionQueries, timeZone);
  const availableDates = exceptionFreeSlotsPerDate(startMonth, endMonth, allExceptions, timeZone);

  useEffect(() => {
    if (appSettings.dev && appSettings.verbose) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);
      console.log(
        `Fetched months: ${monthIdString(startMonth)} ... ${monthIdString(lastFetchedMonth)}`,
        '\nExceptions found:',
        allExceptions
      );
      console.log('Dates with availability info:', availableDates);
    }
  }, [currentMonth]);

  // Returns a function that changes the current month
  // Currently, used for hiding next&prev month arrow icons.
  const monthClickParams = {
    currentMonth,
    setCurrentMonth,
    monthlyExceptionQueries,
    listingId,
    timeZone,
    onFetchExceptions,
    onMonthChanged,
  };
  const onMonthClick = handleMonthClick(monthClickParams);

  const startOfToday = getStartOf(TODAY, 'day', timeZone);

  return (
    <>
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldDateRangePicker
            className={css.fieldDateInput}
            name="exceptionRange"
            isDaily={isDaily}
            startDateId={`${idPrefix}.exceptionStartDate`}
            startDateLabel={intl.formatMessage({
              id: 'EditListingAvailabilityExceptionForm.exceptionStartDateLabel',
            })}
            startDatePlaceholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            endDateId={`${idPrefix}.exceptionEndDate`}
            endDateLabel={intl.formatMessage({
              id: 'EditListingAvailabilityExceptionForm.exceptionEndDateLabel',
            })}
            endDatePlaceholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            onFocusedInputChange={handleFocusedInputChange(setFocusedInput)}
            format={formatFieldDateInput(isDaily, timeZone)}
            parse={parseFieldDateInput(isDaily, timeZone)}
            validate={composeValidators(
              required(
                intl.formatMessage({
                  id: 'BookingDatesForm.requiredDate',
                })
              ),
              bookingDatesRequired(
                intl.formatMessage({
                  id: 'FieldDateRangeInput.invalidStartDate',
                }),
                intl.formatMessage({
                  id: 'FieldDateRangeInput.invalidEndDate',
                })
              )
            )}
            showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
            showNextMonthStepper={showNextMonthStepper(currentMonth, timeZone)}
            onMonthChange={date => {
              const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
              onMonthClick(
                localizedDate < currentMonth ? getStartOfPrevMonth : getStartOfNextMonth
              );
              setCurrentMonth(localizedDate);
            }}
            isOutsideRange={isOutsideRange(timeZone)}
            isDayBlocked={isDayBlocked({
              exceptionStartDay,
              exceptionEndDay,
              availableDates,
              isDaily,
              timeZone,
            })}
            isBlockedBetween={isBlockedBetween(availableDates, isDaily, timeZone)}
            onClose={() => {
              setCurrentMonth(exceptionStartDay || exceptionEndDay || startOfToday);
            }}
            useMobileMargins
          />
        </div>
      </div>
    </>
  );
};

export default ExceptionDateRange;
