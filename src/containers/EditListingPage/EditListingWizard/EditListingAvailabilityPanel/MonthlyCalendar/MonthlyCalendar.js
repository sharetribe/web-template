import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, getDate, addMonths, subMonths } from 'date-fns';

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
  getStartOf,
  parseDateFromISO8601,
  stringifyDateToISO8601,
  isSameDate,
} from '../../../../../util/dates';
import { availabilityPerDate } from '../../../../../util/generators';
import { DATE_TYPE_DATE, DATE_TYPE_TIME } from '../../../../../util/types';

import css from './MonthlyCalendar.module.css';

const TODAY = new Date();

// This is the order of days as JavaScript understands them
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Component that renders a single day in the monthly calendar
const CalendarDay = ({
  date,
  availabilityData,
  hasAvailability,
  isDaily,
  useFullDays,
  useMultipleSeats,
  onDeleteAvailabilityException,
  timeZone,
  intl,
  isCurrentMonth,
  isToday: isTodayDate,
}) => {
  const hasPlanEntries = availabilityData?.planEntries?.length > 0;
  const hasExceptions = availabilityData?.exceptions?.length > 0;

  const dayClasses = classNames(css.calendarDay, {
    [css.otherMonth]: !isCurrentMonth,
    [css.today]: isTodayDate,
    [css.hasAvailability]: hasAvailability,
    [css.noAvailability]: !hasAvailability,
  });

  return (
    <div className={dayClasses}>
      <div className={css.dayNumber}>{getDate(date)}</div>
      {hasPlanEntries || hasExceptions ? (
        <div className={css.dayEntries}>
          {availabilityData.ranges.map((r, i) => {
            const seats = r.seats;
            const isAvailable = r.seats > 0;
            const setBy = r.exception ? 'exception' : 'plan';
            const startOfDay = getStartOf(r.start, 'day', timeZone);
            const startOfNextDay = getStartOf(r.start, 'day', timeZone, 1, 'days');
            const startsAtTheStartOfDay = isSameDate(r.start, startOfDay);
            const endsAtTheEndOfDay = isSameDate(r.end, startOfNextDay);
            const isFullDay = startsAtTheStartOfDay && endsAtTheEndOfDay;

            if (!isAvailable && !isFullDay && setBy === 'plan') {
              return null;
            }

            return (
              <div key={`entry${i}`} className={css.dayEntry}>
                <div
                  className={classNames(css.availabilityDot, {
                    [css.isAvailable]: isAvailable,
                  })}
                />
                <div className={css.daySchedule}>
                  <div className={css.entryRange}>
                    {useFullDays ? (
                      <FormattedMessage
                        id={
                          isAvailable
                            ? 'EditListingAvailabilityPanel.WeeklyCalendar.available'
                            : 'EditListingAvailabilityPanel.WeeklyCalendar.notAvailable'
                        }
                      />
                    ) : (
                      isFullDay ? (
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
                          startDate={r.start}
                          endDate={r.end}
                          dateType={useFullDays ? DATE_TYPE_DATE : DATE_TYPE_TIME}
                          timeZone={timeZone}
                        />
                      )
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
                        values={{ seats }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
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
    </div>
  );
};

const MonthlyCalendar = props => {
  const {
    className,
    rootClassName,
    headerClassName,
    listingId,
    availabilityPlan,
    availabilityExceptions = [],
    weeklyExceptionQueries,
    isDaily,
    useFullDays,
    useMultipleSeats,
    onDeleteAvailabilityException,
    onFetchExceptions,
    params,
    locationSearch,
    firstDayOfWeek,
    routeConfiguration,
    history,
    timeZone,
  } = props;

  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);
  const headerClasses = classNames(css.header, headerClassName);

  // State for current month
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get all days in the month including padding days from previous/next month
  const allDays = eachDayOfInterval({
    start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - getDay(monthStart)),
    end: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 7 - getDay(monthEnd)),
  });

  // Generate availability data for the month
  const availableDates = availabilityPerDate(
    availabilityPlan,
    availabilityExceptions,
    allDays.map(date => stringifyDateToISO8601(date)),
    timeZone
  );

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get weekdays in the correct order
  const weekdays = firstDayOfWeek === 0 
    ? WEEKDAYS 
    : [...WEEKDAYS.slice(firstDayOfWeek), ...WEEKDAYS.slice(0, firstDayOfWeek)];

  return (
    <section className={classes}>
      <header className={headerClasses}>
        <div className={css.titleWrapper}>
          <Heading as="h2" className={css.sectionTitle}>
            <FormattedMessage id="EditListingAvailabilityPanel.MonthlyCalendar.scheduleTitle" />
          </Heading>
        </div>
        <div className={css.navigation}>
          <button
            className={css.navButton}
            onClick={goToPreviousMonth}
            type="button"
          >
            <IconArrowHead size="small" direction="left" />
          </button>
          <div className={css.monthDisplay}>
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button
            className={css.navButton}
            onClick={goToNextMonth}
            type="button"
          >
            <IconArrowHead size="small" direction="right" />
          </button>
        </div>
      </header>

      <div className={css.calendarGrid}>
        {/* Weekday headers */}
        <div className={css.weekdayHeaders}>
          {weekdays.map(weekday => (
            <div key={weekday} className={css.weekdayHeader}>
              <FormattedMessage id={`EditListingAvailabilityPanel.MonthlyCalendar.${weekday}`} />
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className={css.calendarDays}>
          {allDays.map((date, index) => {
            const dateId = stringifyDateToISO8601(date);
            const availabilityData = availableDates[dateId];
            const hasAvailability = availabilityData?.hasAvailability;
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isTodayDate = isToday(date);

            return (
              <CalendarDay
                key={dateId}
                date={date}
                availabilityData={availabilityData}
                hasAvailability={hasAvailability}
                isDaily={isDaily}
                useFullDays={useFullDays}
                useMultipleSeats={useMultipleSeats}
                onDeleteAvailabilityException={onDeleteAvailabilityException}
                timeZone={timeZone}
                intl={intl}
                isCurrentMonth={isCurrentMonth}
                isToday={isTodayDate}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MonthlyCalendar; 