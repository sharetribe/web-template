import React, { useState, useEffect, useRef } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';
import {
  getStartOf,
  addTime,
  isDateSameOrAfter,
  isInRange,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { LINE_ITEM_DAY, propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, PrimaryButton, FieldDateRangePicker, FieldSelect, H6 } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import FetchLineItemsError from '../FetchLineItemsError/FetchLineItemsError.js';

import css from './BookingDatesForm.module.css';

const TODAY = new Date();
const MIN_BOOKING_DAYS = 30;

// Returns the earliest future available date from the listing's time slots.
// Falls back to today in the listing timezone when no future slots exist.
export const getFirstAvailableDate = (timeSlots, timeZone) => {
  if (!Array.isArray(timeSlots) || timeSlots.length === 0) return null;
  const todayStart = getStartOf(new Date(), 'day', timeZone);
  const futureSlots = timeSlots.filter(ts => {
    if (ts.attributes.seats < 1) return false;
    return getStartOf(new Date(ts.attributes.end), 'day', timeZone) > todayStart;
  });
  if (futureSlots.length === 0) return null;
  const earliest = futureSlots.reduce((min, ts) =>
    new Date(ts.attributes.start) < new Date(min.attributes.start) ? ts : min
  , futureSlots[0]);
  const slotStart = getStartOf(new Date(earliest.attributes.start), 'day', timeZone);
  return isDateSameOrAfter(slotStart, todayStart) ? slotStart : todayStart;
};

// Formats a Date as YYYY-MM-DD in the given IANA timezone (used for the DatePicker startDate prop).
const toISODateInTimeZone = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);

const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');
const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking, 'days');

const getMonthStartInTimeZone = (monthId, timeZone) => {
  const month = parseDateFromISO8601(`${monthId}-01`, timeZone); // E.g. new Date('2022-12')
  return getStartOf(month, 'month', timeZone, 0, 'months');
};

const getExclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, 1, 'days');
};
const getInclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, -1, 'days');
};
/**
 * Get the range of months that we have already fetched time slots.
 * (This range expands when user clicks Next-button on date picker).
 * monthlyTimeSlots look like this: { '2024-07': { timeSlots: []}, '2024-08': { timeSlots: []} }
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @param {String} timeZone IANA time zone key ('Europe/Helsinki')
 * @returns {Array<Date>} a tuple containing dates: the start and exclusive end month
 */
const getMonthlyFetchRange = (monthlyTimeSlots, timeZone) => {
  const monthStrings = Object.entries(monthlyTimeSlots).reduce((picked, entry) => {
    return Array.isArray(entry[1].timeSlots) ? [...picked, entry[0]] : picked;
  }, []);
  const firstMonth = getMonthStartInTimeZone(monthStrings[0], timeZone);
  const lastMonth = getMonthStartInTimeZone(monthStrings[monthStrings.length - 1], timeZone);
  const exclusiveEndMonth = nextMonthFn(lastMonth, timeZone);
  return [firstMonth, exclusiveEndMonth];
};

/**
 * This merges the time slots, when consecutive time slots are back to back with same "seats" count.
 *
 * @param {Array<TimeSlot>} timeSlots
 * @returns {Array<TimeSlot>} array of time slots where unnecessary boundaries have been removed.
 */
const removeUnnecessaryBoundaries = timeSlots => {
  return timeSlots.reduce((picked, ts) => {
    const hasPicked = picked.length > 0;
    if (hasPicked) {
      const rest = picked.slice(0, -1);
      const lastPicked = picked.slice(-1)[0];

      const isBackToBack = lastPicked.attributes.end.getTime() === ts.attributes.start.getTime();
      const hasSameSeatsCount = lastPicked.attributes.seats === ts.attributes.seats;
      const createJoinedTimeSlot = (ts1, ts2) => ({
        ...ts1,
        attributes: { ...ts1.attributes, end: ts2.attributes.end },
      });
      return isBackToBack && hasSameSeatsCount
        ? [...rest, createJoinedTimeSlot(lastPicked, ts)]
        : [...picked, ts];
    }
    return [ts];
  }, []);
};
/**
 * Join monthly time slots into a single array and remove unnecessary boundaries on month changes.
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @returns {Array<TimeSlot>}
 */
