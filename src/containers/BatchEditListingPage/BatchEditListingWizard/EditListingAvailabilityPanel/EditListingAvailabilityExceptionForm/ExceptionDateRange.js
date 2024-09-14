import React, { useState, useEffect } from 'react';

import appSettings from '../../../../../config/settings';
import {
  END_DATE,
  START_DATE,
  getStartOf,
  initialVisibleMonth,
  isInRange,
  isSameDay,
  stringifyDateToISO8601,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
} from '../../../../../util/dates';
import { exceptionFreeSlotsPerDate } from '../../../../../util/generators';
import { required, bookingDatesRequired, composeValidators } from '../../../../../util/validators';
import { FieldDateRangeInput } from '../../../../../components';

import {
  getStartOfNextMonth,
  getStartOfPrevMonth,
  extractDateFromFieldDateRangeInput,
  endOfAvailabilityExceptionRange,
  handleMonthClick,
  getMonthlyFetchRange,
} from '../availability.helpers';

import Next from '../NextArrow';
import Prev from '../PrevArrow';

import css from './ExceptionDateRange.module.css';

// Marketplace API allows fetching exceptions to 366 days into the future.
const MAX_RANGE_FOR_EXCEPTIONS = 366;
const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

// Format form's value for the react-dates input: convert timeOfDay to the local time
const formatFieldDateInput = timeZone => v => {
  const { startDate, endDate } = v || {};
  // Format the Final Form field's value for the DateRangeInput
  // DateRangeInput operates on local time zone, but the form uses listing's time zone
  const formattedStart = startDate ? timeOfDayFromTimeZoneToLocal(startDate, timeZone) : startDate;
  const formattedEnd = endDate ? timeOfDayFromTimeZoneToLocal(endDate, timeZone) : endDate;
  return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
};

// Parse react-dates input's value: convert timeOfDay to the given time zone
const parseFieldDateInput = timeZone => v => {
  const { startDate, endDate } = v || {};
  // Parse the DateRangeInput's value (local noon) for the Final Form
  // The form expects listing's time zone and start of day aka 00:00
  const parsedStart = startDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
    : startDate;
  const parsedEnd = endDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
    : endDate;
  return v ? { startDate: parsedStart, endDate: parsedEnd } : v;
};

const isBlockedIfStartIsSelected = params => {
  const {
    exceptionStartDay,
    availableDates,
    isDaily,
    timeZone,
    localizedDay,
    focusedInput,
  } = params;
  const exceptionStart = timeOfDayFromLocalToTimeZone(exceptionStartDay, timeZone);
  const dayData = availableDates[stringifyDateToISO8601(exceptionStart, timeZone)];

  // The day is blocked, if no dayData found
  if (dayData == null) {
    return true;
  }
  const slot = dayData.slots[0];
  if (!slot) {
    console.log(params, 'exceptionStart', exceptionStart);
  }
  // The range end is longer with night booking: excluded range end should be selectable as range end.
  const rangeEnd =
    !isDaily && focusedInput === END_DATE
      ? getStartOf(slot.end, 'day', timeZone, 1, 'day')
      : getStartOf(slot.end, 'day', timeZone);
  const isOutsideRange = !isInRange(localizedDay, exceptionStart, rangeEnd);
  return isOutsideRange;
};

const isBlockedIfEndIsSelected = params => {
  const { exceptionEndDay, availableDates, timeZone, localizedDay } = params;
  const exceptionEnd = timeOfDayFromLocalToTimeZone(exceptionEndDay, timeZone);
  const lastIncludedDay = getStartOf(exceptionEnd, 'day', timeZone, -1, 'day');
  const dayData = availableDates[stringifyDateToISO8601(lastIncludedDay, timeZone)];

  // The day is blocked, if no dayData found or dayData doesn't have availability slots
  if (dayData == null || dayData.slots?.length === 0) {
    return true;
  }

  const slot = dayData.slots[0];
  const rangeStart = getStartOf(slot.start, 'day', timeZone);
  const isOutsideRange = !isInRange(localizedDay, rangeStart, exceptionEnd);
  return isOutsideRange;
};

