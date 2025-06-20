import React, { useEffect, useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import {
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
  getBoundaries,
  bookingTimeUnits,
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

const findLastAdjacent = (index, timeSlots) => {
  const current = timeSlots[index];
  const next = timeSlots[index + 1];
  return next && isSameDate(current.attributes.end, next.attributes.start)
    ? findLastAdjacent(index + 1, timeSlots)
    : index;
};

// dayCountAvailableForBooking is the maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged:
// https://stripe.com/docs/connect/account-balances#holding-funds
//
// See also the API reference for querying time slots:
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots

const getAvailableStartTimes = params => {
  const {
    intl,
    timeZone,
    bookingStart,
    timeSlotsOnSelectedDate,
    bookingLengthInMinutes,
    startTimeInterval,
  } = params;

  if (timeSlotsOnSelectedDate.length === 0 || !timeSlotsOnSelectedDate[0] || !bookingStart) {
    return [];
  }
  const bookingStartDate = getStartOf(bookingStart, 'day', timeZone);
  const nextDay = getStartOf(bookingStartDate, 'day', timeZone, 1, 'days');
  const timeUnitConfig = bookingTimeUnits[startTimeInterval];
  const overlapWithNextDay = !!timeUnitConfig?.timeUnitInMinutes
    ? bookingLengthInMinutes - timeUnitConfig.timeUnitInMinutes
    : bookingLengthInMinutes;
  const nextDayPlusBookingLength = getStartOf(
    nextDay,
    'minute',
    timeZone,
    overlapWithNextDay,
    'minutes'
  );

  const allStartTimes = timeSlotsOnSelectedDate.reduce((availableStartTimes, t, i) => {
    const startDate = t.attributes.start;
    const lastIndex = findLastAdjacent(i, timeSlotsOnSelectedDate);
    const endDate =
      lastIndex !== i ? timeSlotsOnSelectedDate[lastIndex].attributes.end : t.attributes.end;

    // If the time slot starts before the selected booking start date, use bookingStartDate
    const startLimit = isDateSameOrAfter(bookingStartDate, startDate)
      ? bookingStartDate
      : startDate;

    // If the time slot ends after the next day, use nextDate.
    const endOfTimeSlotOrDay = isDateSameOrAfter(endDate, nextDayPlusBookingLength)
      ? nextDayPlusBookingLength
      : endDate;
    const endLimit = getStartOf(
      endOfTimeSlotOrDay,
      'minute',
      timeZone,
      -1 * bookingLengthInMinutes,
      'minutes'
    );

    const startTimes = getBoundaries(
      startLimit,
      endLimit,
      1,
      timeUnitConfig.timeUnit,
      timeZone,
      intl
    );
    const pickedTimestamps = availableStartTimes.map(t => t.timestamp);
    const uniqueStartTimes = startTimes.filter(t => !pickedTimestamps.includes(t.timestamp));
    return availableStartTimes.concat(uniqueStartTimes);
  }, []);
  return allStartTimes;
};

const getBookingEndTimeAsDate = (bookingStartTime, bookingLengthInMinutes) => {
  const bookingEndTimeAsDate = new Date(
    bookingStartTime.getTime() + bookingLengthInMinutes * 60000
  );
  return bookingEndTimeAsDate;
};

// Use start date to calculate the first possible start time or times, end date and end time or times.
// If the selected value is passed to function it will be used instead of calculated value.
const getAllTimeValues = (
  intl,
  timeZone,
  timeSlots,
  startDate,
  selectedStartTime,
  bookingLengthInMinutes,
  startTimeInterval,
  seatsEnabled
) => {
  const startTimes = selectedStartTime
    ? []
    : getAvailableStartTimes({
        intl,
        timeZone,
        bookingStart: startDate,
        timeSlotsOnSelectedDate: getTimeSlotsOnDate(timeSlots, startDate, timeZone),
        bookingLengthInMinutes,
        startTimeInterval,
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
  const endTimeAsDate = startTimeAsDate
    ? getBookingEndTimeAsDate(startTimeAsDate, bookingLengthInMinutes)
    : null;

  const selectedTimeSlotIndex = timeSlots.findIndex(t =>
    isInRange(startTimeAsDate, t.attributes.start, t.attributes.end)
  );

  const selectedTimeSlot =
    selectedTimeSlotIndex >= 0 ? timeSlots[selectedTimeSlotIndex] : undefined;

  // findLastAdjacent is defined at the top of the file

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

    const lastIndex = findLastAdjacent(selectedTimeSlotIndex, timeSlots);

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
    const lastIndex = findLastAdjacent(currentTimeSlotIndex, timeSlots);
    const firstIndex = findFirstAdjacent(currentTimeSlotIndex, timeSlots);

    const smallestSeats = seatsEnabled
      ? findMinimumAvailableSeats(endTimeAsDate, timeSlots, currentTimeSlotIndex)
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

  const endTime = endTimeAsDate?.getTime().toString();
  const finalTimeSlots = seatsEnabled ? combinedTimeSlot : selectedTimeSlot;

  return { startTime, endTime, selectedTimeSlot: finalTimeSlots };
};

const fetchMonthData = (
  date,
  listingId,
  dayCountAvailableForBooking,
  timeZone,
  onFetchTimeSlots,
  minDurationStartingInInterval
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

    const nextMonthEnd = getStartOf(
      nextMonthDate,
      'minute',
      timeZone,
      minDurationStartingInInterval,
      'minutes'
    );

    const options = {
      extraQueryParams: {
        intervalDuration: 'P1D',
        maxPerInterval: 1,
        minDurationStartingInInterval,
        perPage: 31,
        page: 1,
      },
    };

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, nextMonthEnd, timeZone, options);
  }
};

const handleMonthClick = (
  currentMonth,
  monthlyTimeSlots,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots,
  minDurationStartingInInterval
) => monthFn => {
  // Callback function after month has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchMonthData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    dayCountAvailableForBooking,
    timeZone,
    onFetchTimeSlots,
    minDurationStartingInInterval
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
      onFetchTimeSlots,
      minDurationStartingInInterval
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
    bookingLengthInMinutes,
    startTimeInterval,
  } = params;
  const timeSlotsOnSelectedDate = getTimeSlotsOnSelectedDate(
    timeSlotsOnDate,
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    bookingLengthInMinutes
  );

  const { startTime, endTime } = getAllTimeValues(
    intl,
    timeZone,
    timeSlotsOnSelectedDate,
    startDate,
    null,
    bookingLengthInMinutes,
    startTimeInterval,
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
    startTimeInterval,
    priceVariants,
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
  const bookingLengthInMinutes = priceVariantName
    ? priceVariants.find(pv => pv.name === priceVariantName)?.bookingLengthInMinutes
    : priceVariants?.[0]?.bookingLengthInMinutes;

  // This callback function (onBookingStartDateChange) is called from DatePicker component.
  // It gets raw value as a param - browser's local time instead of time in listing's timezone.
  const startDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
  const nextDay = getStartOf(startDate, 'day', timeZone, 1, 'days');

  const timeUnit = bookingTimeUnits[startTimeInterval]?.timeUnit || 'day';
  const nextBoundaryToday = findNextBoundary(new Date(), 1, timeUnit, timeZone);
  const nextBoundary = isToday(startDate, timeZone)
    ? nextBoundaryToday
    : findNextBoundary(startDate, 1, timeUnit, timeZone);
  const startLimit = isDateSameOrAfter(startDate, nextBoundaryToday) ? startDate : nextBoundary;
  const endLimit = getStartOf(nextDay, 'minute', timeZone, bookingLengthInMinutes, 'minutes');
  const cachedTimeSlotsForDate =
    timeSlotsForDate[stringifyDateToISO8601(startDate, timeZone)]?.timeSlots || [];

  const commonParamsForUpdateBookingFields = {
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    formApi,
    intl,
    bookingLengthInMinutes,
    startTimeInterval,
  };

  // Update booking fields with the initial time slot from the reduced set of monthly time slots.
  // Fetching date specific time slots and then line-items takes slightly longer
  updateBookingFieldsOnStartDateChange({
    timeSlotsOnDate: cachedTimeSlotsForDate,
    ...commonParamsForUpdateBookingFields,
  });

  // Note: the first fetch for start-times (and line-items) is using monthlyTimeSlots.
  // This fetches all the date-specific time slots, which are update to option list asynchronously.
  onFetchTimeSlots(listingId, startLimit, endLimit, timeZone, {
    useFetchTimeSlotsForDate: true,
  }).then(timeSlots => {
    const { startTime, endTime } = updateBookingFieldsOnStartDateChange({
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
  const { form: formApi, handleFetchLineItems, seatsEnabled, priceVariants, values } = props;
  const priceVariantName = values.priceVariantName || null;
  const bookingLengthInMinutes = priceVariantName
    ? priceVariants.find(pv => pv.name === priceVariantName)?.bookingLengthInMinutes
    : priceVariants?.[0]?.bookingLengthInMinutes;

  const endTime = getBookingEndTimeAsDate(
    new Date(Number.parseInt(value, 10)),
    bookingLengthInMinutes
  );

  formApi.batch(() => {
    formApi.change('bookingEndTime', endTime.getTime());
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
  handleFetchLineItems({
    values: {
      priceVariantName,
      bookingStartTime: value,
      bookingEndTime: endTime.getTime(),
      seats: seatsEnabled ? 1 : undefined,
    },
  });
};

const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
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
    startTimeInterval,
    onFetchTimeSlots,
    monthlyTimeSlots,
    timeSlotsForDate,
    minDurationStartingInInterval,
    onMonthChanged,
    timeZone,
    setSeatsOptions,
    seatsEnabled,
    priceVariants,
    intl,
    dayCountAvailableForBooking,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const priceVariantName = values.priceVariantName;
  const bookingLengthInMinutes =
    priceVariants?.length > 1
      ? priceVariants.find(pv => pv.name === priceVariantName)?.bookingLengthInMinutes
      : priceVariants?.[0]?.bookingLengthInMinutes;

  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));

  const pickerTimeSlots = getAllTimeSlots(monthlyTimeSlots, seatsEnabled);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, timeZone));
  const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  const bookingStartDate = values.bookingStartDate?.date || null;
  const bookingStartTime = values.bookingStartTime || null;
  const bookingEndTime = values.bookingEndTime || null;

  // Currently available monthly data (reduced set of time slots data using intervalDuration: P1D)
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const options = { minDurationStartingInDay: minDurationStartingInInterval };
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
    bookingLengthInMinutes
  );

  const availableStartTimes = getAvailableStartTimes({
    intl,
    timeZone,
    bookingStart: bookingStartDate,
    timeSlotsOnSelectedDate: timeSlotsOnDate,
    bookingLengthInMinutes,
    startTimeInterval,
  });

  const firstAvailableStartTime =
    availableStartTimes.length > 0 && availableStartTimes[0] && availableStartTimes[0].timestamp
      ? availableStartTimes[0].timestamp
      : null;

  const { selectedTimeSlot } = getAllTimeValues(
    intl,
    timeZone,
    timeSlotsOnDate,
    bookingStartDate,
    bookingStartTime || firstAvailableStartTime,
    bookingLengthInMinutes,
    startTimeInterval,
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
      const options = { minDurationStartingInDay: minDurationStartingInInterval };
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
  }, [
    currentMonth,
    currentMonthInProgress,
    nextMonthInProgress,
    monthlyTimeSlots,
    timeZone,
    minDurationStartingInInterval,
  ]);

  useEffect(() => {
    setSeatsOptions(seatsOptions);
  }, [selectedTimeSlot?.attributes?.seats]);

  const onMonthClick = handleMonthClick(
    currentMonth,
    monthlyTimeSlots,
    dayCountAvailableForBooking,
    timeZone,
    listingId,
    onFetchTimeSlots,
    minDurationStartingInInterval
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
    const dayInListingTZ = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dateIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const timeSlotData = monthlyTimeSlotsData[dateIdString];
    return !timeSlotData?.hasAvailability;
  };

  let placeholderTime = getPlaceholder('08:00', timeZone, intl);

  const startOfToday = getStartOf(TODAY, 'day', timeZone);
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
              intl.formatMessage({ id: 'BookingFixedDurationForm.requiredDate' })
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

        <div className={classNames(css.field, css.startTime)}>
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
          <FieldHidden name="bookingEndTime" value={bookingEndTime} />
        </div>
      </div>
    </div>
  );
};

export default FieldDateAndTimeInput;