const getAllTimeSlots = monthlyTimeSlots => {
  const timeSlotsRaw = Object.values(monthlyTimeSlots).reduce((picked, mts) => {
    return [...picked, ...(mts.timeSlots || [])];
  }, []);
  return removeUnnecessaryBoundaries(timeSlotsRaw);
};

/**
 * Check if a blocked date can be found between two dates.
 *
 * @param {Array<propTypes.timeSlot>} allTimeSlots an array of propTypes.timeSlot objects
 * @param {String} timeZone time zone id
 * @param {Moment} startDate start date (Moment)
 * @param {Moment} endDate end date (Moment)
 */
const hasAvailabilityOnDay = (day, allTimeSlots, timeZone) => {
  if (!Array.isArray(allTimeSlots)) {
    return false;
  }

  const dayStart = getStartOf(day, 'day', timeZone).getTime();

  return allTimeSlots.some(ts => {
    if (ts.attributes.seats < 1) {
      return false;
    }

    const slotStart = getStartOf(new Date(ts.attributes.start), 'day', timeZone).getTime();
    const slotEnd = getStartOf(new Date(ts.attributes.end), 'day', timeZone).getTime();
    return dayStart >= slotStart && dayStart < slotEnd;
  });
};

export const hasAvailabilityOrCheckoutOnDay = (day, allTimeSlots, timeZone) => {
  if (!Array.isArray(allTimeSlots)) {
    return false;
  }

  const dayStart = getStartOf(day, 'day', timeZone).getTime();

  return allTimeSlots.some(ts => {
    if (ts.attributes.seats < 1) {
      return false;
    }

    const slotStart = getStartOf(new Date(ts.attributes.start), 'day', timeZone).getTime();
    const slotEnd = getStartOf(new Date(ts.attributes.end), 'day', timeZone).getTime();
    return dayStart >= slotStart && dayStart <= slotEnd;
  });
};

const hasMinimumBookableRange = (
  startDay,
  allTimeSlots,
  monthlyTimeSlots,
  timeZone,
  isDaily,
  minimumNights
) => {
  const minimumEndDay = getStartOf(startDay, 'day', timeZone, minimumNights, 'days');
  const lastRequiredDay = isDaily
    ? minimumEndDay
    : getStartOf(minimumEndDay, 'day', timeZone, -1, 'days');

  let day = getStartOf(startDay, 'day', timeZone);
  while (isDateSameOrAfter(lastRequiredDay, day)) {
    const dayMonthId = monthIdString(day, timeZone);
    const monthFetched = Array.isArray(monthlyTimeSlots?.[dayMonthId]?.timeSlots);
    if (!monthFetched) {
      return true;
    }

    if (!hasAvailabilityOnDay(day, allTimeSlots, timeZone)) {
      return false;
    }
    day = getStartOf(day, 'day', timeZone, 1, 'days');
  }

  return true;
};

const isBlockedBetween = (allTimeSlots, timeZone, isDaily) => ([startDate, endDate]) => {
  const localizedStartDay = getStartOf(
    timeOfDayFromLocalToTimeZone(startDate, timeZone),
    'day',
    timeZone
  );
  const localizedEndDay = getStartOf(
    timeOfDayFromLocalToTimeZone(endDate, timeZone),
    'day',
    timeZone
  );
  const lastRequiredDay = isDaily
    ? localizedEndDay
    : getStartOf(localizedEndDay, 'day', timeZone, -1, 'days');

  if (!isDateSameOrAfter(lastRequiredDay, localizedStartDay)) {
    return false;
  }

  let day = localizedStartDay;
  while (isDateSameOrAfter(lastRequiredDay, day)) {
    if (!hasAvailabilityOnDay(day, allTimeSlots, timeZone)) {
      return true;
    }
    day = getStartOf(day, 'day', timeZone, 1, 'days');
  }

  return false;
};

const isOneBoundaryeSelected = (hasTimeSlots, startDate, endDate) => {
  const oneBoundarySelected = (startDate || endDate) && (!startDate || !endDate);
  return hasTimeSlots && oneBoundarySelected;
};

const endDateToPickerDate = (unitType, endDate, timeZone) => {
  const isValid = endDate instanceof Date;
  const isDaily = unitType === LINE_ITEM_DAY;

  if (!isValid) {
    return null;
  } else if (isDaily) {
    // API end dates are exlusive, so we need to shift them with daily
    // booking.
    return getStartOf(endDate, 'day', timeZone, -1, 'days');
  } else {
    return endDate;
  }
};

