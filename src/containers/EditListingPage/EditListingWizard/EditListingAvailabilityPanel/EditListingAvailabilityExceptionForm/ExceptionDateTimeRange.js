import React, { useState, useEffect } from 'react';

import appSettings from '../../../../../config/settings';
import {
  END_DATE,
  START_DATE,
  isSameDay,
  isInRange,
  timestampToDate,
  getStartOf,
  stringifyDateToISO8601,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  isDateSameOrAfter,
  findNextBoundary,
  getSharpHours,
  getStartHours,
  getEndHours,
  formatDateIntoPartials,
  monthIdString,
} from '../../../../../util/dates';
import { exceptionFreeSlotsPerDate } from '../../../../../util/generators';
import { bookingDateRequired } from '../../../../../util/validators';
import { FieldSingleDatePicker, FieldSelect } from '../../../../../components';

import {
  getStartOfNextMonth,
  getStartOfPrevMonth,
  extractDateFromFieldDateInput,
  endOfAvailabilityExceptionRange,
  handleMonthClick,
  getMonthlyFetchRange,
} from '../availability.helpers';

import css from './ExceptionDateTimeRange.module.css';

// Marketplace API allows fetching exceptions to 366 days into the future.
const MAX_RANGE_FOR_EXCEPTIONS = 366;
const TODAY = new Date();

// Date formatting used for placeholder texts:
const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

// Format form's value for the DatePicker input: convert timeOfDay to the local time
const formatFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : { date: v };

// Parse DatePicker input's value: convert timeOfDay to the given time zone
const parseFieldDateInput = timeZone => v =>
  v && v.date ? { date: timeOfDayFromLocalToTimeZone(v.date, timeZone) } : v;

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

// Get available start times for new exceptions on given date.
const getAvailableStartTimes = ({ selectedStartDate, availableSlots, intl, timeZone }) => {
  if (availableSlots.length === 0 || !availableSlots[0] || !selectedStartDate) {
    return [];
  }

  // Ensure 00:00 on correct time zone
  const startOfDate = getStartOf(selectedStartDate, 'day', timeZone);
  const nextDay = getStartOf(startOfDate, 'day', timeZone, 1, 'days');

  const allHours = availableSlots.reduce((availableHours, t) => {
    // time-range: start and end
    const { start, end } = t;

    // If the selectedStartDate is after start, use the date.
    // Otherwise use the start time.
    const startLimit = isDateSameOrAfter(startOfDate, start) ? startOfDate : start;

    // If the end date is after "the next day" / midnight, use the next date to get the hours of a full day.
    // Otherwise use the end of the timeslot.
    const endLimit = isDateSameOrAfter(end, nextDay) ? nextDay : end;

    const hours = getStartHours(startLimit, endLimit, timeZone, intl);
    return availableHours.concat(hours);
  }, []);
  return allHours;
};

// Get available end times for new exceptions on selected time range.
const getAvailableEndTimes = ({
  intl,
  timeZone,
  selectedSlot,
  selectedStartTime,
  selectedEndDate,
}) => {
  if (!selectedSlot || !selectedEndDate || !selectedStartTime) {
    return [];
  }

  const selectedSlotEnd = selectedSlot.end;
  const selectedStartTimeAsDate = timestampToDate(selectedStartTime);
  const isSingleDayRange = isSameDay(selectedStartTimeAsDate, selectedEndDate, timeZone);

  // Midnight of selectedEndDate
  const startOfSelectedEndDate = getStartOf(selectedEndDate, 'day', timeZone);
  // Next midnight after selectedEndDate
  const dayAfterSelectedEndDate = getStartOf(selectedEndDate, 'day', timeZone, 1, 'days');

  // Return slot's start time, if it happens after the beginning of selected end date
  // I.e. on "same day" situation, use start time, otherwise default to 00:00 of end date.
  const limitStart = isDateSameOrAfter(selectedStartTimeAsDate, startOfSelectedEndDate)
    ? selectedStartTimeAsDate
    : startOfSelectedEndDate;

  // Return slot's end, if it becomes before the end of the selected end date (next 00:00)
  // I.e. Get the hours of a full day, but no more.
  const limitEnd = isDateSameOrAfter(dayAfterSelectedEndDate, selectedSlotEnd)
    ? selectedSlotEnd
    : dayAfterSelectedEndDate;

  const selectableHours = isSingleDayRange
    ? getEndHours(limitStart, limitEnd, timeZone, intl)
    : getSharpHours(limitStart, limitEnd, timeZone, intl);

  const lastSelectableTimestamp = selectableHours[selectableHours.length - 1]?.timestamp;
  // If the selectable hour is "00:00" of the next day, we discard it to avoid confusion.
  const isNextDate = isSameDay(dayAfterSelectedEndDate, timestampToDate(lastSelectableTimestamp));
  return isNextDate ? selectableHours.slice(0, -1) : selectableHours;
};

