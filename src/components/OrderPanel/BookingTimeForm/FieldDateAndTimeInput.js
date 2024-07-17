import React, { Component } from 'react';
import { func, number, object, string } from 'prop-types';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { intlShape } from '../../../util/reactIntl';
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
  formatDateIntoPartials,
  monthIdString,
  getStartOf,
  initialVisibleMonth,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { bookingDateRequired } from '../../../util/validators';
import { FieldDateInput, FieldSelect, IconArrowHead } from '../../../components';

import css from './FieldDateAndTimeInput.module.css';

// dayCountAvailableForBooking is the maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged:
// https://stripe.com/docs/connect/account-balances#holding-funds
//
// See also the API reference for querying time slots:
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots

const TODAY = new Date();

const nextMonthFn = (currentMoment, timeZone) =>
  getStartOf(currentMoment, 'month', timeZone, 1, 'months');
const prevMonthFn = (currentMoment, timeZone) =>
  getStartOf(currentMoment, 'month', timeZone, -1, 'months');

const endOfRange = (date, dayCountAvailableForBooking, timeZone) => {
  return getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');
};

/**
 * Get the start of the month in given time zone.
 *
 * @param {String} monthId (e.g. '2024-07')
 * @param {String} timeZone time zone id (E.g. 'Europe/Helsinki')
 * @returns {Date} start of month
 */
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