/**
 * Get the closest start date: the start of the time slot or the start of the available range.
 *
 * @param {Object} timeSlotData { timeSlots: [<TimeSlot>]}
 * @param {Date} startOfAvailableRange
 * @param {Date} endOfAvailableRange
 * @returns {Date} start of time slot or the start of available range
 */
const getBookableRange = (timeSlotData, startOfAvailableRange, endOfAvailableRange) => {
  if (!timeSlotData) {
    return [];
  }

  const timeSlotStart = timeSlotData?.timeSlots?.[0]?.attributes?.start;
  const timeSlotEnd = timeSlotData?.timeSlots?.[0]?.attributes?.end;
  const start = isDateSameOrAfter(startOfAvailableRange, timeSlotStart)
    ? startOfAvailableRange
    : timeSlotStart;
  const end = isDateSameOrAfter(endOfAvailableRange, timeSlotEnd)
    ? timeSlotEnd
    : endOfAvailableRange;
  return [start, end];
};

/**
 * Returns an isOutsideRange function that can be passed to
 * a DateRangePicker component.
 */
const isOutsideRangeFn = (
  allTimeSlots,
  monthlyTimeSlots,
  startDate,
  endDate,
  lineItemUnitType,
  dayCountAvailableForBooking,
  timeZone
) => {
  const endOfAvailableRange = dayCountAvailableForBooking;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const startOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone);

  // Currently available monthly data
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  // One boundary is selected
  const oneBoundarySelected = isOneBoundaryeSelected(!!monthlyTimeSlots, startDate, endDate);
  const inclusiveEndDateMaybe = endDate ? getInclusiveEndDate(endDate, timeZone) : endDate;
  const boundary = startDate || inclusiveEndDateMaybe;
  const timeSlotData = oneBoundarySelected
    ? timeSlotsData[stringifyDateToISO8601(boundary, timeZone)]
    : null;
  const bookableRange = getBookableRange(
    timeSlotData,
    startOfAvailableRangeDate,
    endOfAvailableRangeDate
  );

  const [rangeStart, rangeEnd] =
    bookableRange.length === 2
      ? bookableRange
      : [startOfAvailableRangeDate, endOfAvailableRangeDate];

  // standard isOutsideRange function
  return day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    // When only one boundary is selected, use the combined slot for range check.
    // If the day's month hasn't been fetched yet, treat it as in-range (optimistic).
    if (oneBoundarySelected && startDate && !endDate) {
      const dayMonthId = monthIdString(dayInListingTZ, timeZone);
      const monthFetched = Array.isArray(monthlyTimeSlots?.[dayMonthId]?.timeSlots);
      if (!monthFetched) {
        return false;
      }
      // Use day-level comparison in listing timezone to handle UTC-offset mismatches
      // (exceptions created in a different UTC offset may start a few hours into the day).
      const dayTs = dayInListingTZ.getTime();
      return !(
        Array.isArray(allTimeSlots) &&
        allTimeSlots.some(ts => {
          if (ts.attributes.seats < 1) return false;
          const slotStartDayTs = getStartOf(new Date(ts.attributes.start), 'day', timeZone).getTime();
          const slotEndDayTs = getStartOf(new Date(ts.attributes.end), 'day', timeZone).getTime();
          return dayTs >= slotStartDayTs && dayTs <= slotEndDayTs;
        })
      );
    }

    // end the range so that the booking can end at latest on
    // - nightly booking: the day the next booking starts
    // - daily booking: the day before the next booking starts
    const lastDayToEndBooking = endDateToPickerDate(lineItemUnitType, rangeEnd, timeZone);

    return (
      !isDateSameOrAfter(dayInListingTZ, rangeStart) ||
      !isDateSameOrAfter(lastDayToEndBooking, dayInListingTZ)
    );
  };
};

/**
 * Returns an isDayBlocked function that can be passed to
 * a DateRangePicker component.
 */
