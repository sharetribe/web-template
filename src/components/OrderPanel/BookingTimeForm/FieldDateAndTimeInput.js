import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import {
  getStartHours,
  getEndHours,
  isInRange,
  isSameDate,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  isDateSameOrAfter,
  findNextBoundary,
  timestampToDate,
  monthIdString,
  getStartOf,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { bookingDateRequired } from '../../../util/validators';
import { FieldSingleDatePicker, FieldSelect } from '../../../components';

import {
  TODAY,
  isToday,
  nextMonthFn,
  prevMonthFn,
  endOfRange,
  getPlaceholder,
  getMonthlyFetchRange,
  getAllTimeSlots,
  getTimeSlotsOnDate,
  getTimeSlotsOnSelectedDate,
  showNextMonthStepper,
  showPreviousMonthStepper,
} from '../booking.shared';

import css from './FieldDateAndTimeInput.module.css';

// dayCountAvailableForBooking is the maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged:
// https://stripe.com/docs/connect/account-balances#holding-funds
//
// See also the API reference for querying time slots:
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots

const getAvailableStartTimes = params => {
  const { intl, timeZone, bookingStart, timeSlotsOnSelectedDate } = params;

  if (timeSlotsOnSelectedDate.length === 0 || !timeSlotsOnSelectedDate[0] || !bookingStart) {
    return [];
  }
  const bookingStartDate = getStartOf(bookingStart, 'day', timeZone);

  const allHours = timeSlotsOnSelectedDate.reduce((availableHours, t) => {
    const startDate = t.attributes.start;
    const endDate = t.attributes.end;
    const nextDate = getStartOf(bookingStartDate, 'day', timeZone, 1, 'days');

    // If the start date is after timeslot start, use the start date.
    // Otherwise use the timeslot start time.
    const startLimit = isDateSameOrAfter(bookingStartDate, startDate)
      ? bookingStartDate
      : startDate;

    // If date next to selected start date is inside timeslot use the next date to get the hours of full day.
    // Otherwise use the end of the timeslot.
    const endLimit = isDateSameOrAfter(endDate, nextDate) ? nextDate : endDate;

    const hours = getStartHours(startLimit, endLimit, timeZone, intl);
    return availableHours.concat(hours);
  }, []);
  return allHours;
};

const getAvailableEndTimes = params => {
  const { intl, timeZone, bookingStartTime, bookingEndDate, selectedTimeSlot } = params;
  if (!selectedTimeSlot || !selectedTimeSlot.attributes || !bookingEndDate || !bookingStartTime) {
    return [];
  }

  const endDate = selectedTimeSlot.attributes.end;
  const bookingStartTimeAsDate = timestampToDate(bookingStartTime);

  const dayAfterBookingEnd = getStartOf(bookingEndDate, 'day', timeZone, 1, 'days');
  const dayAfterBookingStart = getStartOf(bookingStartTimeAsDate, 'day', timeZone, 1, 'days');
  const startOfEndDay = getStartOf(bookingEndDate, 'day', timeZone);

  let startLimit;
  let endLimit;

  if (!isDateSameOrAfter(startOfEndDay, bookingStartTimeAsDate)) {
    startLimit = bookingStartTimeAsDate;
    endLimit = isDateSameOrAfter(dayAfterBookingStart, endDate) ? endDate : dayAfterBookingStart;
  } else {
    // If the end date is on the same day as the selected booking start time
    // use the start time as limit. Otherwise use the start of the selected end date.
    startLimit = isDateSameOrAfter(bookingStartTimeAsDate, startOfEndDay)
      ? bookingStartTimeAsDate
      : startOfEndDay;

    // If the selected end date is on the same day as timeslot end, use the timeslot end.
    // Else use the start of the next day after selected date.
    endLimit = isSameDate(getStartOf(endDate, 'day', timeZone), startOfEndDay)
      ? endDate
      : dayAfterBookingEnd;
  }

  return getEndHours(startLimit, endLimit, timeZone, intl);
};

// Use start date to calculate the first possible start time or times, end date and end time or times.
// If the selected value is passed to function it will be used instead of calculated value.
const getAllTimeValues = (
  intl,
  timeZone,
  timeSlots,
  startDate,
  selectedStartTime,
  selectedEndDate,
  selectedEndTime,
  seatsEnabled
) => {
  const startTimes = selectedStartTime
    ? []
    : getAvailableStartTimes({
        intl,
        timeZone,
        bookingStart: startDate,
        timeSlotsOnSelectedDate: getTimeSlotsOnDate(timeSlots, startDate, timeZone),
      });

  // Value selectedStartTime is a string when user has selected it through the form.
  // That's why we need to convert also the timestamp we use as a default
  // value to string for consistency. This is expected later when we
  // want to compare the sartTime and endTime.
  const startTime = selectedStartTime
    ? selectedStartTime
    : startTimes.length > 0 && startTimes[0] && startTimes[0].timestamp
    ? startTimes[0].timestamp.toString()
    : null;

  const startTimeAsDate = startTime ? timestampToDate(startTime) : null;

  // Note: We need to remove 1ms from the calculated endDate so that if the end
  // date would be the next day at 00:00 the day in the form is still correct.
  // Because we are only using the date and not the exact time we can remove the
  // 1ms.
  const endDate = selectedEndDate
    ? selectedEndDate
    : startTimeAsDate
    ? new Date(findNextBoundary(startTimeAsDate, 1, 'hour', timeZone).getTime() - 1)
    : null;

  const selectedEndTimeAsDateObject = selectedEndTime ? timestampToDate(selectedEndTime) : null;

  const selectedTimeSlotIndex = timeSlots.findIndex(t =>
    isInRange(startTimeAsDate, t.attributes.start, t.attributes.end)
  );

  const selectedTimeSlot =
    selectedTimeSlotIndex >= 0 ? timeSlots[selectedTimeSlotIndex] : undefined;

  const findLastAdjacent = index => {
    const current = timeSlots[index];
    const next = timeSlots[index + 1];
    return next && isSameDate(current.attributes.end, next.attributes.start)
      ? findLastAdjacent(index + 1)
      : index;
  };

  const findFirstAdjacent = index => {
    const current = timeSlots[index];
    const previous = timeSlots[index - 1];
    return previous && isSameDate(current.attributes.start, previous.attributes.end)
      ? findFirstAdjacent(index - 1)
      : index;
  };

  /**
   * Finds the smallest number of seats in time slots that meet the specified conditions.
   */
  const findMinimumAvailableSeats = (
    selectedEndTimeAsDateObject,
    timeSlots,
    selectedTimeSlotIndex
  ) => {
    // Retrieve the selected time slot from the list.
    const selectedTimeSlot = timeSlots[selectedTimeSlotIndex];
    if (!selectedTimeSlot) {
      return null; // Return null if the selected time slot is invalid.
    }

    // Check if the selected end time falls within the selected time slot.
    const endTimeIsWithinSelected = isInRange(
      selectedEndTimeAsDateObject - 1,
      selectedTimeSlot.attributes.start,
      selectedTimeSlot.attributes.end
    );

    if (endTimeIsWithinSelected) {
      return selectedTimeSlot.attributes.seats; // Return the seats for the selected time slot if end time and start time are within the same timeslot.
    }

    const lastIndex = findLastAdjacent(selectedTimeSlotIndex);

    // Extract the relevant time slots to check (we choose all slots between the first )
    const relevantTimeSlots = timeSlots.slice(selectedTimeSlotIndex, lastIndex + 1);

    // Find the smallest number of seats in the relevant time slots.
    const minSeats = relevantTimeSlots.reduce((smallest, timeslot) => {
      const seats = timeslot.attributes.seats;

      // Update the smallest seats found so far.
      const newSmallest = Math.min(smallest, seats);

      return newSmallest;
    }, 100); // Max seats value is 100

    return minSeats;
  };

  const combineTimeSlots = (currentTimeSlotIndex, timeSlots, seatsEnabled) => {
    if (currentTimeSlotIndex < 0 || !timeSlots || timeSlots.length === 0) {
      return null;
    }

    if (timeSlots.length === 1 || seatsEnabled === false) {
      return timeSlots[0];
    }
    const lastIndex = findLastAdjacent(currentTimeSlotIndex);
    const firstIndex = findFirstAdjacent(currentTimeSlotIndex);

    const smallestSeats = seatsEnabled
      ? findMinimumAvailableSeats(selectedEndTimeAsDateObject, timeSlots, currentTimeSlotIndex)
      : 1;

    const combinedTimeSlot = {
      ...timeSlots[currentTimeSlotIndex],
      attributes: {
        ...timeSlots[currentTimeSlotIndex].attributes,
        start: timeSlots[firstIndex].attributes.start,
        end: timeSlots[lastIndex].attributes.end,
        seats: smallestSeats,
      },
    };

    return combinedTimeSlot;
  };

  const combinedTimeSlot = combineTimeSlots(selectedTimeSlotIndex, timeSlots, seatsEnabled) || {};

  const endTimes = getAvailableEndTimes({
    intl,
    timeZone,
    bookingStartTime: startTime,
    bookingEndDate: endDate,
    selectedTimeSlot: combinedTimeSlot,
  });

  // We need to convert the timestamp we use as a default value
  // for endTime to string for consistency. This is expected later when we
  // want to compare the sartTime and endTime.
  const endTime =
    endTimes.length > 0 && endTimes[0] && endTimes[0].timestamp
      ? endTimes[0].timestamp.toString()
      : null;

  const finalTimeSlots = seatsEnabled ? combinedTimeSlot : selectedTimeSlot;

  return { startTime, endDate, endTime, selectedTimeSlot: finalTimeSlots };
};

const fetchMonthData = (
  date,
  listingId,
  dayCountAvailableForBooking,
  timeZone,
  onFetchTimeSlots
) => {
  const endOfRangeDate = endOfRange(TODAY, dayCountAvailableForBooking, timeZone);

  // Don't fetch timeSlots for past months or too far in the future
  if (isInRange(date, TODAY, endOfRangeDate)) {
    // Use "today", if the first day of given month is in the past
    const start = isDateSameOrAfter(TODAY, date) ? TODAY : date;

    // Use endOfRangeDate, if the first day of the next month is too far in the future
    const nextMonthDate = nextMonthFn(date, timeZone);
    const end = isDateSameOrAfter(nextMonthDate, endOfRangeDate)
      ? getStartOf(endOfRangeDate, 'day', timeZone)
      : nextMonthDate;

    const options = {
      extraQueryParams: {
        intervalDuration: 'P1D',
        maxPerInterval: 1,
        minDurationStartingInInterval: 60,
        perPage: 31,
        page: 1,
      },
    };

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, end, timeZone, options);
  }
};

