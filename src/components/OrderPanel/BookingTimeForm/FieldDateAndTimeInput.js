import React, { Component, useState, useEffect } from 'react';
import { func, number, object, string } from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import { FieldArray } from 'react-final-form-arrays';
import { useLocation } from 'react-router-dom';
import * as validators from '../../../util/validators';
import { intlShape } from '../../../util/reactIntl';
import {
  getPartial,
  getStartHours,
  getEndHours,
  isInRange,
  isSameDate,
  isDayMomentInsideRange,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  isDateSameOrAfter,
  findNextBoundary,
  timestampToDate,
  formatDateIntoPartials,
  monthIdString,
  getStartOf,
  initialVisibleMonth,
} from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { bookingDateRequired } from '../../../util/validators';
import {
  FieldDateInput,
  FieldSelect,
  FieldTextInput,
  IconArrowHead,
  Form,
  H6,
  PrimaryButton,
  FieldCheckbox,
  FieldRadioButton,
} from '../..';
import { checkCoupon } from '../../../util/api';
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

const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking - 1, 'days');

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

    const hours =   getPartial(startLimit) //getStartHours(startLimit, endLimit, timeZone, intl);
    return availableHours.concat(hours);
    return availableHours.concat(hours);
  }, []);
  return allHours;
};

const getAvailableEndTimes = (
  intl,
  timeZone,
  bookingStartTime,
  bookingEndDate,
  selectedTimeSlot,
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

  return [
    {
      timeOfDay: formatDateIntoPartials(endLimit, intl, { timeZone })?.time,
      timestamp: moment(endLimit).tz(timeZone).valueOf(),
    },
  ];
};

const getTimeSlots = (timeSlots, date, timeZone) =>
  timeSlots && timeSlots[0]
    ? timeSlots.filter((t) =>
        isInRange(date, t.attributes.start, t.attributes.end, 'day', timeZone),
      )
    : [];

// Use start date to calculate the first possible start time or times, end date and end time or times.
// If the selected value is passed to function it will be used instead of calculated value.
const getAllTimeValues = (
  intl,
  timeZone,
  timeSlots,
  startDate,
  selectedStartTime,
  selectedEndDate,
) => {
  const startTimes = selectedStartTime
    ? []
    : getAvailableStartTimes(
        intl,
        timeZone,
        startDate,
        getTimeSlots(timeSlots, startDate, timeZone),
      );

  // Value selectedStartTime is a string when user has selected it through the form.
  // That's why we need to convert also the timestamp we use as a default
  // value to string for consistency. This is expected later when we
  // want to compare the sartTime and endTime.
  const startTime =
    selectedStartTime ||
    (startTimes.length > 0 && startTimes[0] && startTimes[0].timestamp
      ? startTimes[0].timestamp.toString()
      : null);

  const startTimeAsDate = startTime ? timestampToDate(startTime) : null;

  // Note: We need to remove 1ms from the calculated endDate so that if the end
  // date would be the next day at 00:00 the day in the form is still correct.
  // Because we are only using the date and not the exact time we can remove the
  // 1ms.
  const endDate =
    selectedEndDate ||
    (startTimeAsDate
      ? new Date(findNextBoundary(startTimeAsDate, 'hour', timeZone).getTime() - 1)
      : null);

  const selectedTimeSlot = timeSlots.find((t) =>
    isInRange(startTimeAsDate, t.attributes.start, t.attributes.end),
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

const getMonthlyTimeSlots = (monthlyTimeSlots, date, timeZone) => {
  const monthId = monthIdString(date, timeZone);

  return !monthlyTimeSlots || Object.keys(monthlyTimeSlots).length === 0
    ? []
    : monthlyTimeSlots[monthId] && monthlyTimeSlots[monthId].timeSlots
      ? monthlyTimeSlots[monthId].timeSlots
      : [];
};

// IconArrowHead component might not be defined if exposed directly to the file.
// This component is called before IconArrowHead component in components/index.js
function PrevIcon(props) {
  return <IconArrowHead {...props} direction="left" rootClassName={css.arrowIcon} />;
}
function NextIcon(props) {
  return <IconArrowHead {...props} direction="right" rootClassName={css.arrowIcon} />;
}

function Next(props) {
  const { currentMonth, dayCountAvailableForBooking, timeZone } = props;
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone),
  ) ? null : (
    <NextIcon />
  );
}
function Prev(props) {
  const { currentMonth, timeZone } = props;
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);

  return isDateSameOrAfter(prevMonthDate, currentMonthDate) ? <PrevIcon /> : null;
}