const isDayBlockedFn = params => {
  const { allTimeSlots, monthlyTimeSlots, isDaily, startDate, endDate, timeZone } = params || {};

  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  return day => {
    const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(localizedDay, 'day', timeZone);

    const dayIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const hasAvailabilityOnDay = timeSlotsData[dayIdString]?.hasAvailability === true;

    if (!isDaily && startDate) {
      // If this day's month hasn't been fetched yet, don't block it (optimistic).
      const dayMonthId = monthIdString(dayInListingTZ, timeZone);
      const monthFetched = Array.isArray(monthlyTimeSlots?.[dayMonthId]?.timeSlots);
      if (!monthFetched) {
        return false;
      }
      const hasAvailability =
        hasAvailabilityOnDay ||
        hasAvailabilityOrCheckoutOnDay(dayInListingTZ, allTimeSlots, timeZone);
      return !hasAvailability;
    }

    // Daily
    return !hasAvailabilityOnDay;
  };
};

const isDateSelectionBlockedFn = params => {
  const {
    allTimeSlots,
    monthlyTimeSlots,
    isDaily,
    startDate,
    endDate,
    timeZone,
    minimumNights = 0,
  } = params || {};

  return day => {
    const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(localizedDay, 'day', timeZone);
    const isSelectingStartDate = !startDate || !!endDate;

    return isSelectingStartDate && minimumNights > 0
      ? !hasMinimumBookableRange(
          dayInListingTZ,
          allTimeSlots,
          monthlyTimeSlots,
          timeZone,
          isDaily,
          minimumNights
        )
      : false;
  };
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

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, end, timeZone);
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

// When the values of the form are updated we need to fetch
// lineItems from this Template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.

const calculateLineItems = (
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems,
  seatsEnabled
) => formValues => {
  const { startDate, endDate, priceVariantName, seats } = formValues?.values || {};

  const priceVariantMaybe = priceVariantName ? { priceVariantName } : {};
  const seatCount = seats ? parseInt(seats, 10) : 1;

  const orderData = {
    bookingStart: startDate,
    bookingEnd: endDate,
    ...priceVariantMaybe,
    ...(seatsEnabled && { seats: seatCount }),
  };

  if (startDate && endDate && !fetchLineItemsInProgress) {
    onFetchTransactionLineItems({
      orderData,
      listingId,
      isOwnListing,
    });
  }
};

const showNextMonthStepper = (currentMonth, dayCountAvailableForBooking, timeZone) => {
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return !isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  );
};

const showPreviousMonthStepper = (currentMonth, timeZone) => {
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);
  return isDateSameOrAfter(prevMonthDate, currentMonthDate);
};

const getStartAndEndOnTimeZone = (startDate, endDate, isDaily, timeZone) => {
  // Parse the startDate and endDate into the target time zone
  const parsedStart = startDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
    : startDate;

  const parsedEnd = endDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
    : endDate;

  // Adjust endDate for API if isDaily is true
  const endDateForAPI = parsedEnd && isDaily ? getExclusiveEndDate(parsedEnd, timeZone) : parsedEnd;

  // Return the processed dates
  return { startDate: parsedStart, endDate: endDateForAPI };
};

// return a list of timeslots that exist between startDate and endDate
const filterTimeSlotsByDate = (allTimeSlots, startDate, endDate) => {
  return Object.values(allTimeSlots).filter(
    ({ attributes: { start, end } }) =>
      // Check if the timeslot is within or overlaps with the selected dates
      (start < startDate && end > startDate) ||
      (start >= startDate && end <= endDate) ||
      (start < endDate && end > endDate)
  );
};

// Finds the timeslot with the smallest number of seats
const findMinSeatsTimeSlot = timeSlots => {
  return timeSlots.reduce((minSeatsSlot, timeSlot) => {
    const { seats } = timeSlot.attributes;
    return !minSeatsSlot || seats < minSeatsSlot.seats ? timeSlot.attributes : minSeatsSlot;
  }, null);
};

// Main function to get the seat options based on the minimum seats available in the date range
const getMinSeatsOptions = (allTimeSlots, startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }
  const filteredTimeSlots = filterTimeSlotsByDate(allTimeSlots, startDate, endDate);
  const minSeatsSlot = findMinSeatsTimeSlot(filteredTimeSlots);

  // Return the array of seat options from 1 to the minimum seats available, capped at 100
  const maxOptions = 100;
  return minSeatsSlot
    ? Array.from({ length: Math.min(minSeatsSlot.seats, maxOptions) }, (_, i) => i + 1)
    : [];
};

