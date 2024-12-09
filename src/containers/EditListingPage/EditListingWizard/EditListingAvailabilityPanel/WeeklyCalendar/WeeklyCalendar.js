import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../../config/settings';
import { FormattedDate, FormattedMessage, useIntl } from '../../../../../util/reactIntl';
import {
  getStartOf,
  getStartOfWeek,
  getEndOfWeek,
  isInRange,
  parseDateFromISO8601,
  parseDateTimeString,
  stringifyDateToISO8601,
  isSameDate,
} from '../../../../../util/dates';
import { availabilityPerDate } from '../../../../../util/generators';
import { createResourceLocatorString } from '../../../../../util/routes';
import { DATE_TYPE_DATE, DATE_TYPE_TIME } from '../../../../../util/types';

// Import shared components
import {
  Heading,
  H4,
  IconArrowHead,
  IconDelete,
  IconSpinner,
  TimeRange,
} from '../../../../../components';

import {
  endOfAvailabilityExceptionRange,
  getStartOfNextWeek,
  getStartOfPrevWeek,
  handleWeekClick,
} from '../availability.helpers';

import Next from './NextArrow';
import Prev from './PrevArrow';
import WeekPicker from './WeekPicker';
import css from './WeeklyCalendar.module.css';

const TODAY = new Date();

/////////////
// Weekday //
/////////////

// A UI component that renders weekday and date on a given time zone:
//   Monday
//   January 9
// It's complement in the grid of WeeklyCalendar is CalendarDate,
// which contains information about availability plan, and exceptions on that date.
const DateLabel = ({ dateId, hasAvailability, timeZone }) => {
  const date = parseDateFromISO8601(dateId, timeZone);
  return (
    <div
      className={classNames(css.dateLabelContainer, { [css.blockedDateLabel]: !hasAvailability })}
    >
      <H4 className={classNames(css.dateLabel)}>
        <FormattedDate value={date} weekday="long" timeZone={timeZone} />
        <br />
        <span className={css.dateAndMonth}>
          <FormattedDate value={date} month="long" day="numeric" timeZone={timeZone} />
        </span>
      </H4>
    </div>
  );
};