const getAvailableStartTimes = (intl, timeZone, bookingStart, timeSlotsOnSelectedDate) => {
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

const getAvailableEndTimes = (
  intl,
  timeZone,
  bookingStartTime,
  bookingEndDate,
  selectedTimeSlot
) => {
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

const getTimeSlots = (timeSlots, date, timeZone) => {
  return timeSlots && timeSlots[0]
    ? timeSlots.filter(t => {
        return isInRange(date, t.attributes.start, t.attributes.end, 'day', timeZone);
      })
    : [];
};

// Use start date to calculate the first possible start time or times, end date and end time or times.
// If the selected value is passed to function it will be used instead of calculated value.
const getAllTimeValues = (
  intl,
  timeZone,
  timeSlots,
  startDate,
  selectedStartTime,
  selectedEndDate
) => {
  const startTimes = selectedStartTime
    ? []
    : getAvailableStartTimes(
        intl,
        timeZone,
        startDate,
        getTimeSlots(timeSlots, startDate, timeZone)
      );

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
    ? new Date(findNextBoundary(startTimeAsDate, 'hour', timeZone).getTime() - 1)
    : null;

  const selectedTimeSlot = timeSlots.find(t =>
    isInRange(startTimeAsDate, t.attributes.start, t.attributes.end)
  );

  const endTimes = getAvailableEndTimes(intl, timeZone, startTime, endDate, selectedTimeSlot);

  // We need to convert the timestamp we use as a default value
  // for endTime to string for consistency. This is expected later when we
  // want to compare the sartTime and endTime.
  const endTime =
    endTimes.length > 0 && endTimes[0] && endTimes[0].timestamp
      ? endTimes[0].timestamp.toString()
      : null;

  return { startTime, endDate, endTime, selectedTimeSlot };
};

/**
 * Get all the time slots that touch the given date.
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @param {Date} date
 * @param {String} timeZone IANA time zone key
 * @returns {Array<TimeSlot>}
 */
const getTimeSlotsOnDate = (monthlyTimeSlots, date, timeZone) => {
  const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);
  const startIdString = stringifyDateToISO8601(date, timeZone);
  return timeSlotsData[startIdString]?.timeSlots || [];
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

/////////////////////////////////////
// FieldDateAndTimeInput component //
/////////////////////////////////////
class FieldDateAndTimeInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentMonth: getStartOf(TODAY, 'month', props.timeZone),
    };

    this.fetchMonthData = this.fetchMonthData.bind(this);
    this.onMonthClick = this.onMonthClick.bind(this);
    this.onBookingStartDateChange = this.onBookingStartDateChange.bind(this);
    this.onBookingStartTimeChange = this.onBookingStartTimeChange.bind(this);
    this.onBookingEndDateChange = this.onBookingEndDateChange.bind(this);
  }

  fetchMonthData(date) {
    const { listingId, timeZone, onFetchTimeSlots, dayCountAvailableForBooking } = this.props;
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
  }

  onMonthClick(monthFn) {
    const { onMonthChanged, timeZone } = this.props;

    this.setState(
      prevState => ({ currentMonth: monthFn(prevState.currentMonth, timeZone) }),
      () => {
        // Callback function after month has been updated.
        // react-dates component has next and previous months ready (but inivisible).
        // we try to populate those invisible months before user advances there.
        this.fetchMonthData(monthFn(this.state.currentMonth, timeZone));

        // If previous fetch for month data failed, try again.
        const monthId = monthIdString(this.state.currentMonth, timeZone);
        const currentMonthData = this.props.monthlyTimeSlots[monthId];
        if (currentMonthData && currentMonthData.fetchTimeSlotsError) {
          this.fetchMonthData(this.state.currentMonth);
        }

        // Call onMonthChanged function if it has been passed in among props.
        if (onMonthChanged) {
          onMonthChanged(monthId);
        }
      }
    );
  }

  onBookingStartDateChange = value => {
    const { monthlyTimeSlots, timeZone, intl, form } = this.props;
    if (!value || !value.date) {
      form.batch(() => {
        form.change('bookingStartTime', null);
        form.change('bookingEndDate', { date: null });
        form.change('bookingEndTime', null);
      });
      // Reset the currentMonth too if bookingStartDate is cleared
      this.setState({ currentMonth: getStartOf(TODAY, 'month', timeZone) });

      return;
    }

    // This callback function (onBookingStartDateChange) is called from react-dates component.
    // It gets raw value as a param - browser's local time instead of time in listing's timezone.
    const startDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
    const timeSlotsOnSelectedDate = getTimeSlotsOnDate(monthlyTimeSlots, startDate, timeZone);

    const { startTime, endDate, endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate
    );

    form.batch(() => {
      form.change('bookingStartTime', startTime);
      form.change('bookingEndDate', { date: endDate });
      form.change('bookingEndTime', endTime);
    });
  };

  onBookingStartTimeChange = value => {
    const { monthlyTimeSlots, timeZone, intl, form, values } = this.props;
    const startDate = values.bookingStartDate.date;
    const timeSlotsOnSelectedDate = getTimeSlotsOnDate(monthlyTimeSlots, startDate, timeZone);

    const { endDate, endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate,
      value
    );

    form.batch(() => {
      form.change('bookingEndDate', { date: endDate });
      form.change('bookingEndTime', endTime);
    });
  };

  onBookingEndDateChange = value => {
    const { monthlyTimeSlots, timeZone, intl, form, values } = this.props;
    if (!value || !value.date) {
      form.change('bookingEndTime', null);
      return;
    }

    // This callback function (onBookingStartDateChange) is called from react-dates component.
    // It gets raw value as a param - browser's local time instead of time in listing's timezone.
    const endDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);

    const { bookingStartDate, bookingStartTime } = values;
    const startDate = bookingStartDate.date;
    const timeSlotsOnSelectedDate = getTimeSlotsOnDate(monthlyTimeSlots, startDate, timeZone);

    const { endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate,
      bookingStartTime,
      endDate
    );

    form.change('bookingEndTime', endTime);
  };

  render() {
    const {
      rootClassName,
      className,
      formId,
      startDateInputProps,
      // endDateInputProps,
      values,
      monthlyTimeSlots,
      timeZone,
      intl,
      dayCountAvailableForBooking,
    } = this.props;

    const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);
    const monthId = monthIdString(this.state.currentMonth);
    const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
    const nextMonthId = monthIdString(nextMonthFn(this.state.currentMonth, timeZone));
    const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

    if (appSettings.dev && appSettings.verbose && !currentMonthInProgress && !nextMonthInProgress) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const currentMonth = this.state.currentMonth;
      const nextMonth = nextMonthFn(currentMonth, timeZone);
      const timeSlotsData = timeSlotsPerDate(currentMonth, nextMonth, allTimeSlots, timeZone);
      const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);

      console.log(
        `Fetched months: ${monthIdString(startMonth, timeZone)} ... ${monthIdString(
          lastFetchedMonth,
          timeZone
        )}`,
        '\nTime slots for the current month:',
        timeSlotsData
      );
    }

    const classes = classNames(rootClassName || css.root, className);

    const bookingStartDate = values.bookingStartDate?.date || null;
    const bookingStartTime = values.bookingStartTime || null;
    const bookingEndDate = values.bookingEndDate?.date || null;

    // Currently available monthly data
    const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
    const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);
    const bookingStartIdString = stringifyDateToISO8601(bookingStartDate, timeZone);
    const timeSlotsOnSelectedDate = timeSlotsData[bookingStartIdString]?.timeSlots || [];

    const availableStartTimes = getAvailableStartTimes(
      intl,
      timeZone,
      bookingStartDate,
      timeSlotsOnSelectedDate
    );

    const firstAvailableStartTime =
      availableStartTimes.length > 0 && availableStartTimes[0] && availableStartTimes[0].timestamp
        ? availableStartTimes[0].timestamp
        : null;

    const { startTime, endDate, selectedTimeSlot } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      bookingStartDate,
      bookingStartTime || firstAvailableStartTime,
      bookingEndDate || bookingStartDate
    );

    const availableEndTimes = getAvailableEndTimes(
      intl,
      timeZone,
      bookingStartTime || startTime,
      bookingEndDate || endDate,
      selectedTimeSlot
    );

    const isDayBlocked = day => {
      const dateIdString = stringifyDateToISO8601(day, timeZone);
      const timeSlotData = timeSlotsData[dateIdString];
      return !timeSlotData?.hasAvailability;
    };

    const nextBoundary = findNextBoundary(TODAY, 'hour', timeZone);
    let placeholderTime = '08:00';
    try {
      placeholderTime = formatDateIntoPartials(nextBoundary, intl, { timeZone })?.time;
    } catch (error) {
      // No need to handle error
    }

    const startOfToday = getStartOf(TODAY, 'day', timeZone);
    const bookingEndTimeAvailable = bookingStartDate && (bookingStartTime || startTime);
    return (
      <div className={classes}>
        <div className={css.formRow}>
          <div className={classNames(css.field, css.startDate)}>
            <FieldDateInput
              className={css.fieldDateInput}
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
              initialVisibleMonth={initialVisibleMonth(bookingStartDate || startOfToday, timeZone)}
              isDayBlocked={isDayBlocked}
              onChange={this.onBookingStartDateChange}
              onPrevMonthClick={() => this.onMonthClick(prevMonthFn)}
              onNextMonthClick={() => this.onMonthClick(nextMonthFn)}
              navNext={
                <Next
                  currentMonth={this.state.currentMonth}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                />
              }
              navPrev={<Prev currentMonth={this.state.currentMonth} timeZone={timeZone} />}
              useMobileMargins
              validate={bookingDateRequired(
                intl.formatMessage({ id: 'BookingTimeForm.requiredDate' })
              )}
              onClose={event =>
                this.setState({
                  currentMonth: getStartOf(event?.date ?? TODAY, 'month', this.props.timeZone),
                })
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
              onChange={this.onBookingStartTimeChange}
            >
              {bookingStartDate ? (
                availableStartTimes.map(p => (
                  <option key={p.timeOfDay} value={p.timestamp}>
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
            >
              {bookingEndTimeAvailable ? (
                availableEndTimes.map(p => (
                  <option key={p.timeOfDay === '00:00' ? '24:00' : p.timeOfDay} value={p.timestamp}>
                    {p.timeOfDay === '00:00' ? '24:00' : p.timeOfDay}
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
  }
}

FieldDateAndTimeInput.defaultProps = {
  rootClassName: null,
  className: null,
  startDateInputProps: null,
  endDateInputProps: null,
  startTimeInputProps: null,
  endTimeInputProps: null,
  listingId: null,
  monthlyTimeSlots: null,
  timeZone: null,
};

FieldDateAndTimeInput.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  startDateInputProps: object,
  endDateInputProps: object,
  startTimeInputProps: object,
  endTimeInputProps: object,
  form: object.isRequired,
  values: object.isRequired,
  listingId: propTypes.uuid,
  monthlyTimeSlots: object,
  onFetchTimeSlots: func.isRequired,
  timeZone: string,
  dayCountAvailableForBooking: number,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default FieldDateAndTimeInput;