// Checks if two timeslots are consequtive
const areConsecutiveTimeSlots = (timeSlotA, timeSlotB) =>
  new Date(timeSlotA.attributes.end).getTime() === new Date(timeSlotB.attributes.start).getTime();

// Find the index of a the first consecutive timeslot in a list of timeslots
const findIndexOfFirstConsecutiveTimeSlot = (timeSlots, index) =>
  index > 0 && areConsecutiveTimeSlots(timeSlots[index - 1], timeSlots[index])
    ? findIndexOfFirstConsecutiveTimeSlot(timeSlots, index - 1)
    : index;

// find the index of the last consecutive timeslot in a list of timeslots
const findIndexOfLastConsecutiveTimeSlot = (timeSlots, index) =>
  index < timeSlots.length - 1 && areConsecutiveTimeSlots(timeSlots[index], timeSlots[index + 1])
    ? findIndexOfLastConsecutiveTimeSlot(timeSlots, index + 1)
    : index;

// Find and combine adjacent/consecutive timeslots into one timeslot
const combineConsecutiveTimeSlots = (slots, startDate, timeZone) => {
  // Locate the index of the timeslot containing startDate.
  // Use day-level comparison in the listing timezone so that a slot starting a few hours
  // after midnight (due to UTC-offset mismatch when the exception was created) is still found.
  const startIndex = slots.findIndex(({ attributes }) => {
    const { start, end } = attributes;
    if (timeZone) {
      // startDate is already getStartOf(day, timeZone); compare against slot day boundaries
      const startDayTs = startDate.getTime();
      const slotStartDayTs = getStartOf(new Date(start), 'day', timeZone).getTime();
      const slotEndDayTs = getStartOf(new Date(end), 'day', timeZone).getTime();
      return startDayTs >= slotStartDayTs && startDayTs < slotEndDayTs;
    }
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return startDate.getTime() >= startTime && startDate.getTime() < endTime;
  });

  // Return empty array if no timeslot matches startDate
  if (startIndex === -1) return [];

  // Determine the full range of consecutive timeslots
  const indexOfFirstTimeSlot = findIndexOfFirstConsecutiveTimeSlot(slots, startIndex);
  const indexOfLastTimeSlot = findIndexOfLastConsecutiveTimeSlot(slots, startIndex);

  // Combine the consecutive timeslots into a single slot
  const combinedSlot = {
    ...slots[indexOfFirstTimeSlot],
    attributes: {
      ...slots[indexOfFirstTimeSlot].attributes,
      start: slots[indexOfFirstTimeSlot].attributes.start,
      end: slots[indexOfLastTimeSlot].attributes.end,
    },
  };

  return [combinedSlot];
};

