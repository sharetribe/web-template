import React, { useState, useEffect } from 'react';
import { array, bool, func, number, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';
import {
  START_DATE,
  END_DATE,
  getStartOf,
  addTime,
  isSameDay,
  isDateSameOrAfter,
  isInRange,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
  initialVisibleMonth,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { LINE_ITEM_DAY, propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, IconArrowHead, PrimaryButton, FieldDateRangeInput, H6 } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './BookingDatesForm.module.css';

const TODAY = new Date();

const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');
const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');

const getMonthStartInTimeZone = (monthId, timeZone) => {
  const month = parseDateFromISO8601(`${monthId}-01`, timeZone); // E.g. new Date('2022-12')
  return getStartOf(month, 'month', timeZone, 0, 'months');
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
const isBlockedBetween = (allTimeSlots, timeZone) => (startDate, endDate) => {
  const localizedStartDay = timeOfDayFromLocalToTimeZone(startDate, timeZone);
  const localizedEndDay = timeOfDayFromLocalToTimeZone(endDate, timeZone);
  const foundTS = allTimeSlots.find(ts => {
    const timeSlotRange = [ts.attributes.start, ts.attributes.end];
    return isInRange(localizedStartDay, ...timeSlotRange, undefined, timeZone);
  });

  if (!foundTS) {
    return true;
  }

  const timeSlotRange = [foundTS.attributes.start, foundTS.attributes.end];
  // endDate should be included in the slot mapped with startDate
  const isExcludedEnd = isSameDay(localizedEndDay, timeSlotRange[1], timeZone);
  const isBlockedBetween = !(isInRange(localizedEndDay, ...timeSlotRange) || isExcludedEnd);
  return isBlockedBetween;
};

const isStartDateSelected = (timeSlots, startDate, endDate, focusedInput) => {
  return (
    timeSlots && startDate && (!endDate || focusedInput === END_DATE) && focusedInput !== START_DATE
  );
};

const isEndDateSelected = (timeSlots, startDate, endDate, focusedInput) => {
  return timeSlots && endDate && !startDate && focusedInput !== END_DATE;
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
 * Get the closest end date: the end of the time slot or the end of the available range.
 *
 * @param {Object} timeSlotData { timeSlots: [<TimeSlot>]}
 * @param {Date} endOfAvailableRangeDate
 * @returns {Date} end of time slot or the end of available range
 */
const getDailyTimeSlotEnd = (timeSlotData, endOfAvailableRangeDate) => {
  const timeSlotEnd = timeSlotData?.timeSlots?.[0]?.attributes?.end;
  return isDateSameOrAfter(endOfAvailableRangeDate, timeSlotEnd)
    ? timeSlotEnd
    : endOfAvailableRangeDate;
};

/**
 * Get the closest start date: the start of the time slot or the start of the available range.
 *
 * @param {Object} timeSlotData { timeSlots: [<TimeSlot>]}
 * @param {Date} startOfAvailableRange
 * @returns {Date} start of time slot or the start of available range
 */
const getDailyTimeSlotStart = (timeSlotData, startOfAvailableRange) => {
  const timeSlotStart = timeSlotData?.timeSlots?.[0]?.attributes?.start;
  return isDateSameOrAfter(startOfAvailableRange, timeSlotStart)
    ? startOfAvailableRange
    : timeSlotStart;
};

/**
 * Returns an isOutsideRange function that can be passed to
 * a react-dates DateRangePicker component.
 */
const isOutsideRangeFn = (
  allTimeSlots,
  monthlyTimeSlots,
  startDate,
  endDate,
  lineItemUnitType,
  dayCountAvailableForBooking,
  timeZone
) => focusedInput => {
  const endOfAvailableRange = dayCountAvailableForBooking - 1;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const startOfStartDay = getStartOf(startDate, 'day', timeZone);

  // Currently available monthly data
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  // start date selected, end date missing
  const startDateSelected = isStartDateSelected(monthlyTimeSlots, startDate, endDate, focusedInput);
  const endOfBookableRange = startDateSelected
    ? getDailyTimeSlotEnd(
        timeSlotsData[stringifyDateToISO8601(startOfStartDay, timeZone)],
        endOfAvailableRangeDate
      )
    : null;

  if (endOfBookableRange) {
    // end the range so that the booking can end at latest on
    // nightly booking: the day the next booking starts
    // daily booking: the day before the next booking starts
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      const lastDayToEndBooking = endDateToPickerDate(
        lineItemUnitType,
        endOfBookableRange,
        timeZone
      );
      return (
        !isDateSameOrAfter(dayInListingTZ, startOfStartDay) ||
        !isDateSameOrAfter(lastDayToEndBooking, dayInListingTZ)
      );
    };
  }

  // end date selected, start date missing
  // -> limit the earliest start date for the booking so that it
  // needs to be after the previous booked date
  const endDateSelected = isEndDateSelected(monthlyTimeSlots, startDate, endDate, focusedInput);
  const endDateAdjusted = endDateSelected ? getStartOf(endDate, 'day', timeZone, -1, 'days') : null;
  const prevDayIdString = stringifyDateToISO8601(endDateAdjusted, timeZone);
  const startOfTimeSlot = endDateSelected
    ? getDailyTimeSlotStart(timeSlotsData[prevDayIdString], TODAY)
    : null;

  if (startOfTimeSlot) {
    return day => {
      const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
      const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
      return (
        !isDateSameOrAfter(dayInListingTZ, startOfTimeSlot) ||
        !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
      );
    };
  }

  // standard isOutsideRange function
  return day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
    return (
      !isDateSameOrAfter(dayInListingTZ, TODAY) ||
      !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
    );
  };
};

/**
 * Returns an isDayBlocked function that can be passed to
 * a react-dates DateRangePicker component.
 */
const isDayBlockedFn = (allTimeSlots, monthlyTimeSlots, unitType, timeZone) => focusedInput => {
  const isDaily = unitType === LINE_ITEM_DAY;
  const hasFocusOnEndDate = focusedInput === END_DATE;

  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  return day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);
    const dayIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const hasAvailabilityOnDay = timeSlotsData[dayIdString]?.hasAvailability !== true;

    // For the unit type night, we check the availability from previous day
    if (hasFocusOnEndDate && !isDaily) {
      const prevDay = getStartOf(dayInListingTZ, 'day', timeZone, -1, 'days');
      const prevDayIdString = stringifyDateToISO8601(prevDay, timeZone);
      const prevDayTimeSlot = timeSlotsData[prevDayIdString]?.timeSlots?.[0];
      const { start, end } = prevDayTimeSlot?.attributes || {};
      const prevDayRange = [start, end];
      const timeSlotEndsOnThisDay = end && isSameDay(dayInListingTZ, end, timeZone);

      return timeSlotEndsOnThisDay
        ? false
        : prevDayTimeSlot
        ? !isInRange(dayInListingTZ, ...prevDayRange, undefined, timeZone)
        : true;
    }

    return hasAvailabilityOnDay;
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
  fetchMonthData,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots
) => monthFn => {
  // Callback function after month has been updated.
  // react-dates component has next and previous months ready (but inivisible).
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

// In case start or end date for the booking is missing
// focus on that input, otherwise continue with the
// default handleSubmit function.
const handleFormSubmit = (setFocusedInput, onSubmit) => e => {
  const { startDate, endDate } = e.bookingDates || {};
  if (!startDate) {
    e.preventDefault();
    setFocusedInput(START_DATE);
  } else if (!endDate) {
    e.preventDefault();
    setFocusedInput(END_DATE);
  } else {
    onSubmit(e);
  }
};

// Function that can be passed to nested components
// so that they can notify this component when the
// focused input changes.
const handleFocusedInputChange = setFocusedInput => focusedInput => {
  setFocusedInput(focusedInput);
};

// When the values of the form are updated we need to fetch
// lineItems from this Template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.
const handleFormSpyChange = (
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems
) => formValues => {
  const { startDate, endDate } =
    formValues.values && formValues.values.bookingDates ? formValues.values.bookingDates : {};

  if (startDate && endDate && !fetchLineItemsInProgress) {
    onFetchTransactionLineItems({
      orderData: {
        bookingStart: startDate,
        bookingEnd: endDate,
      },
      listingId,
      isOwnListing,
    });
  }
};

// IconArrowHead component might not be defined if exposed directly to the file.
// This component is called before IconArrowHead component in components/index.js
const PrevIcon = props => (
  <IconArrowHead {...props} direction="left" rootClassName={css.arrowIcon} />
);
const NextIcon = props => (
  <IconArrowHead {...props} direction="right" rootClassName={css.arrowIcon} />
);

const Next = props => {
  const { currentMonth, dayCountAvailableForBooking, timeZone } = props;
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  ) ? null : (
    <NextIcon />
  );
};
const Prev = props => {
  const { currentMonth, timeZone } = props;
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);

  return isDateSameOrAfter(prevMonthDate, currentMonthDate) ? <PrevIcon /> : null;
};