const isDayBlocked = params => focusedInput => day => {
  const { exceptionStartDay, exceptionEndDay, availableDates, isDaily, timeZone } = params;
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);

  if (exceptionStartDay && exceptionEndDay == null) {
    // Handle case, where only start day is selected
    return isBlockedIfStartIsSelected({
      exceptionStartDay,
      availableDates,
      isDaily,
      timeZone,
      localizedDay,
      focusedInput,
    });
  } else if (exceptionEndDay && exceptionStartDay == null) {
    // Handle case, where only end day is selected
    return isBlockedIfEndIsSelected({ exceptionEndDay, availableDates, timeZone, localizedDay });
  }

  // If focused input is START_DATE, we rely on the existence of availability slots.
  if (focusedInput === START_DATE) {
    const dayData = availableDates[stringifyDateToISO8601(localizedDay, timeZone)];
    return dayData == null ? true : dayData.slots?.length === 0;
  }

  // If focused input is END_DATE, we only allow selection within a slot
  // found on target date (e.g. start day of a new exception)
  // Note: this just avoids closing of date range picker prematurely.
  const targetDate = exceptionStartDay
    ? exceptionStartDay
    : isDaily
    ? localizedDay
    : getStartOf(localizedDay, 'day', timeZone, -1, 'days');

  const dayData = availableDates[stringifyDateToISO8601(targetDate, timeZone)];
  const slot = dayData?.slots?.[0];

  const isInSlotRange = (date, slot, isDaily) => {
    const rangeStart = exceptionStartDay || slot.start;
    const isDayInRange = isInRange(date, rangeStart, slot.end);
    const isExcludedEnd = isSameDay(date, slot.end, timeZone);
    return isDaily ? isDayInRange : isDayInRange || isExcludedEnd;
  };

  return slot ? !isInSlotRange(localizedDay, slot, isDaily) : true;
};

const isOutsideRange = timeZone => focusedInput => day => {
  // 'day' is pointing to browser's local time-zone (react-dates gives these).
  // However, exceptionStartDay and other times refer to listing's timeZone.
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
  const rangeStart = getStartOf(TODAY, 'day', timeZone);
  const rangeEnd = getStartOf(rangeStart, 'day', timeZone, MAX_RANGE_FOR_EXCEPTIONS, 'days');
  // past days and days on next year are outside of actionable availability range.
  const isOutsideRange = !isInRange(localizedDay, rangeStart, rangeEnd);
  return isOutsideRange;
};

const isBlockedBetween = (availableDates, isDaily, timeZone) => (startDate, endDate) => {
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
          <FieldDateRangeInput
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
            focusedInput={focusedInput}
            onFocusedInputChange={handleFocusedInputChange(setFocusedInput)}
            format={formatFieldDateInput(timeZone)}
            parse={parseFieldDateInput(timeZone)}
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
            initialVisibleMonth={initialVisibleMonth(exceptionStartDay || startOfToday, timeZone)}
            navNext={
              <Next
                showUntilDate={endOfAvailabilityExceptionRange(timeZone, TODAY)}
                startOfNextRange={getStartOfNextMonth(currentMonth, timeZone)}
              />
            }
            navPrev={
              <Prev
                showUntilDate={getStartOf(TODAY, 'month', timeZone)}
                startOfPrevRange={getStartOf(currentMonth, 'month', timeZone, -1, 'months')}
              />
            }
            onPrevMonthClick={() => onMonthClick(getStartOfPrevMonth)}
            onNextMonthClick={() => onMonthClick(getStartOfNextMonth)}
            isDayBlocked={isDayBlocked({
              exceptionStartDay,
              exceptionEndDay,
              availableDates,
              isDaily,
              timeZone,
            })}
            isOutsideRange={isOutsideRange(timeZone)}
            isBlockedBetween={isBlockedBetween(availableDates, isDaily, timeZone)}
            onClose={event =>
              setCurrentMonth(getStartOf(event?.startDate ?? startOfToday, 'month', timeZone))
            }
            useMobileMargins
          />
        </div>
      </div>
    </>
  );
};

export default ExceptionDateRange;