// Use start date to calculate the first possible start time or times, end date and end time or times.
// If the selected value is passed to function it will be used instead of calculated value.
const getAllTimeValues = ({
  intl,
  timeZone,
  availableSlots,
  selectedStartDate,
  selectedStartTime,
  selectedEndDate,
}) => {
  const startTimes = getAvailableStartTimes({ selectedStartDate, availableSlots, intl, timeZone });
  const startTime = selectedStartTime ? selectedStartTime : startTimes?.[0]?.timestamp;
  const startTimeAsDate = startTime ? timestampToDate(startTime) : null;
  const selectedSlot = availableSlots.find(t => isInRange(startTimeAsDate, t.start, t.end));

  // Note: We need to remove 1ms from the calculated endDate so that if the end
  // date would be the next day at 00:00, the day in the form is still correct.
  // Because we are only using the date and not the exact time we can remove the
  // 1ms.
  const endDate = selectedEndDate
    ? selectedEndDate
    : startTimeAsDate
    ? new Date(findNextBoundary(startTimeAsDate, 'hour', timeZone).getTime() - 1)
    : null;

  const params = {
    intl,
    timeZone,
    selectedSlot,
    selectedStartTime: startTime,
    selectedEndDate: endDate,
  };
  const endTimes = getAvailableEndTimes(params);
  const endTime = endTimes?.[0]?.timestamp || null;

  return { startTime, endDate, endTime, selectedSlot };
};

// Prop function for DatePicker component: check if the day is blocked
// For start date, all dates with overlapping availability slots are available
// For end date, only dates within selected availability slot are available.
const isDayBlocked = params => day => {
  const { exceptionStartDay, exceptionStartTime, availableDates, timeZone, focusedInput } = params;
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);

  // If focused input is START_DATE, we rely on the existence of availability slots.
  if (focusedInput === START_DATE) {
    const dayData = availableDates[stringifyDateToISO8601(localizedDay, timeZone)];
    return dayData == null ? true : dayData.slots?.length === 0;
  }

  // If focused input is END_DATE, we only allow selection within a slot
  // found on target date (e.g. start day of a new exception)
  const dayData = availableDates[stringifyDateToISO8601(exceptionStartDay, timeZone)];
  const slots = dayData?.slots || [];
  const selectedSlot = exceptionStartTime
    ? slots.find(t => isInRange(timestampToDate(exceptionStartTime), t.start, t.end))
    : slots[0];

  const isInSlotRange = (date, slot) => {
    const rangeStart = exceptionStartTime ? timestampToDate(exceptionStartTime) : slot.start;
    const isDayInRange = isInRange(date, rangeStart, slot.end, 'day', timeZone);
    const isExcludedEnd = isSameDay(date, slot.end, timeZone);
    return isDayInRange || isExcludedEnd;
  };

  return selectedSlot ? !isInSlotRange(localizedDay, selectedSlot) : true;
};

// Prop function for DatePicker component: restrict availability within this range
// By default, it's today ... today+366d
const isOutsideRange = timeZone => day => {
  // 'day' is pointing to browser's local time zone (DatePicker gives these).
  // However, exceptionStartDay and other times refer to listing's timeZone.
  const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
  const rangeStart = getStartOf(TODAY, 'day', timeZone);
  const rangeEnd = getStartOf(rangeStart, 'day', timeZone, MAX_RANGE_FOR_EXCEPTIONS, 'days');
  // past days and days on next year are outside of actionable availability range.
  const isOutsideRange = !isInRange(localizedDay, rangeStart, rangeEnd);
  return isOutsideRange;
};