const handleMonthClick = (
  currentMonth,
  monthlyTimeSlots,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots
) => monthFn => {
  // Callback function after month has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchMonthData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    dayCountAvailableForBooking,
    timeZone,
    onFetchTimeSlots
  );

  // If previous fetch for month data failed, try again.
  const monthId = monthIdString(currentMonth, timeZone);
  const currentMonthData = monthlyTimeSlots[monthId];
  if (currentMonthData && currentMonthData.fetchTimeSlotsError) {
    fetchMonthData(
      currentMonth,
      listingId,
      dayCountAvailableForBooking,
      timeZone,
      onFetchTimeSlots
    );
  }
};

const updateBookingFieldsOnStartDateChange = params => {
  const {
    timeSlotsOnDate,
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    formApi,
    intl,
  } = params;
  const minDurationStartingInDay = 60;
  const timeSlotsOnSelectedDate = getTimeSlotsOnSelectedDate(
    timeSlotsOnDate,
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    minDurationStartingInDay
  );
  const { startTime, endTime } = getAllTimeValues(
    intl,
    timeZone,
    timeSlotsOnSelectedDate,
    startDate,
    null,
    null,
    null,
    seatsEnabled
  );

  formApi.batch(() => {
    formApi.change('bookingStartTime', startTime);
    formApi.change('bookingEndTime', endTime);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
  return { startTime, endTime };
};

const onBookingStartDateChange = (props, setCurrentMonth) => value => {
  const {
    timeSlotsForDate,
    monthlyTimeSlots,
    timeZone,
    intl,
    form: formApi,
    handleFetchLineItems,
    seatsEnabled,
    listingId,
    onFetchTimeSlots,
    values,
  } = props;
  if (!value || !value.date) {
    formApi.batch(() => {
      formApi.change('bookingStartTime', null);
      formApi.change('bookingEndTime', null);
      if (seatsEnabled) {
        formApi.change('seats', 1);
      }
    });
    // Reset the currentMonth too if bookingStartDate is cleared
    setCurrentMonth(getStartOf(TODAY, 'month', timeZone));

    return;
  }

  const priceVariantName = values.priceVariantName || null;

  // This callback function (onBookingStartDateChange) is called from DatePicker component.
  // It gets raw value as a param - browser's local time instead of time in listing's timezone.
  const startDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
  const nextDay = getStartOf(startDate, 'day', timeZone, 1, 'days');

  const timeUnit = 'hour';
  const nextBoundaryToday = findNextBoundary(new Date(), 1, timeUnit, timeZone);
  const nextBoundary = isToday(startDate, timeZone)
    ? nextBoundaryToday
    : findNextBoundary(startDate, 1, timeUnit, timeZone);
  const startLimit = isDateSameOrAfter(startDate, nextBoundaryToday) ? startDate : nextBoundary;
  const endLimit = nextDay; // Note: the endLimit could be pushed to the next day: getStartOf(nextDay, 'minute', timeZone, 300, 'minutes');
  const cachedTimeSlotsForDate =
    timeSlotsForDate[stringifyDateToISO8601(startDate, timeZone)]?.timeSlots || [];

  const commonParamsForUpdateBookingFields = {
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    formApi,
    intl,
  };
  // Update booking fields with the initial time slot from the reduced set of monthly time slots.
  // Fetching date specific time slots and then line-items takes slightly longer
  const { startTime, endTime } = updateBookingFieldsOnStartDateChange({
    timeSlotsOnDate: cachedTimeSlotsForDate,
    ...commonParamsForUpdateBookingFields,
  });

  // Note: the first fetch for start-times (and line-items) is using monthlyTimeSlots.
  // This fetches all the date-specific time slots, which are update to option list asynchronously.
  onFetchTimeSlots(listingId, startLimit, endLimit, timeZone, {
    useFetchTimeSlotsForDate: true,
  }).then(timeSlots => {
    updateBookingFieldsOnStartDateChange({
      timeSlotsOnDate: timeSlots,
      ...commonParamsForUpdateBookingFields,
    });

    handleFetchLineItems({
      values: {
        priceVariantName,
        bookingStartTime: startTime,
        bookingEndTime: endTime,
        seats: seatsEnabled ? 1 : undefined,
      },
    });
  });
};

const onBookingStartTimeChange = props => value => {
  const {
    timeSlotsForDate,
    timeZone,
    intl,
    form: formApi,
    values,
    handleFetchLineItems,
    seatsEnabled,
  } = props;
  const priceVariantName = values.priceVariantName || null;
  const startDate = values.bookingStartDate.date;
  const bookingStartIdString = stringifyDateToISO8601(startDate, timeZone);
  const timeSlotsOnSelectedDate = timeSlotsForDate[bookingStartIdString]?.timeSlots || [];

  const { endTime } = getAllTimeValues(intl, timeZone, timeSlotsOnSelectedDate, startDate, value);

  formApi.batch(() => {
    formApi.change('bookingEndTime', endTime);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
  handleFetchLineItems({
    values: {
      priceVariantName,
      bookingStartTime: value,
      bookingEndTime: endTime,
      seats: seatsEnabled ? 1 : undefined,
    },
  });
};

const onBookingEndTimeChange = props => value => {
  const { values, handleFetchLineItems, form: formApi, seatsEnabled } = props;
  const priceVariantName = values.priceVariantName || null;

  if (seatsEnabled) {
    formApi.change('seats', 1);
  }

  handleFetchLineItems({
    values: {
      priceVariantName,
      bookingStartTime: values.bookingStartTime,
      bookingEndTime: value,
      seats: seatsEnabled ? 1 : undefined,
    },
  });
};

/////////////////////////////////////
// FieldDateAndTimeInput component //
/////////////////////////////////////

/**
 * @typedef {Object} MonthlyTimeSlotData
 * @property {Array<propTypes.timeSlot>} timeSlots - The time slots for the month
 * @property {propTypes.error} fetchTimeSlotsError - The error for the time slots
 * @property {boolean} fetchTimeSlotsInProgress - Whether the time slots are being fetched
 */
/**
 * @typedef {Object} TimeSlotData
 * @property {Array<propTypes.timeSlot>} timeSlots - The time slots for the month
 * @property {propTypes.error} fetchTimeSlotsError - The error for the time slots
 * @property {boolean} fetchTimeSlotsInProgress - Whether the time slots are being fetched
 * @property {number} timestamp - The timestamp of the time slot
 */
/**
 * A component that provides a date and time input for Final Forms.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The ID of the form
 * @param {boolean} [props.disabled] - Whether the field is disabled
 * @param {Object} [props.startDateInputProps] - The props for the start date input
 * @param {Object} [props.startTimeInputProps] - The props for the start time input
 * @param {Object} [props.endTimeInputProps] - The props for the end time input
 * @param {Object} props.form - The formApi object from Final Form
 * @param {Object} props.values - The values object from Final Form
 * @param {propTypes.uuid} [props.listingId] - The ID of the listing
 * @param {Object<string, MonthlyTimeSlotData>} [props.monthlyTimeSlots] - The monthly time slots object
 * @param {Object<string, TimeSlotData>} [props.timeSlotsForDate] - The time slots for the date
 * @param {Function} [props.onFetchTimeSlots] - The function to handle the fetching of time slots
 * @param {string} [props.timeZone] - The time zone of the listing
 * @param {number} [props.dayCountAvailableForBooking] - The number of days available for booking
 * @param {Object} [props.intl] - The intl object from react-intl
 * @returns {JSX.Element} FieldDateAndTimeInput component
 */
const FieldDateAndTimeInput = props => {
  const {
    rootClassName,
    className,
    formId,
    disabled,
    startDateInputProps,
    values,
    listingId,
    onFetchTimeSlots,
    monthlyTimeSlots,
    timeSlotsForDate,
    onMonthChanged,
    timeZone,
    setSeatsOptions,
    seatsEnabled,
    intl,
    dayCountAvailableForBooking,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));

  const pickerTimeSlots = getAllTimeSlots(monthlyTimeSlots, seatsEnabled);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, timeZone));
  const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  const bookingStartDate = values.bookingStartDate?.date || null;
  const bookingStartTime = values.bookingStartTime || null;
  const bookingEndDate = values.bookingEndDate?.date || null; // not used
  const bookingEndTime = values.bookingEndTime || null;

  // Currently available monthly data (reduced set of time slots data using intervalDuration: P1D)
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const minDurationStartingInDay = 60;
  const options = { minDurationStartingInDay };
  const monthlyTimeSlotsData = timeSlotsPerDate(
    startMonth,
    endMonth,
    pickerTimeSlots,
    timeZone,
    options
  );

  // Currently available date-specific data
  const bookingStartIdString = stringifyDateToISO8601(bookingStartDate, timeZone);
  const timeSlotsOnSelectedDate = timeSlotsForDate[bookingStartIdString]?.timeSlots || [];

  const timeSlotsOnDate = getTimeSlotsOnSelectedDate(
    timeSlotsOnSelectedDate,
    monthlyTimeSlots,
    bookingStartDate,
    timeZone,
    seatsEnabled,
    minDurationStartingInDay
  );

  const availableStartTimes = getAvailableStartTimes({
    intl,
    timeZone,
    bookingStart: bookingStartDate,
    timeSlotsOnSelectedDate: timeSlotsOnDate,
  });

  const firstAvailableStartTime =
    availableStartTimes.length > 0 && availableStartTimes[0] && availableStartTimes[0].timestamp
      ? availableStartTimes[0].timestamp
      : null;

  const { startTime, endDate, selectedTimeSlot } = getAllTimeValues(
    intl,
    timeZone,
    timeSlotsOnDate,
    bookingStartDate,
    bookingStartTime || firstAvailableStartTime,
    bookingEndDate || bookingStartDate,
    bookingEndTime,
    seatsEnabled
  );

  const seatsOptions = selectedTimeSlot?.attributes?.seats
    ? Array.from({ length: selectedTimeSlot.attributes.seats }, (_, i) => i + 1)
    : [];

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (onMonthChanged) {
      onMonthChanged(monthId);
    }
  }, [currentMonth]);

  useEffect(() => {
    // Log time slots marked for each day for debugging
    if (
      appSettings.dev &&
      appSettings.verbose &&
      !currentMonthInProgress &&
      !nextMonthInProgress &&
      monthlyTimeSlots &&
      timeZone
    ) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const tz = timeZone;
      const nextMonth = nextMonthFn(currentMonth, tz);
      const options = { minDurationStartingInDay: 60 };
      const monthlyTimeSlotsData = timeSlotsPerDate(
        currentMonth,
        nextMonth,
        pickerTimeSlots,
        tz,
        options
      );
      const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, tz);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);

      console.log(
        `Fetched months: ${monthIdString(startMonth, tz)} ... ${monthIdString(
          lastFetchedMonth,
          tz
        )}`,
        '\nTime slots for the current month:',
        monthlyTimeSlotsData
      );
    }
  }, [currentMonth, currentMonthInProgress, nextMonthInProgress, monthlyTimeSlots, timeZone]);

  useEffect(() => {
    setSeatsOptions(seatsOptions);
  }, [selectedTimeSlot?.attributes?.seats]);

  const availableEndTimes = getAvailableEndTimes({
    intl,
    timeZone,
    bookingStartTime: bookingStartTime || startTime,
    bookingEndDate: bookingEndDate || endDate,
    selectedTimeSlot,
  });

  const onMonthClick = handleMonthClick(
    currentMonth,
    monthlyTimeSlots,
    dayCountAvailableForBooking,
    timeZone,
    listingId,
    onFetchTimeSlots
  );

  const endOfAvailableRange = dayCountAvailableForBooking;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const startOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone);

  const isOutsideRange = day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    return (
      !isDateSameOrAfter(dayInListingTZ, startOfAvailableRangeDate) ||
      !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
    );
  };

  const isDayBlocked = day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    const dateIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const timeSlotData = monthlyTimeSlotsData[dateIdString];
    return !timeSlotData?.hasAvailability;
  };

  let placeholderTime = getPlaceholder('08:00', intl, timeZone);

  const startOfToday = getStartOf(TODAY, 'day', timeZone);
  const bookingEndTimeAvailable = bookingStartDate && (bookingStartTime || startTime);
  return (
    <div className={classes}>
      <div className={css.formRow}>
        <div className={classNames(css.field, css.startDate)}>
          <FieldSingleDatePicker
            className={css.fieldDatePicker}
            inputClassName={css.fieldDateInput}
            popupClassName={css.fieldDatePopup}
            disabled={disabled}
            showLabelAsDisabled={disabled}
            name="bookingStartDate"
            id={formId ? `${formId}.bookingStartDate` : 'bookingStartDate'}
            label={startDateInputProps.label}
            placeholderText={startDateInputProps.placeholderText}
            format={v =>
              v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : v
            }
            parse={v =>
              v && v.date ? { date: timeOfDayFromLocalToTimeZone(v.date, timeZone) } : v
            }
            useMobileMargins
            validate={bookingDateRequired(
              intl.formatMessage({ id: 'BookingTimeForm.requiredDate' })
            )}
            isDayBlocked={isDayBlocked}
            isOutsideRange={isOutsideRange}
            showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
            showNextMonthStepper={showNextMonthStepper(
              currentMonth,
              dayCountAvailableForBooking,
              timeZone
            )}
            onMonthChange={date => {
              const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
              onMonthClick(localizedDate < currentMonth ? prevMonthFn : nextMonthFn);
              setCurrentMonth(localizedDate);
            }}
            onChange={onBookingStartDateChange(props, setCurrentMonth)}
            onClose={() => {
              setCurrentMonth(bookingStartDate || startOfToday);
            }}
            fallback={
              <div className={classNames(css.fieldDatePicker, { [css.disabled]: disabled })}>
                <label>{startDateInputProps.label}</label>
                <input
                  className={classNames(css.fieldDateInput, css.fieldDateInputFallback)}
                  placeholder={startDateInputProps.placeholderText}
                  disabled={disabled}
                />
              </div>
            }
          />
        </div>
      </div>
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldSelect
            name="bookingStartTime"
            id={formId ? `${formId}.bookingStartTime` : 'bookingStartTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.startTime' })}
            disabled={!bookingStartDate}
            showLabelAsDisabled={!bookingStartDate}
            onChange={onBookingStartTimeChange(props)}
          >
            {bookingStartDate ? (
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

        <div className={bookingStartDate ? css.lineBetween : css.lineBetweenDisabled}>-</div>

        <div className={css.field}>
          <FieldSelect
            name="bookingEndTime"
            id={formId ? `${formId}.bookingEndTime` : 'bookingEndTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.endTime' })}
            disabled={!bookingEndTimeAvailable}
            showLabelAsDisabled={!bookingEndTimeAvailable}
            onChange={onBookingEndTimeChange(props)}
          >
            {bookingEndTimeAvailable ? (
              availableEndTimes.map(p => (
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
    </div>
  );
};

export default FieldDateAndTimeInput;