const onPriceVariantChange = props => value => {
  const { form: formApi, seatsEnabled } = props;

  formApi.batch(() => {
    formApi.change('bookingDates', null);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
};

/**
 * A form for selecting booking dates.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class name for the root element
 * @param {string} [props.className] - Custom class name
 * @param {Object} props.price - The unit price of the
 * @param {string} props.listingId - The listing ID
 * @param {boolean} props.isOwnListing - Whether the listing belongs to the current user
 * @param {propTypes.lineItemUnitType} props.lineItemUnitType - The unit type of the line item
 * @param {Object} props.monthlyTimeSlots - The monthly time slots
 * @param {Function} props.onFetchTimeSlots - Handler for fetching time slots
 * @param {Array<Object>} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching line items
 * @param {Function} props.onFetchTransactionLineItems - Handler for fetching transaction line items
 * @param {string} props.timeZone - The time zone
 * @param {string} props.marketplaceName - Name of the marketplace
 * @param {string} [props.startDatePlaceholder] - Placeholder for the start date
 * @param {string} [props.endDatePlaceholder] - Placeholder for the end date
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {Array<Object>} [props.priceVariants] - The price variants
 * @param {ReactNode} [props.priceVariantFieldComponent] - The component to use for the price variant field
 * @param {boolean} props.isPublishedListing - Whether the listing is published
 * @returns {JSX.Element}
 */
export const BookingDatesForm = props => {
  const {
    rootClassName,
    className,
    price: unitPrice,
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    timeZone,
    dayCountAvailableForBooking,
    marketplaceName,
    payoutDetailsWarning,
    monthlyTimeSlots,
    onMonthChanged,
    seatsEnabled,
    isPriceVariationsInUse,
    priceVariants = [],
    priceVariantFieldComponent: PriceVariantFieldComponent,
    preselectedPriceVariant,
    isPublishedListing,
    initialBookingDates,
    onFetchTimeSlots,
    ...rest
  } = props;
  const intl = useIntl();
  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));
  const priceVariantInitial =
    priceVariants.length > 1 && preselectedPriceVariant
      ? { priceVariantName: preselectedPriceVariant?.name }
      : priceVariants.length === 1
      ? { priceVariantName: priceVariants?.[0]?.name }
      : {};
  const initialValuesMaybe = {
    initialValues: {
      ...priceVariantInitial,
      ...(initialBookingDates ? { bookingDates: initialBookingDates } : {}),
    },
  };

  const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, timeZone));
  const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (onMonthChanged) {
      onMonthChanged(monthId);
    }
  }, [currentMonth, onMonthChanged]);

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
      const timeSlotsData = timeSlotsPerDate(currentMonth, nextMonth, allTimeSlots, tz);
      const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, tz);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);
      console.log(monthIdString(lastFetchedMonth, tz));

      console.log(
        `Fetched months: ${monthIdString(startMonth, tz)} ... ${monthIdString(
          lastFetchedMonth,
          tz
        )}`,
        '\nTime slots for the current month:',
        timeSlotsData
      );
    }
  }, [currentMonth, currentMonthInProgress, nextMonthInProgress, timeZone, monthlyTimeSlots]);

  const classes = classNames(rootClassName || css.root, className);

  const onHandleFetchLineItems = calculateLineItems(
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    seatsEnabled
  );

  // Trigger price calculation when form mounts with pre-filled dates (e.g. after browser back)
  useEffect(() => {
    if (initialBookingDates?.startDate && initialBookingDates?.endDate) {
      onFetchTransactionLineItems({
        orderData: {
          bookingStart: initialBookingDates.startDate,
          bookingEnd: initialBookingDates.endDate,
        },
        listingId,
        isOwnListing,
      });
    }
  }, []);

  // When firstAvailableDate is in a future month, the two-month calendar displays
  // that month + the following month. We need to:
  // 1. Pre-fetch the second visible month (firstAvailableDate's month + 1) so it isn't blocked.
  // 2. Sync currentMonth to firstAvailableDate's month so that user navigation fetches
  //    the correct subsequent months (otherwise currentMonth=April causes "next" clicks
  //    to fetch April+2=June instead of May+2=July).
  const prefetchedExtraMonthRef = useRef(false);
  const monthSyncedRef = useRef(false);
  const firstAvailableDate = !initialBookingDates
    ? getFirstAvailableDate(allTimeSlots, timeZone)
    : null;
  const firstAvailableMonthId = firstAvailableDate
    ? monthIdString(firstAvailableDate, timeZone)
    : null;
  useEffect(() => {
    console.log('[DEBUG] pre-fetch effect — firstAvailableMonthId:', firstAvailableMonthId, '| monthlyTimeSlots keys:', Object.keys(monthlyTimeSlots));
    if (!firstAvailableDate || !onFetchTimeSlots) return;
    const firstAvailableMonth = getStartOf(firstAvailableDate, 'month', timeZone);
    const todayMonth = getStartOf(TODAY, 'month', timeZone);
    if (firstAvailableMonth <= todayMonth) return;

    if (!prefetchedExtraMonthRef.current) {
      prefetchedExtraMonthRef.current = true;
      const monthAfter = nextMonthFn(firstAvailableMonth, timeZone);
      const monthAfterId = monthIdString(monthAfter, timeZone);
      console.log('[DEBUG] pre-fetching month:', monthAfterId, '| already fetched:', Array.isArray(monthlyTimeSlots?.[monthAfterId]?.timeSlots));
      if (!Array.isArray(monthlyTimeSlots?.[monthAfterId]?.timeSlots)) {
        fetchMonthData(monthAfter, listingId, dayCountAvailableForBooking, timeZone, onFetchTimeSlots);
      }
    }

    if (!monthSyncedRef.current) {
      monthSyncedRef.current = true;
      console.log('[DEBUG] syncing currentMonth to:', monthIdString(firstAvailableMonth, timeZone));
      setCurrentMonth(firstAvailableMonth);
    }
  }, [firstAvailableMonthId]);

  return (
    <FinalForm
      {...initialValuesMaybe}
      {...rest}
      onFetchTimeSlots={onFetchTimeSlots}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          formId,
          handleSubmit,
          lineItemUnitType,
          values,
          lineItems,
          fetchLineItemsError,
          onFetchTimeSlots,
          form: formApi,
          finePrintComponent: FinePrint,
        } = formRenderProps;
        const { startDate, endDate } = values?.bookingDates ? values.bookingDates : {};
        const priceVariantName = values?.priceVariantName || null;

        const startDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidStartDate',
        });
        const endDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidEndDate',
        });

        // This is the place to collect breakdown estimation data.
        // Note: lineItems are calculated and fetched from this Template's backend
        // so we need to pass only booking data that is needed otherwise
        // If you have added new fields to the form that will affect to pricing,
        // you need to add the values to handleOnChange function
        const breakdownData =
          startDate && endDate
            ? {
                startDate,
                endDate,
              }
            : null;
        const showEstimatedBreakdown =
          breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

        const dateFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        };

        const startOfToday = getStartOf(TODAY, 'day', timeZone);
        const startDatePlaceholderText =
          startDatePlaceholder || intl.formatDate(new Date(), dateFormatOptions);
        const endDatePlaceholderText =
          endDatePlaceholder || intl.formatDate(addTime(new Date(), 30, 'days'), dateFormatOptions);

        const relevantTimeSlots =
          startDate && !endDate
            ? combineConsecutiveTimeSlots(allTimeSlots, startDate, timeZone)
            : allTimeSlots;

        const twoMonths = typeof window !== 'undefined' && window.innerWidth >= 768;
        const firstAvailableDate =
          !startDate && !endDate ? getFirstAvailableDate(allTimeSlots, timeZone) : null;

        const onMonthClick = handleMonthClick(
          currentMonth,
          monthlyTimeSlots,
          dayCountAvailableForBooking,
          timeZone,
          listingId,
          onFetchTimeSlots
        );
        const isDayBlocked = isDayBlockedFn({
          allTimeSlots: relevantTimeSlots,
          monthlyTimeSlots,
          isDaily: lineItemUnitType === LINE_ITEM_DAY,
          startDate,
          endDate,
          timeZone,
        });
        const isDateSelectionBlocked = isDateSelectionBlockedFn({
          allTimeSlots: relevantTimeSlots,
          monthlyTimeSlots,
          isDaily: lineItemUnitType === LINE_ITEM_DAY,
          startDate,
          endDate,
          timeZone,
          minimumNights: MIN_BOOKING_DAYS,
        });
        const isOutsideRange = isOutsideRangeFn(
          relevantTimeSlots,
          monthlyTimeSlots,
          startDate,
          endDate,
          lineItemUnitType,
          dayCountAvailableForBooking,
          timeZone,
          seatsEnabled
        );

        const seatsOptions = getMinSeatsOptions(
          relevantTimeSlots,
          values?.bookingDates?.startDate,
          values?.bookingDates?.endDate
        );

        const isDaily = lineItemUnitType === LINE_ITEM_DAY;
        const submitDisabled = isPriceVariationsInUse && !isPublishedListing;

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            {PriceVariantFieldComponent ? (
              <PriceVariantFieldComponent
                priceVariants={priceVariants}
                priceVariantName={priceVariantName}
                onPriceVariantChange={onPriceVariantChange(formRenderProps)}
                disabled={!isPublishedListing}
              />
            ) : null}

            <FieldDateRangePicker
              className={css.bookingDates}
              name="bookingDates"
              isDaily={isDaily}
              minimumNights={MIN_BOOKING_DAYS}
              twoMonths={twoMonths}
              showClearButton={!!(startDate || endDate)}
              startDate={firstAvailableDate ? toISODateInTimeZone(firstAvailableDate, timeZone) : undefined}
              theme="light"
              startDateId={`${formId}.bookingStartDate`}
              startDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingStartTitle',
              })}
              startDatePlaceholderText={startDatePlaceholderText}
              endDateId={`${formId}.bookingEndDate`}
              endDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingEndTitle',
              })}
              endDatePlaceholderText={endDatePlaceholderText}
              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangePicker
                // DateRangePicker operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const endDateForPicker =
                  isDaily && endDate ? getInclusiveEndDate(endDate, timeZone) : endDate;
                const formattedEnd = endDateForPicker
                  ? timeOfDayFromTimeZoneToLocal(endDateForPicker, timeZone)
                  : endDateForPicker;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
                const { startDate, endDate } = v || {};
                return v ? getStartAndEndOnTimeZone(startDate, endDate, isDaily, timeZone) : v;
              }}
              useMobileMargins
              validate={composeValidators(
                required(
                  intl.formatMessage({
                    id: 'BookingDatesForm.requiredDate',
                  })
                ),
                bookingDatesRequired(startDateErrorMessage, endDateErrorMessage)
              )}
              isDayBlocked={isDayBlocked}
              isDateSelectionBlocked={isDateSelectionBlocked}
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(relevantTimeSlots, timeZone, isDaily)}
              disabled={fetchLineItemsInProgress || (priceVariants.length > 0 && !priceVariantName)}
              showLabelAsDisabled={priceVariants.length > 0 && !priceVariantName}
              showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
              showNextMonthStepper={showNextMonthStepper(
                currentMonth,
                dayCountAvailableForBooking,
                timeZone
              )}
              onMonthChange={date => {
                const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
                const direction = localizedDate < currentMonth ? prevMonthFn : nextMonthFn;
                console.log('[DEBUG] onMonthChange — navigating to:', monthIdString(localizedDate, timeZone), '| currentMonth:', monthIdString(currentMonth, timeZone), '| direction:', direction === nextMonthFn ? 'next' : 'prev', '| will fetch:', monthIdString(direction(currentMonth, timeZone, 2), timeZone), '| monthlyTimeSlots keys:', Object.keys(monthlyTimeSlots));
                onMonthClick(direction);
                setCurrentMonth(localizedDate);
              }}
              onClose={() => {
                setCurrentMonth(startDate || endDate || startOfToday);
              }}
              onChange={values => {
                const { startDate: startDateFromValues, endDate: endDateFromValues } = values || {};
                const { startDate, endDate } = values
                  ? getStartAndEndOnTimeZone(
                      startDateFromValues,
                      endDateFromValues,
                      isDaily,
                      timeZone
                    )
                  : {};
                if (seatsEnabled) {
                  formApi.change('seats', 1);
                }
                onHandleFetchLineItems({
                  values: {
                    priceVariantName,
                    startDate,
                    endDate,
                    seats: seatsEnabled ? 1 : undefined,
                  },
                });
              }}
            />
            <p className={css.minimumStayHint}>
              <FormattedMessage id="BookingDatesForm.minimumStay" />
            </p>

            {seatsEnabled ? (
              <FieldSelect
                name="seats"
                id="seats"
                label={intl.formatMessage({ id: 'BookingDatesForm.seatsTitle' })}
                disabled={!(startDate && endDate)}
                showLabelAsDisabled={!(startDate && endDate)}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      priceVariantName,
                      startDate: startDate,
                      endDate: endDate,
                      seats: values,
                    },
                  });
                }}
              >
                <option disabled value="">
                  {intl.formatMessage({ id: 'BookingDatesForm.seatsPlaceholder' })}
                </option>
                {seatsOptions.map(s => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </FieldSelect>
            ) : null}

            {showEstimatedBreakdown ? (
              <div className={css.priceBreakdownContainer}>
                <H6 as="h3" className={css.bookingBreakdownTitle}>
                  <FormattedMessage id="BookingDatesForm.priceBreakdownTitle" />
                </H6>
                <hr className={css.totalDivider} />
                <EstimatedCustomerBreakdownMaybe
                  breakdownData={breakdownData}
                  lineItems={lineItems}
                  timeZone={timeZone}
                  currency={unitPrice.currency}
                  marketplaceName={marketplaceName}
                  processName={BOOKING_PROCESS_NAME}
                />
              </div>
            ) : null}
            <FetchLineItemsError error={fetchLineItemsError} />

            <div className={css.submitButton}>
              <PrimaryButton
                type="submit"
                inProgress={fetchLineItemsInProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="BookingDatesForm.requestToBook" />
              </PrimaryButton>
            </div>
            <FinePrint payoutDetailsWarning={payoutDetailsWarning} isOwnListing={isOwnListing} />
          </Form>
        );
      }}
    />
  );
};

export default BookingDatesForm;