// Helper function, which changes form's state when exceptionStartDate input has been changed
const onExceptionStartDateChange = (value, availableDates, props) => {
  const { timeZone, intl, formApi } = props;

  if (!value || !value.date) {
    formApi.batch(() => {
      formApi.change('exceptionStartTime', null);
      formApi.change('exceptionEndDate', { date: null });
      formApi.change('exceptionEndTime', null);
    });
    return;
  }

  // This callback function is called from DatePicker component.
  // It gets raw value as a param - browser's local time instead of time in listing's timezone.
  const selectedStartDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
  const dayData = availableDates[stringifyDateToISO8601(selectedStartDate, timeZone)];
  const availableSlots = dayData.slots || [];
  const params = { intl, timeZone, availableSlots, selectedStartDate };
  const { startTime, endDate, endTime } = getAllTimeValues(params);

  formApi.batch(() => {
    formApi.change('exceptionStartTime', startTime);
    formApi.change('exceptionEndDate', { date: endDate });
    formApi.change('exceptionEndTime', endTime);
  });
};

// Helper function, which changes form's state when exceptionStartTime select has been changed
const onExceptionStartTimeChange = (value, availableSlots, props) => {
  const { timeZone, intl, formApi, values } = props;
  const selectedStartDate = values.exceptionStartDate.date;
  const params = { intl, timeZone, availableSlots, selectedStartDate, selectedStartTime: value };
  const { endDate, endTime } = getAllTimeValues(params);

  formApi.batch(() => {
    formApi.change('exceptionEndDate', { date: endDate });
    formApi.change('exceptionEndTime', endTime);
  });
};

// Helper function, which changes form's state when exceptionEndDate input has been changed
const onExceptionEndDateChange = (value, availableSlots, props) => {
  const { timeZone, intl, formApi, values } = props;
  if (!value || !value.date) {
    formApi.change('exceptionEndDate', null);
    return;
  }

  const { exceptionStartDate: exceptionStart, exceptionStartTime: selectedStartTime } = values;
  const selectedStartDate = exceptionStart.date;

  // This callback function is called from DatePicker component.
  // It gets raw value as a param - browser's local time instead of time in listing's timezone.
  const selectedEndDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
  const params = {
    intl,
    timeZone,
    availableSlots,
    selectedStartDate,
    selectedStartTime,
    selectedEndDate,
  };
  const { endTime } = getAllTimeValues(params);

  formApi.change('exceptionEndTime', endTime);
};