const DayScheduleEntry = ({
  date,
  range,
  useFullDays,
  useMultipleSeats,
  isDaily,
  timeZone,
  onDeleteAvailabilityException,
  intl,
  ...rest
}) => {
  const seats = range.seats;
  const isAvailable = range.seats > 0;
  const setBy = range.exception ? 'exception' : 'plan';
  const startOfDay = getStartOf(range.start, 'day', timeZone);
  const startOfNextDay = getStartOf(range.start, 'day', timeZone, 1, 'days');
  const startsAtTheStartOfDay = isSameDate(range.start, startOfDay);
  const endsAtTheEndOfDay = isSameDate(range.end, startOfNextDay);
  const isFullDay = startsAtTheStartOfDay && endsAtTheEndOfDay;

  if (!isAvailable && !isFullDay && setBy === 'plan') {
    // Don't show blocked time-ranges, when it comes from the default schedule.
    // This is mainly done to make date schedules shorter
    return null;
  }

  const ex = range.exception;
  const exception = ex ? (
    <ExceptionEntry
      key={ex.id.uuid}
      exception={ex}
      timeZone={timeZone}
      useFullDays={useFullDays}
      isDaily={isDaily}
      onDeleteAvailabilityException={onDeleteAvailabilityException}
    />
  ) : (
    ''
  );

  return (
    <div className={css.dayEntry} {...rest}>
      <div
        className={classNames(css.availabilityDot, {
          [css.isAvailable]: isAvailable,
        })}
      />
      {useFullDays ? (
        <div className={css.daySchedule}>
          <div className={css.entryRange}>
            <FormattedMessage
              id={
                isAvailable
                  ? 'EditListingAvailabilityPanel.WeeklyCalendar.available'
                  : 'EditListingAvailabilityPanel.WeeklyCalendar.notAvailable'
              }
            />
          </div>
          {useMultipleSeats && !(seats === 0) ? (
            <div className={css.seats}>
              <FormattedMessage
                id="EditListingAvailabilityPanel.WeeklyCalendar.seats"
                values={{ seats }}
              />
            </div>
          ) : null}
          {setBy === 'exception' ? (
            <div className={css.sourceMaybe}>
              <FormattedMessage
                id="EditListingAvailabilityPanel.WeeklyCalendar.exception"
                values={{ seats, exception }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className={css.daySchedule}>
          <div className={css.entryRange}>
            {isFullDay ? (
              <FormattedMessage
                id={
                  isAvailable
                    ? 'EditListingAvailabilityPanel.WeeklyCalendar.available'
                    : 'EditListingAvailabilityPanel.WeeklyCalendar.notAvailable'
                }
              />
            ) : (
              <TimeRange
                className={css.timeRange}
                startDate={range.start}
                endDate={range.end}
                dateType={useFullDays ? DATE_TYPE_DATE : DATE_TYPE_TIME}
                timeZone={timeZone}
              />
            )}
          </div>
          {useMultipleSeats && !(seats === 0) ? (
            <div className={css.seats}>
              <FormattedMessage
                id="EditListingAvailabilityPanel.WeeklyCalendar.seats"
                values={{ seats }}
              />
            </div>
          ) : null}
          {setBy === 'exception' ? (
            <div className={css.sourceMaybe}>
              <FormattedMessage
                id="EditListingAvailabilityPanel.WeeklyCalendar.exception"
                values={{ seats, exception }}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Component that renders an exception that touches the given date in the WeeklyCalendar
const ExceptionEntry = ({
  exception,
  useFullDays,
  isDaily,
  timeZone,
  onDeleteAvailabilityException,
}) => {
  const millisecondBeforeEndTime = new Date(exception.attributes.end.getTime() - 1);
  const rangeEnd = isDaily ? millisecondBeforeEndTime : exception.attributes.end;
  return (
    <div className={css.exception}>
      <TimeRange
        className={classNames(css.timeRange, css.exceptionMsg)}
        startDate={exception.attributes.start}
        endDate={rangeEnd}
        dateType={useFullDays ? DATE_TYPE_DATE : DATE_TYPE_TIME}
        timeZone={timeZone}
      />
      <button
        className={css.deleteButton}
        onClick={() => onDeleteAvailabilityException({ id: exception.id })}
      >
        <span className={css.deleteIconWrapper}>
          <IconDelete rootClassName={css.deleteIcon} />
        </span>
      </button>
    </div>
  );
};

// The calendar date info (related to <DateLabel>)
const CalendarDate = props => {
  const intl = useIntl();
  const {
    availabilityData,
    hasAvailability,
    isDaily,
    useFullDays,
    useMultipleSeats,
    onDeleteAvailabilityException,
    fetchExceptionsInProgress,
    fetchExceptionsError,
    timeZone,
  } = props;
  const hasPlanEntries = availabilityData?.planEntries?.length > 0;
  const hasExceptions = availabilityData?.exceptions?.length > 0;
  const date = parseDateFromISO8601(availabilityData?.id, timeZone);

  return (
    <div className={classNames(css.date, { [css.blockedDate]: !hasAvailability })}>
      <div className={css.info}>
        {hasPlanEntries || hasExceptions ? (
          <div className={css.dayEntries}>
            {availabilityData.ranges.map((r, i) => {
              return (
                <DayScheduleEntry
                  key={`entry${i}`}
                  date={date}
                  range={r}
                  timeZone={timeZone}
                  isDaily={isDaily}
                  useFullDays={useFullDays}
                  useMultipleSeats={useMultipleSeats}
                  onDeleteAvailabilityException={onDeleteAvailabilityException}
                  intl={intl}
                />
              );
            })}
          </div>
        ) : (
          <div className={css.dayEntry}>
            <div className={classNames(css.availabilityDot)} />
            <div className={css.daySchedule}>
              <div className={css.entryRange}>
                <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.notAvailable" />
              </div>
            </div>
          </div>
        )}

        {fetchExceptionsInProgress || fetchExceptionsError ? (
          <div className={css.exceptionsContainer}>
            {fetchExceptionsInProgress ? (
              <IconSpinner />
            ) : fetchExceptionsError ? (
              <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.fetchExceptionsError" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/////////////////////
// WeeklyCalendar //
/////////////////////

const getStartOfSelectedWeek = ({ locationSearch, timeZone, firstDayOfWeek }) => {
  const selectedDate = locationSearch?.d
    ? parseDateFromISO8601(locationSearch.d, timeZone)
    : new Date();
  return getStartOfWeek(selectedDate, timeZone, firstDayOfWeek);
};

// Formatted week range for the label of WeekPicker component
const FormattedWeekRange = ({ currentWeek, endOfCurrentWeek, timeZone, intl }) => {
  const formattingOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone };
  const formatted = intl.formatDateTimeRange(currentWeek, endOfCurrentWeek, formattingOptions);
  const dash = '–';
  const breakWordMinLenght = 30;
  const weekRange =
    formatted.length > breakWordMinLenght ? (
      formatted.split(dash).map((rangePartial, i) => (
        <span key={`weekspan${i}`} className={css.rangePart}>
          {rangePartial}
          {i == 0 ? ` ${dash} ` : null}
        </span>
      ))
    ) : (
      <span className={css.rangePart}>{formatted}</span>
    );
  return weekRange;
};

/**
 * @typedef {Object} AvailabilityException
 * @property {string} id
 * @property {'availabilityException'} type 'availabilityException'
 * @property {Object} attributes attributes
 * @property {Date} attributes.start The start of availability exception (inclusive)
 * @property {Date} attributes.end The end of availability exception (exclusive)
 * @property {Number} attributes.seats the number of seats available (0 means 'unavailable')
 */
/**
 * @typedef {Object} ExceptionQueryInfo
 * @property {Object|null} fetchExceptionsError
 * @property {boolean} fetchExceptionsInProgress
 */

/**
 * WeeklyCalendar shows the weekly data (plan entries & exceptions) on selected week (on given time zone)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.headerClassName
 * @param {Object} props.params pathparams
 * @param {0|1|2|3|4|5|6} props.firstDayOfWeek
 * @param {Object?} props.locationSearch parsed search params. 'd' is used as a week reference if passed through props
 * @param {UUID?} props.listingId listing's id
 * @param {Object?} props.availabilityPlan listing's availabilityPlan
 * @param {Array<AvailabilityException>} props.availabilityExceptions
 * @param {Object.<string, ExceptionQueryInfo>?} props.weeklyExceptionQueries E.g. '2022-12-14': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {boolean} props.isDaily
 * @param {boolean} props.useFullDays
 * @param {boolean} props.useMultipleSeats
 * @param {Function} props.onDeleteAvailabilityException
 * @param {Function} props.onFetchExceptions
 * @param {Object} props.routeConfiguration
 * @param {Object} props.history history from React Router
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
const WeeklyCalendar = props => {
  const [currentWeek, setCurrentWeek] = useState(
    getStartOfSelectedWeek({ ...props, timeZone: props.availabilityPlan.timezone })
  );
  const intl = useIntl();

  const {
    className,
    rootClassName,
    headerClassName,
    listingId,
    availabilityPlan,
    availabilityExceptions = [],
    weeklyExceptionQueries,
    isDaily,
    useMultipleSeats,
    useFullDays,
    onDeleteAvailabilityException,
    onFetchExceptions,
    params,
    firstDayOfWeek = 0,
    routeConfiguration,
    history,
  } = props;
  // Get all the AvailabilityExcetions
  const timeZone = availabilityPlan.timezone;
  const endOfRange = endOfAvailabilityExceptionRange(timeZone, new Date());
  const thisWeek = getStartOfWeek(TODAY, timeZone, firstDayOfWeek);
  const endOfCurrentWeek = getStartOf(currentWeek, 'day', timeZone, 6, 'days');
  const nextWeek = getStartOf(currentWeek, 'day', timeZone, 7, 'days');
  const availableDates = availabilityPerDate(
    currentWeek,
    nextWeek,
    availabilityPlan,
    availabilityExceptions
  );
  const currentWeekId = stringifyDateToISO8601(currentWeek, timeZone);
  const { fetchExceptionsInProgress, fetchExceptionsError } =
    weeklyExceptionQueries[currentWeekId] || {};

  useEffect(() => {
    // Redirect if the current week is not in year's range
    if (!isInRange(currentWeek, thisWeek, endOfRange, 'day', timeZone)) {
      setCurrentWeek(thisWeek);
      const redirectTo = createResourceLocatorString(
        'EditListingPage',
        routeConfiguration,
        params,
        {}
      );
      history.replace(redirectTo);
    }
  }, [currentWeek]);

  useEffect(() => {
    // On development mode, print also range info if "verbose" flag is true.
    if (appSettings.dev && appSettings.verbose && fetchExceptionsInProgress === false) {
      const formatRange = (start, end, available, timeZone) => {
        const formattingOptions = { hour: 'numeric', minute: 'numeric', timeZone };
        const formattedStart = intl.formatDate(start, formattingOptions);
        const formattedEnd = intl.formatDate(end, formattingOptions);
        const availabilityEmoji = available ? '✅' : '🚫';
        console.log('          ', availabilityEmoji, formattedStart, ' - ', formattedEnd);
      };

      console.log('\n\n%cDaily availability ranges:', 'font-weight: bold;');
      Object.keys(availableDates).forEach(d => {
        const weekday = intl.formatDate(availableDates[d]?.ranges?.[0]?.start, { weekday: 'long' });
        console.log(`\n${d} ${weekday}`);
        availableDates[d].ranges.map(r => {
          formatRange(r.start, r.end, r.seats > 0, timeZone);
        });
      });
    }
  }, [currentWeek, fetchExceptionsInProgress]);

  const daysOfWeekStrings = Object.keys(availableDates);
  const weekClickParams = {
    currentWeek,
    setCurrentWeek,
    weeklyExceptionQueries,
    listingId,
    timeZone,
    onFetchExceptions,
    firstDayOfWeek,
  };
  const onWeekClick = handleWeekClick(weekClickParams);

  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <header className={headerClassName}>
        <div className={css.titleWrapper}>
          <Heading as="h2" className={css.sectionTitle}>
            <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.scheduleTitle" />
          </Heading>
          <WeekPicker
            className={css.weekPicker}
            label={
              <div className={css.weekPickerLabel}>
                <span className={css.weekRange}>
                  <FormattedWeekRange
                    currentWeek={currentWeek}
                    endOfCurrentWeek={endOfCurrentWeek}
                    timeZone={timeZone}
                    intl={intl}
                  />
                </span>
                <span className={css.weekPickerIcon}>
                  <IconArrowHead size="small" direction="down" />
                </span>
              </div>
            }
            initialValues={{ dates: { startDate: currentWeek, endDate: endOfCurrentWeek } }}
            firstDayOfWeek={firstDayOfWeek}
            date={currentWeek}
            onDateChange={date => {
              const updatedDate = getStartOfWeek(date, timeZone, firstDayOfWeek);
              setCurrentWeek(updatedDate);
              const redirectTo = createResourceLocatorString(
                'EditListingPage',
                routeConfiguration,
                params,
                { d: stringifyDateToISO8601(updatedDate) }
              );
              history.replace(redirectTo);
            }}
            startDateOffset={day => {
              return day != null ? getStartOfWeek(day, null, firstDayOfWeek) : null;
            }}
            endDateOffset={day => {
              return day != null ? getEndOfWeek(day, null, firstDayOfWeek) : null;
            }}
            isOutsideRange={day => !isInRange(day, thisWeek, endOfRange, 'day', timeZone)}
            timeZone={timeZone}
          />
        </div>
        <div className={css.navigation}>
          <Prev
            className={css.prev}
            onClick={() => onWeekClick(getStartOfPrevWeek)}
            showUntilDate={thisWeek}
            startOfPrevRange={getStartOfPrevWeek(currentWeek, timeZone, firstDayOfWeek)}
            size="big"
          />
          <Next
            className={css.next}
            onClick={() => onWeekClick(getStartOfNextWeek)}
            showUntilDate={endOfAvailabilityExceptionRange(timeZone, TODAY)}
            startOfNextRange={getStartOfNextWeek(currentWeek, timeZone, firstDayOfWeek)}
            size="big"
          />
        </div>
      </header>

      <div className={css.grid}>
        {daysOfWeekStrings.reduce((all, dayString) => {
          const availabilityData = availableDates[dayString];
          const hasAvailability = availabilityData.hasAvailability;

          all.push(
            <DateLabel
              key={`label_${availabilityData?.id}`}
              dateId={availabilityData?.id}
              hasAvailability={hasAvailability}
              timeZone={timeZone}
            />
          );
          all.push(
            <CalendarDate
              key={dayString}
              availabilityData={availabilityData}
              hasAvailability={hasAvailability}
              onDeleteAvailabilityException={onDeleteAvailabilityException}
              isDaily={isDaily}
              useFullDays={useFullDays}
              useMultipleSeats={useMultipleSeats}
              timeZone={timeZone}
              fetchExceptionsInProgress={fetchExceptionsInProgress}
              fetchExceptionsError={fetchExceptionsError}
            />
          );
          return all;
        }, [])}
      </div>
    </section>
  );
};

export default WeeklyCalendar;
