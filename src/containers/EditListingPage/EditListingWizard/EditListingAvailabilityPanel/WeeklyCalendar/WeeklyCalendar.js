import React, { useEffect, useState } from 'react';
import { arrayOf, bool, func, number, object, shape, string } from 'prop-types';
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
} from '../../../../../util/dates';
import { availabilityPerDate } from '../../../../../util/generators';
import { createResourceLocatorString } from '../../../../../util/routes';
import { DATE_TYPE_DATE, DATE_TYPE_TIME, propTypes } from '../../../../../util/types';

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

const parseLocalizedTime = (date, timeString, timeZone) => {
  const dateString = stringifyDateToISO8601(date, timeZone);
  return parseDateTimeString(`${dateString} ${timeString}`, timeZone);
};

const getEndTimeAsDate = (date, endTime, isDaily, timeZone) => {
  const endTimeAsDate =
    endTime == '00:00' && !isDaily
      ? getStartOf(date, 'day', timeZone, 1, 'days')
      : parseLocalizedTime(date, endTime, timeZone);
  return endTimeAsDate;
};

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

// Component that renders an entry in the availability plan (weekly schedule)
const PlanEntry = ({ date, entry, useFullDays, isDaily, timeZone, intl, ...rest }) => {
  const isAvailable = entry.seats > 0;
  const availabilityInfo = isAvailable ? (
    <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.available" />
  ) : (
    <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.notAvailable" />
  );

  return (
    <div className={css.planEntry} {...rest}>
      <div
        className={classNames(css.availabilityDot, {
          [css.isAvailable]: entry.seats > 0,
        })}
      />
      {useFullDays ? (
        availabilityInfo
      ) : (
        <TimeRange
          className={css.timeRange}
          startDate={parseLocalizedTime(date, entry.startTime, timeZone)}
          endDate={getEndTimeAsDate(date, entry.endTime, isDaily, timeZone)}
          dateType={useFullDays ? DATE_TYPE_DATE : DATE_TYPE_TIME}
          timeZone={timeZone}
        />
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
      <div
        className={classNames(css.availabilityDot, {
          [css.isAvailable]: exception.attributes.seats > 0,
        })}
      />
      <TimeRange
        className={css.timeRange}
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

// Component that renders all the ExceptionEntry components that allow availability (seats > 0)
const AvailableExceptionsInfo = ({
  availableExceptions,
  useFullDays,
  isDaily,
  timeZone,
  onDeleteAvailabilityException,
}) => {
  const hasAvailableExceptions = availableExceptions.length > 0;
  return hasAvailableExceptions ? (
    <>
      <Heading as="h6" rootClassName={css.exceptionsSubtitle}>
        <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.available" />
      </Heading>
      {availableExceptions.map(exception => {
        return (
          <ExceptionEntry
            key={exception.id.uuid}
            exception={exception}
            timeZone={timeZone}
            useFullDays={useFullDays}
            isDaily={isDaily}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
          />
        );
      })}
    </>
  ) : null;
};

// Component that renders all the ExceptionEntry components that blocks availability (seats === 0)
const NotAvailableExceptionsInfo = ({
  blockingExceptions,
  useFullDays,
  isDaily,
  timeZone,
  onDeleteAvailabilityException,
}) => {
  const hasBlockingExceptions = blockingExceptions.length > 0;
  return hasBlockingExceptions ? (
    <>
      <Heading as="h6" rootClassName={css.exceptionsSubtitle}>
        <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.notAvailable" />
      </Heading>
      {blockingExceptions.map(exception => {
        return (
          <ExceptionEntry
            key={exception.id.uuid}
            exception={exception}
            timeZone={timeZone}
            useFullDays={useFullDays}
            isDaily={isDaily}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
          />
        );
      })}
    </>
  ) : null;
};

// The calendar date info (related to <DateLabel>)
const CalendarDate = props => {
  const intl = useIntl();
  const {
    availabilityData,
    hasAvailability,
    isDaily,
    useFullDays,
    onDeleteAvailabilityException,
    fetchExceptionsInProgress,
    fetchExceptionsError,
    timeZone,
  } = props;
  const hasPlanEntries = availabilityData?.planEntries?.length > 0;
  const hasExceptions = availabilityData?.exceptions?.length > 0;
  const availableExceptions = availabilityData.exceptions.filter(e => e.attributes.seats > 0);
  const blockingExceptions = availabilityData.exceptions.filter(e => e.attributes.seats === 0);
  const date = parseDateFromISO8601(availabilityData?.id, timeZone);

  return (
    <div className={classNames(css.date, { [css.blockedDate]: !hasAvailability })}>
      <div className={css.info}>
        {hasPlanEntries ? (
          <div className={css.planEntries}>
            {availabilityData.planEntries.map((e, i) => {
              return (
                <PlanEntry
                  key={`entry${i}`}
                  date={date}
                  entry={e}
                  timeZone={timeZone}
                  isDaily={isDaily}
                  useFullDays={useFullDays}
                  intl={intl}
                />
              );
            })}
          </div>
        ) : null}
        {hasExceptions || fetchExceptionsError ? (
          <div className={css.exceptionsContainer}>
            <Heading
              as="h5"
              rootClassName={css.exceptionsTitle}
              title="Exceptions overwrite weekly schedule"
            >
              <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.exceptions" />
            </Heading>
            {fetchExceptionsInProgress ? (
              <IconSpinner />
            ) : fetchExceptionsError ? (
              <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.fetchExceptionsError" />
            ) : (
              <>
                <AvailableExceptionsInfo
                  availableExceptions={availableExceptions}
                  useFullDays={useFullDays}
                  isDaily={isDaily}
                  timeZone={timeZone}
                  onDeleteAvailabilityException={onDeleteAvailabilityException}
                />
                <NotAvailableExceptionsInfo
                  blockingExceptions={blockingExceptions}
                  useFullDays={useFullDays}
                  isDaily={isDaily}
                  timeZone={timeZone}
                  onDeleteAvailabilityException={onDeleteAvailabilityException}
                />
              </>
            )}
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

// WeeklyCalendar shows the weekly data (plan entries & exceptions) on selected week (on given time zone)
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
    availabilityExceptions,
    weeklyExceptionQueries,
    isDaily,
    useFullDays,
    onDeleteAvailabilityException,
    onFetchExceptions,
    params,
    firstDayOfWeek,
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

WeeklyCalendar.defaultProps = {
  rootClassName: null,
  className: null,
  headerClassName: null,
  locationSearch: null,
  availabilityExceptions: [],
  firstDayOfWeek: 0,
};

WeeklyCalendar.propTypes = {
  rootClassName: string,
  className: string,
  headerClassName: string,
  locationSearch: shape({
    d: string,
  }),
  listingId: propTypes.uuid.isRequired,
  availabilityPlan: propTypes.availabilityPlan.isRequired,
  availabilityExceptions: arrayOf(propTypes.availabilityException),
  weeklyExceptionQueries: object.isRequired,
  isDaily: bool.isRequired,
  useFullDays: bool.isRequired,
  onDeleteAvailabilityException: func.isRequired,
  onFetchExceptions: func.isRequired,
  params: object.isRequired, // path params
  firstDayOfWeek: number,
  routeConfiguration: arrayOf(propTypes.route).isRequired,
  history: shape({
    replace: func.isRequired,
  }).isRequired,
};

export default WeeklyCalendar;