//////////////////////////////////////////
// EditListingAvailabilityExceptionForm //
//////////////////////////////////////////
const ExceptionDateTimeRange = props => {
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
  } = props;

  const idPrefix = `${formId}` || 'EditListingAvailabilityExceptionForm';
  const { exceptionStartDate, exceptionStartTime = null, exceptionEndDate } = values;
  const exceptionStartDay = extractDateFromFieldDateInput(exceptionStartDate);
  const exceptionEndDay = extractDateFromFieldDateInput(exceptionEndDate);

  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyExceptionQueries, timeZone);
  const availableDates = exceptionFreeSlotsPerDate(startMonth, endMonth, allExceptions, timeZone);

  useEffect(() => {
    if (appSettings.dev && appSettings.verbose) {
      // This side effect just prints debug data into the console.log feed.
      console.log(
        `Fetched months: ${monthIdString(startMonth)} - exclusive(${monthIdString(endMonth)})`,
        '\nExceptions found:',
        allExceptions
      );
      console.log('Dates with availability info:', availableDates);
    }
  }, [currentMonth]);

  const dayData = exceptionStartDay
    ? availableDates[stringifyDateToISO8601(exceptionStartDay, timeZone)]
    : null;
  const availableSlotsOnSelectedDate = dayData?.slots || [];

  const startTimeParams = {
    intl,
    timeZone,
    availableSlots: availableSlotsOnSelectedDate,
    selectedStartDate: exceptionStartDay,
  };
  const availableStartTimes = getAvailableStartTimes(startTimeParams);
  // Get selected (or suggested) startTime, endDate, and slot (aka available time range)
  const { startTime, endDate, selectedSlot } = getAllTimeValues({
    ...startTimeParams,
    selectedStartTime: exceptionStartTime || availableStartTimes?.[0]?.timestamp,
    selectedEndDate: exceptionEndDay || exceptionStartDay,
  });
  const availableEndTimes = getAvailableEndTimes({
    ...startTimeParams,
    selectedSlot,
    selectedStartTime: exceptionStartTime || startTime,
    selectedEndDate: exceptionEndDay || endDate,
  });

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

  const startTimeDisabled = !exceptionStartDate;
  const endDateDisabled = !exceptionStartDate || !exceptionStartTime;
  const endTimeDisabled = !exceptionStartDate || !exceptionStartTime || !exceptionEndDate;
  const nextBoundary = findNextBoundary(TODAY, 'hour', timeZone);
  let placeholderTime = '08:00';
  try {
    placeholderTime = formatDateIntoPartials(nextBoundary, intl, { timeZone })?.time;
  } catch (error) {
    // No need to handle error
  }

  const startOfToday = getStartOf(TODAY, 'day', timeZone);

  return (
    <>
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldSingleDatePicker
            name="exceptionStartDate"
            id={`${idPrefix}.exceptionStartDate`}
            className={css.fieldDatePicker}
            inputClassName={css.fieldDateInput}
            popupClassName={css.fieldDatePopup}
            label={intl.formatMessage({
              id: 'EditListingAvailabilityExceptionForm.exceptionStartDateLabel',
            })}
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timeZone)}
            parse={parseFieldDateInput(timeZone)}
            showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
            showNextMonthStepper={showNextMonthStepper(currentMonth, timeZone)}
            onMonthChange={date => {
              const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
              onMonthClick(
                localizedDate < currentMonth ? getStartOfPrevMonth : getStartOfNextMonth
              );
              setCurrentMonth(localizedDate);
            }}
            isDayBlocked={isDayBlocked({
              exceptionStartDay,
              exceptionStartTime,
              exceptionEndDay,
              availableDates,
              timeZone,
              focusedInput: START_DATE,
            })}
            isOutsideRange={isOutsideRange(timeZone)}
            onChange={value => onExceptionStartDateChange(value, availableDates, props)}
            useMobileMargins
            showErrorMessage={false}
            validate={bookingDateRequired('Required')}
          />
        </div>
        <div className={css.field}>
          <FieldSelect
            name="exceptionStartTime"
            id={`${idPrefix}.exceptionStartTime`}
            className={exceptionStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={exceptionStartDate ? css.select : css.selectDisabled}
            disabled={startTimeDisabled}
            onChange={value =>
              onExceptionStartTimeChange(value, availableSlotsOnSelectedDate, props)
            }
          >
            {exceptionStartDay ? (
              availableStartTimes.map(p => (
                <option key={p.timestamp} value={p.timestamp}>
                  {p.timeOfDay}
                </option>
              ))
            ) : (
              <option>{placeholderTime}</option>
            )}
          </FieldSelect>
        </div>
      </div>
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldSingleDatePicker
            name="exceptionEndDate"
            id={`${idPrefix}.exceptionEndDate`}
            className={css.fieldDatePicker}
            inputClassName={css.fieldDateInput}
            popupClassName={css.fieldDatePopup}
            label={intl.formatMessage({
              id: 'EditListingAvailabilityExceptionForm.exceptionEndDateLabel',
            })}
            placeholderText={intl.formatDate(TODAY, dateFormattingOptions)}
            format={formatFieldDateInput(timeZone)}
            parse={parseFieldDateInput(timeZone)}
            isDayBlocked={isDayBlocked({
              exceptionStartDay,
              exceptionStartTime,
              exceptionEndDay,
              availableDates,
              timeZone,
              focusedInput: END_DATE,
            })}
            startDate={stringifyDateToISO8601(exceptionEndDay || exceptionStartDay || TODAY)}
            isOutsideRange={isOutsideRange(timeZone)}
            onChange={value => onExceptionEndDateChange(value, availableSlotsOnSelectedDate, props)}
            useMobileMargins
            showErrorMessage={false}
            validate={bookingDateRequired('Required')}
            disabled={endDateDisabled}
            showLabelAsDisabled={endDateDisabled}
          />
        </div>
        <div className={css.field}>
          <FieldSelect
            name="exceptionEndTime"
            id={`${idPrefix}.exceptionEndTime`}
            className={exceptionStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={exceptionStartDate ? css.select : css.selectDisabled}
            disabled={endTimeDisabled}
          >
            {exceptionStartDay && exceptionStartTime && endDate ? (
              availableEndTimes.map((p, i) => {
                const isLastIndex = i === availableEndTimes.length - 1;
                const timeOfDay = p.timeOfDay === '00:00' && isLastIndex ? '24:00' : p.timeOfDay;
                return (
                  <option key={p.timestamp} value={p.timestamp}>
                    {timeOfDay}
                  </option>
                );
              })
            ) : (
              <option>{placeholderTime}</option>
            )}
          </FieldSelect>
        </div>
      </div>
    </>
  );
};

export default ExceptionDateTimeRange;