/// //////////////////////////////////
// FieldDateAndTimeInput component //
/// //////////////////////////////////
class FieldDateAndTimeInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentMonth: getStartOf(TODAY, 'month', props.timeZone),
      validSeatsInput: false,
    };

    this.fetchMonthData = this.fetchMonthData.bind(this);
    this.onMonthClick = this.onMonthClick.bind(this);
    this.onBookingStartDateChange = this.onBookingStartDateChange.bind(this);
    this.onBookingStartTimeChange = this.onBookingStartTimeChange.bind(this);
    this.onBookingEndDateChange = this.onBookingEndDateChange.bind(this);
    this.isOutsideRange = this.isOutsideRange.bind(this);
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
      (prevState) => ({ currentMonth: monthFn(prevState.currentMonth, timeZone) }),
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
      },
    );
  }

  onBookingStartDateChange = (value) => {
    const { monthlyTimeSlots, timeZone, intl, form, values } = this.props;
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
    const timeSlots = getMonthlyTimeSlots(monthlyTimeSlots, this.state.currentMonth, timeZone);
    const timeSlotsOnSelectedDate = getTimeSlots(timeSlots, startDate, timeZone);

    const { startTime, endDate, endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate,
    );

    form.batch(() => {
      form.change('bookingStartTime', startTime);
      form.change('bookingEndDate', { date: endDate });
      form.change('bookingEndTime', endTime);

      if (!values.seats) {
        form.change('seats', 1);
        form.change('guestNames', ['']);
      }
    });
  };

  onBookingStartTimeChange = (value) => {
    const { monthlyTimeSlots, timeZone, intl, form, values } = this.props;
    const timeSlots = getMonthlyTimeSlots(monthlyTimeSlots, this.state.currentMonth, timeZone);
    const startDate = values.bookingStartDate.date;
    const timeSlotsOnSelectedDate = getTimeSlots(timeSlots, startDate, timeZone);

    const { endDate, endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate,
      value,
    );

    form.batch(() => {
      form.change('bookingEndDate', { date: endDate });
      form.change('bookingEndTime', endTime);
    });
  };

  onBookingEndDateChange = (value) => {
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
    const timeSlots = getMonthlyTimeSlots(monthlyTimeSlots, this.state.currentMonth, timeZone);
    const timeSlotsOnSelectedDate = getTimeSlots(timeSlots, startDate, timeZone);

    const { endTime } = getAllTimeValues(
      intl,
      timeZone,
      timeSlotsOnSelectedDate,
      startDate,
      bookingStartTime,
      endDate,
    );

    form.change('bookingEndTime', endTime);
  };

  isOutsideRange(day, bookingStartDate, selectedTimeSlot, timeZone) {
    if (!selectedTimeSlot) {
      return true;
    }

    // 'day' is pointing to browser's local time-zone (react-dates gives these).
    // However, bookingStartDate and selectedTimeSlot refer to times in listing's timeZone.
    const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    // Given day (endDate) should be after the start of the day of selected booking start date.
    const startDate = getStartOf(bookingStartDate, 'day', timeZone);
    // 00:00 would return wrong day as the end date.
    // Removing 1 millisecond, solves the exclusivity issue.
    const inclusiveEnd = new Date(selectedTimeSlot.attributes.end.getTime() - 1);
    // Given day (endDate) should be before the "next" day of selected timeSlots end.
    const endDate = getStartOf(inclusiveEnd, 'day', timeZone, 1, 'days');
    return !(
      isDateSameOrAfter(localizedDay, startDate) && isDateSameOrAfter(endDate, localizedDay)
    );
  }

  render() {
    const {
      rootClassName,
      className,
      formId,
      startDateInputProps,
      // endDateInputProps,
      values,
      monthlyTimeSlots,
      publicData,
      timeZone,
      intl,
      dayCountAvailableForBooking,
      seatsLabel,
      form,
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);

    const bookingStartDate =
      values.bookingStartDate && values.bookingStartDate.date ? values.bookingStartDate.date : null;

    const bookingStartTime = values.bookingStartTime ? values.bookingStartTime : null;
    const bookingEndDate =
      values.bookingEndDate && values.bookingEndDate.date ? values.bookingEndDate.date : null;

    const timeSlotsOnSelectedMonth = getMonthlyTimeSlots(
      monthlyTimeSlots,
      this.state.currentMonth,
      timeZone,
    );
    const timeSlotsOnSelectedDate = getTimeSlots(
      timeSlotsOnSelectedMonth,
      bookingStartDate,
      timeZone,
    );

    const availableStartTimes = getAvailableStartTimes(
      intl,
      timeZone,
      bookingStartDate,
      timeSlotsOnSelectedDate,
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
      bookingEndDate || bookingStartDate,
    );

    const availableEndTimes = getAvailableEndTimes(
      intl,
      timeZone,
      bookingStartTime || startTime,
      bookingEndDate || endDate,
      selectedTimeSlot,
    );

    const isDayBlocked = timeSlotsOnSelectedMonth
      ? (day) =>
          !timeSlotsOnSelectedMonth.find((timeSlot) =>
            isDayMomentInsideRange(
              day,
              timeSlot.attributes.start,
              timeSlot.attributes.end,
              timeZone,
            ),
          )
      : () => false;

    const nextBoundary = findNextBoundary(TODAY, 'hour', timeZone);
    let placeholderTime = '08:00';
    try {
      placeholderTime = formatDateIntoPartials(nextBoundary, intl, { timeZone })?.time;
    } catch (error) {
      // No need to handle error
    }

    const isSeatDisabled = (seatNumber) => {
      const isSpecialListing =
        this.props.listingId &&
        this.props.listingId.uuid === '65fc542d-96ee-422d-b0e6-0075f9a1c683' &&
        seatNumber % 2 !== 0 &&
        seatNumber !== 3; // Disable odd numbers except 3

      const minSeats = parseInt(publicData.min);
      const isBelowMinimum = minSeats && seatNumber < minSeats;

      return isSpecialListing || isBelowMinimum;
    };

    const seatsArray = selectedTimeSlot
      ? Array(selectedTimeSlot.attributes.seats)
          .fill()
          .map((_, i) => i + 1)
      : [];
    // 65fc542d-96ee-422d-b0e6-0075f9a1c683
    const visibleSeats = seatsArray.filter((seat) => !isSeatDisabled(seat));

    const seatsSelectionMaybe =
      visibleSeats.length > 0 ? (
        <FieldSelect
          className={css.fieldDateInput}
          onChange={(value) => {
            form.batch(() => {
              form.change('guestNames', []);
              if (value > 0) {
                for (let index = 0; index < value; index++) {
                  form.mutators.push(`guestNames[${index}]`, '');
                }
              }
            });
          }}
          name="seats"
          id="seats"
          label="In quanti siete?"
        >
          <option value="" key="default">
            -
          </option>
          {visibleSeats.map((s) => (
            <option value={s} key={s}>
              {s}
            </option>
          ))}
        </FieldSelect>
      ) : (
        <FieldSelect
          className={css.fieldDateInput}
          name="seats"
          id="seats"
          label="In quanti siete?" // TITLES
        >
          <option value="" key="default">
            -
          </option>
        </FieldSelect>
      );
    const startOfToday = getStartOf(TODAY, 'day', timeZone);
    const bookingEndTimeAvailable = bookingStartDate && (bookingStartTime || startTime);

    const locationMapping = {
      1: "Dall'artista (es. nello suo studio di ceramica, nella sua fioreria)",
      2: 'Da me (es. in ufficio, a casa, durante una festa)',
    };

    const languageMapping = {
      1: 'Italiano',
      2: 'English',
      3: 'Español',
      4: 'Français',
      5: 'Deutsch',
      6: 'Español',
    };

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
              format={(v) =>
                v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : v
              }
              parse={(v) =>
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
                intl.formatMessage({ id: 'BookingTimeForm.requiredDate' }),
              )}
              onClose={(event) =>
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
                availableStartTimes.map((p) => (
                  <option key={p.timeOfDay} value={p.timestamp}>
                    {p.timeOfDay}
                  </option>
                ))
              ) : (
                <option>{placeholderTime}</option>
              )}
            </FieldSelect>
          </div>

          <div className={bookingStartDate ? css.lineBetween : css.lineBetweenDisabled}> </div>

          <div className={css.field}>
            <FieldSelect
              name="bookingEndTime"
              id={formId ? `${formId}.bookingEndTime` : 'bookingEndTime'}
              className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
              selectClassName={bookingStartDate ? css.select : css.selectDisabled}
              label={intl.formatMessage({ id: 'FieldDateAndTimeInput.endTime' })}
              disabled
            >
              {bookingEndTimeAvailable ? (
                availableEndTimes.map((p) => (
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
        <div className={css.extras}>{seatsSelectionMaybe}</div>
        {!!seatsSelectionMaybe && (
          <FieldArray name="guestNames" className={css.fieldSelect}>
            {({ fields }) => {
              // If the listing type is 'teambuilding', only render one FieldTextInput
              if (this.props.publicData?.listingType === 'teambuilding') {
                return (
                  <FieldTextInput
                    id="teamName"
                    name="guestNames[0]" // Ensure it's part of the guestNames array
                    key={0}
                    className={css.extras}
                    type="text"
                    label={intl.formatMessage(
                      {
                        id: 'FieldDateAndTimeInput.teamNameLabel',
                      },
                      { number: 1 },
                    )}
                    placeholder="-" // {intl.formatMessage( {id: 'FieldDateAndTimeInput.teamNamePlaceholder',  }, { number: 1 } )}
                    validate={validators.required(
                      intl.formatMessage({
                        id: 'FieldDateAndTimeInput.requiredGuestName',
                      }),
                    )}
                  />
                );
              }

              // Otherwise, use the existing logic for rendering the fields
              return fields.map((name, index) => {
                const isOddNumber = (index + 1) % 2 !== 0;

                if (
                  (this.props.listingId.uuid === '65fc542d-96ee-422d-b0e6-0075f9a1c683' &&
                    isOddNumber &&
                    index !== 0) ||
                  (this.props.publicData &&
                    this.props.publicData.listingType === 'teambuilding' &&
                    isOddNumber &&
                    index !== 0)
                ) {
                  return null; // Skip rendering for all odd-numbered indexes except the first one
                }

                return (
                  <>
                    <FieldTextInput
                      id={name}
                      name={name}
                      key={index}
                      className={css.extras}
                      type="text"
                      label={intl.formatMessage(
                        {
                          id:
                            this.props.listingId?.uuid === '65fc542d-96ee-422d-b0e6-0075f9a1c683'
                              ? 'FieldDateAndTimeInput.coupleNameLabel'
                              : 'FieldDateAndTimeInput.guestNameLabel',
                        },
                        { number: index + 1 },
                      )}
                      placeholder={intl.formatMessage(
                        {
                          id:
                            this.props.listingId?.uuid === '65fc542d-96ee-422d-b0e6-0075f9a1c683'
                              ? 'FieldDateAndTimeInput.coupleNamePlaceholder'
                              : 'FieldDateAndTimeInput.guestNamePlaceholder',
                        },
                        { number: index + 1 },
                      )}
                      validate={validators.required(
                        intl.formatMessage({
                          id: 'FieldDateAndTimeInput.requiredGuestName',
                        }),
                      )}
                    />
                    {this.props.listingId?.uuid === '66dac9f8-e2e3-4611-a30c-64df1ef9ff68' && (
                      <div className={css.extras}>
                        <FieldRadioButton
                          id={`${formId}.fee${index}1`}
                          name={`fee[${index}]`}
                          label="Tappeto Small"
                          value="smallFee"
                        />
                        <FieldRadioButton
                          id={`${formId}.fee${index}2`}
                          name={`fee[${index}]`}
                          label="Tappeto Medium"
                          value="mediumFee"
                        />
                        <FieldRadioButton
                          id={`${formId}.fee${index}3`}
                          name={`fee[${index}]`}
                          label="Tappeto Large"
                          value="largeFee"
                        />
                      </div>
                    )}
                  </>
                );
              });
            }}
          </FieldArray>
        )}

        {publicData?.listingType === 'teambuilding' && !!seatsSelectionMaybe && (
          <FieldSelect
            className={css.extras}
            onChange={(value) => {
              form.batch(() => {
                form.change('location', []);
                if (value > 0) {
                  for (let index = 0; index < value; index++) {
                    form.mutators.push(`location[${index}]`, '');
                  }
                }
              });
            }}
            name="Location"
            id="location"
            label="Dove?"
          >
            <option value="" key="default">
              Seleziona Location
            </option>
            {publicData.loc.map((s) => (
              <option value={s} key={s}>
                {locationMapping[s] || s}
              </option>
            ))}
          </FieldSelect>
        )}

        {publicData?.listingType === 'teambuilding' && !!seatsSelectionMaybe && (
          <FieldSelect
            className={css.extras}
            onChange={(value) => {
              form.batch(() => {
                form.change('language', []);
                if (value > 0) {
                  for (let index = 0; index < value; index++) {
                    form.mutators.push(`language[${index}]`, '');
                  }
                }
              });
            }}
            name="Language"
            id="language"
            label="Lingua:"
          >
            <option value="" key="default">
              Seleziona Lingua
            </option>
            {publicData?.language?.map((s) => (
              <option value={s} key={s}>
                {languageMapping[s] || s}
              </option>
            ))}
          </FieldSelect>
        )}
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