export const BookingDatesFormComponent = props => {
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', props.timeZone));

  const allTimeSlots = getAllTimeSlots(props.monthlyTimeSlots);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = props.monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, props.timeZone));
  const nextMonthInProgress = props.monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (props.onMonthChanged) {
      props.onMonthChanged(monthId);
    }
  }, [currentMonth]);

  useEffect(() => {
    // Log time slots marked for each day for debugging
    if (appSettings.dev && appSettings.verbose && !currentMonthInProgress && !nextMonthInProgress) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const tz = props.timeZone;
      const nextMonth = nextMonthFn(currentMonth, tz);
      const timeSlotsData = timeSlotsPerDate(currentMonth, nextMonth, allTimeSlots, tz);
      const [startMonth, endMonth] = getMonthlyFetchRange(props.monthlyTimeSlots, tz);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);

      console.log(
        `Fetched months: ${monthIdString(startMonth, tz)} ... ${monthIdString(
          lastFetchedMonth,
          tz
        )}`,
        '\nTime slots for the current month:',
        timeSlotsData
      );
    }
  }, [currentMonth, currentMonthInProgress, nextMonthInProgress]);

  const {
    rootClassName,
    className,
    price: unitPrice,
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    onSubmit,
    timeZone,
    dayCountAvailableForBooking,
    marketplaceName,
    payoutDetailsWarning,
    ...rest
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const onFormSubmit = handleFormSubmit(setFocusedInput, onSubmit);
  const onFocusedInputChange = handleFocusedInputChange(setFocusedInput);
  const onFormSpyChange = handleFormSpyChange(
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems
  );
  return (
    <FinalForm
      {...rest}
      unitPrice={unitPrice}
      onSubmit={onFormSubmit}
      render={fieldRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          formId,
          handleSubmit,
          intl,
          lineItemUnitType,
          values,
          monthlyTimeSlots,
          lineItems,
          fetchLineItemsError,
          onFetchTimeSlots,
        } = fieldRenderProps;
        const { startDate, endDate } = values && values.bookingDates ? values.bookingDates : {};

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
        const tomorrow = addTime(startOfToday, 1, 'days');
        const startDatePlaceholderText =
          startDatePlaceholder || intl.formatDate(startOfToday, dateFormatOptions);
        const endDatePlaceholderText =
          endDatePlaceholder || intl.formatDate(tomorrow, dateFormatOptions);

        const onMonthClick = handleMonthClick(
          currentMonth,
          monthlyTimeSlots,
          fetchMonthData,
          dayCountAvailableForBooking,
          timeZone,
          listingId,
          onFetchTimeSlots
        );
        const isDayBlocked = isDayBlockedFn(
          allTimeSlots,
          monthlyTimeSlots,
          lineItemUnitType,
          timeZone
        );
        const isOutsideRange = isOutsideRangeFn(
          allTimeSlots,
          monthlyTimeSlots,
          startDate,
          endDate,
          lineItemUnitType,
          dayCountAvailableForBooking,
          timeZone
        );

        const isDaily = lineItemUnitType === LINE_ITEM_DAY;
        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            <FormSpy subscription={{ values: true }} onChange={onFormSpyChange} />
            <FieldDateRangeInput
              className={css.bookingDates}
              name="bookingDates"
              isDaily={isDaily}
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
              focusedInput={focusedInput}
              onFocusedInputChange={onFocusedInputChange}
              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangeInput
                // DateRangeInput operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const formattedEnd = endDate
                  ? timeOfDayFromTimeZoneToLocal(endDate, timeZone)
                  : endDate;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
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
              initialVisibleMonth={initialVisibleMonth(startDate || startOfToday, timeZone)}
              navNext={
                <Next
                  currentMonth={currentMonth}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                />
              }
              navPrev={<Prev currentMonth={currentMonth} timeZone={timeZone} />}
              onPrevMonthClick={() => {
                setCurrentMonth(prevMonth => prevMonthFn(prevMonth, timeZone));
                onMonthClick(prevMonthFn);
              }}
              onNextMonthClick={() => {
                setCurrentMonth(prevMonth => nextMonthFn(prevMonth, timeZone));
                onMonthClick(nextMonthFn);
              }}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(allTimeSlots, timeZone)}
              disabled={fetchLineItemsInProgress}
              onClose={event =>
                setCurrentMonth(getStartOf(event?.startDate ?? startOfToday, 'month', timeZone))
              }
            />

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
            {fetchLineItemsError ? (
              <span className={css.sideBarError}>
                <FormattedMessage id="BookingDatesForm.fetchLineItemsError" />
              </span>
            ) : null}

            <div className={css.submitButton}>
              <PrimaryButton type="submit" inProgress={fetchLineItemsInProgress}>
                <FormattedMessage id="BookingDatesForm.requestToBook" />
              </PrimaryButton>
            </div>
            <p className={css.finePrint}>
              {payoutDetailsWarning ? (
                payoutDetailsWarning
              ) : (
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingDatesForm.ownListing'
                      : 'BookingDatesForm.youWontBeChargedInfo'
                  }
                />
              )}
            </p>
          </Form>
        );
      }}
    />
  );
};

BookingDatesFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  isOwnListing: false,
  startDatePlaceholder: null,
  endDatePlaceholder: null,
  lineItems: null,
  fetchLineItemsError: null,
  monthlyTimeSlots: null,
};

BookingDatesFormComponent.propTypes = {
  rootClassName: string,
  className: string,

  marketplaceName: string.isRequired,
  lineItemUnitType: propTypes.lineItemUnitType.isRequired,
  price: propTypes.money,
  isOwnListing: bool,
  monthlyTimeSlots: object,
  onFetchTimeSlots: func.isRequired,

  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,

  // for tests
  startDatePlaceholder: string,
  endDatePlaceholder: string,
  dayCountAvailableForBooking: number.isRequired,
};

const BookingDatesForm = compose(injectIntl)(BookingDatesFormComponent);
BookingDatesForm.displayName = 'BookingDatesForm';

export default BookingDatesForm;
