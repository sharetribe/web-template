import React, { useState, useEffect } from 'react';
import { array, bool, func, number, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';
import {
  getStartOf,
  addTime,
  isSameDay,
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

import { Form, PrimaryButton, FieldDateRangePicker, H6 } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './BookingDatesForm.module.css';

const TODAY = new Date();

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
const isBlockedBetween = (allTimeSlots, timeZone) => ([startDate, endDate]) => {
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
      // Nightly
      // For the unit type night, we check that the time slot of the selected startDate
      // ends on a given _day_
      const startDateIdString = stringifyDateToISO8601(startDate, timeZone);
      const startDateTimeSlotsData = timeSlotsData[startDateIdString];
      const startDateTimeSlot =
        startDateTimeSlotsData == null ? true : startDateTimeSlotsData?.timeSlots?.[0];
      const { start, end } = startDateTimeSlot?.attributes || {};
      // If both startDate and endDate have been selected, we allow selecting other ranges
      const hasAvailability =
        startDate && endDate
          ? hasAvailabilityOnDay
          : isInRange(dayInListingTZ, start, end, 'day', timeZone);
      const timeSlotEndsOnThisDay = end && isSameDay(dayInListingTZ, end, timeZone);

      return !(hasAvailability || timeSlotEndsOnThisDay);
    }

    // Daily
    return !hasAvailabilityOnDay;
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

export const BookingDatesFormComponent = props => {
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
    ...rest
  } = props;

  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));

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
      render={formRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          formId,
          handleSubmit,
          intl,
          lineItemUnitType,
          values,
          lineItems,
          fetchLineItemsError,
          onFetchTimeSlots,
        } = formRenderProps;
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
          dayCountAvailableForBooking,
          timeZone,
          listingId,
          onFetchTimeSlots
        );
        const isDayBlocked = isDayBlockedFn({
          allTimeSlots,
          monthlyTimeSlots,
          isDaily: lineItemUnitType === LINE_ITEM_DAY,
          startDate,
          endDate,
          timeZone,
        });
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
            <FieldDateRangePicker
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
                // Parse the DateRangePicker's value (local 00:00) for the Final Form
                // The form expects listing's time zone and start of day aka 00:00
                const parsedStart = startDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
                  : startDate;
                const parsedEnd = endDate
                  ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
                  : endDate;
                const endDateForAPI =
                  parsedEnd && isDaily ? getExclusiveEndDate(parsedEnd, timeZone) : parsedEnd;
                return v ? { startDate: parsedStart, endDate: endDateForAPI } : v;
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
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(allTimeSlots, timeZone)}
              disabled={fetchLineItemsInProgress}
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
              onClose={() => {
                setCurrentMonth(startDate || endDate || startOfToday);
              }}
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
