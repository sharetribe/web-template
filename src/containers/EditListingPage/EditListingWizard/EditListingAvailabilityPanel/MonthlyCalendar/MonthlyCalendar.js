import React, { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, getDate, addMonths, subMonths, isBefore, startOfDay, isAfter, addDays, min } from 'date-fns';

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

const MONTHS_TO_SHOW = 3;

// Utility function to check if a date is in the past
const isPastDate = (date) => {
  const today = startOfDay(new Date());
  const checkDate = startOfDay(date);
  return isBefore(checkDate, today);
};

const isBeyondWindow = (date, windowEnd) => {
  const checkDate = startOfDay(date);
  return isAfter(checkDate, windowEnd);
};

// Component that renders a single day in the monthly calendar
const CalendarDay = ({
  date,
  availabilityData,
  hasAvailability,
  isDaily,
  useFullDays,
  useMultipleSeats,
  onAddAvailabilityException,
  onDeleteAvailabilityException,
  timeZone,
  intl,
  isCurrentMonth,
  isToday: isTodayDate,
  windowEnd, // pass this prop from MonthlyCalendar
}) => {
  const hasPlanEntries = availabilityData?.planEntries?.length > 0;
  const hasExceptions = availabilityData?.exceptions?.length > 0;
  const isPast = isPastDate(date);
  const isFutureBlocked = isBeyondWindow(date, windowEnd);

  const dayClasses = classNames(css.calendarDay, {
    [css.otherMonth]: !isCurrentMonth,
    [css.today]: isTodayDate,
    [css.hasAvailability]: hasAvailability && !isPast && !isFutureBlocked,
    [css.noAvailability]: !hasAvailability && !isPast && !isFutureBlocked,
    [css.pastDate]: isPast || isFutureBlocked,
    [css.clickable]: !isPast && !isFutureBlocked,
  });

  // Determine if this day has an exception (unavailable)
  const hasException = (availabilityData?.exceptions || []).length > 0;

  // Click handler to toggle exception (only for non-past and non-future-blocked dates)
  const handleClick = () => {
    if (isPast || isFutureBlocked) {
      return; // Don't allow interaction with past or future-blocked dates
    }

    console.log('🧪 [DEBUG] CalendarDay clicked:', {
      date: date.toISOString(),
      hasException,
      availabilityData,
      hasAvailability,
    });

    if (hasException) {
      // Remove exception (make available)
      console.log('🧪 [DEBUG] Removing exception for date:', date.toISOString());
      if (onDeleteAvailabilityException) {
        const exception = availabilityData.exceptions[0];
        console.log('🧪 [DEBUG] Exception to delete:', exception);
        console.log('🧪 [DEBUG] Exception ID:', exception.id);
        console.log('🧪 [DEBUG] Exception type:', typeof exception.id);
        onDeleteAvailabilityException({ id: exception.id });
      }
    } else {
      // Check if adding an exception would overlap with existing exceptions
      const newStartDate = getStartOf(date, 'day', timeZone);
      const newEndDate = getStartOf(date, 'day', timeZone, 1, 'day');
      
      // Debug: Log all existing exceptions
      console.log('🧪 [DEBUG] All existing exceptions:', availabilityData?.exceptions?.map(ex => ({
        id: ex.id,
        start: ex.attributes.start.toISOString(),
        end: ex.attributes.end.toISOString(),
        seats: ex.attributes.seats
      })));
      
      // Check for overlaps with existing exceptions
      const hasOverlap = availabilityData?.exceptions?.some(exception => {
        const existingStart = new Date(exception.attributes.start);
        const existingEnd = new Date(exception.attributes.end);
        
        // Check if the new exception overlaps with this existing exception
        // Overlap occurs when: newStart < existingEnd AND newEnd > existingStart
        const overlaps = newStartDate < existingEnd && newEndDate > existingStart;
        
        console.log('🧪 [DEBUG] Checking overlap:', {
          newStart: newStartDate.toISOString(),
          newEnd: newEndDate.toISOString(),
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString(),
          overlaps,
          exceptionId: exception.id
        });
        
        return overlaps;
      });
      
      if (hasOverlap) {
        console.log('🧪 [DEBUG] Exception would overlap with existing exception, not adding.');
        alert('This date overlaps with an existing availability exception. Please remove the existing exception first or choose a different date.');
        return;
      }
      
      // Additional check: see if there are any exceptions that contain this date
      const hasContainingException = availabilityData?.exceptions?.some(exception => {
        const existingStart = new Date(exception.attributes.start);
        const existingEnd = new Date(exception.attributes.end);
        
        // Check if this date is within an existing exception
        const isContained = newStartDate >= existingStart && newStartDate < existingEnd;
        
        console.log('🧪 [DEBUG] Checking if date is contained in exception:', {
          date: newStartDate.toISOString(),
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString(),
          isContained,
          exceptionId: exception.id
        });
        
        return isContained;
      });
      
      if (hasContainingException) {
        console.log('🧪 [DEBUG] Date is already covered by an existing exception, not adding.');
        alert('This date is already covered by an existing availability exception. Please remove the existing exception first or choose a different date.');
        return;
      }
      
      // Add exception (make unavailable)
      console.log('🧪 [DEBUG] Adding exception for date:', date.toISOString());
      if (onAddAvailabilityException) {
        // Use UTC midnight for start and end (next day) to avoid timezone/DST issues
        const startDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1));
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        const exceptionParams = {
          start: startISO,
          end: endISO,
          seats: 0,
        };
        console.log('🧪 [DEBUG] Exception params (UTC fix):', exceptionParams);
        onAddAvailabilityException(exceptionParams);
      }
    }
  };

  // Render logic
  if (isFutureBlocked) {
    return (
      <div className={dayClasses} style={{ cursor: 'default' }}>
        <div className={css.dayNumber}>{getDate(date)}</div>
        <div className={css.dayEntry}>
          <div className={classNames(css.availabilityDot)} />
          <div className={css.daySchedule}>
            <div className={css.entryRange}>
              Not yet available
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dayClasses} onClick={handleClick} style={{ cursor: isPast ? 'default' : 'pointer' }}>
      <div className={css.dayNumber}>{getDate(date)}</div>
      {!isPast && (hasPlanEntries || hasExceptions) ? (
        <div className={css.dayEntries}>
          {/* If any range is set by an exception, only render exception status for the day */}
          {availabilityData.ranges.some(r => r.exception) ? (
            availabilityData.ranges
              .filter(r => r.exception)
              .map((r, i) => {
                const seats = r.seats;
                const isAvailable = r.seats > 0;
                return (
                  <div key={`entry-exception-${i}`} className={css.dayEntry}>
                    <div
                      className={classNames(css.availabilityDot, {
                        [css.isAvailable]: isAvailable,
                      })}
                    />
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
                      {seats !== 0 ? (
                        <div className={css.sourceMaybe}>
                          <FormattedMessage
                            id="EditListingAvailabilityPanel.WeeklyCalendar.exception"
                            values={{ exception: seats }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
          ) : (
            // Otherwise, render plan entries as before
            availabilityData.ranges.map((r, i) => {
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
                    {setBy === 'exception' && seats !== 0 ? (
                      <div className={css.sourceMaybe}>
                        <FormattedMessage
                          id="EditListingAvailabilityPanel.WeeklyCalendar.exception"
                          values={{ exception: seats }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : !isPast ? (
        <div className={css.dayEntry}>
          <div className={classNames(css.availabilityDot)} />
          <div className={css.daySchedule}>
            <div className={css.entryRange}>
              <FormattedMessage id="EditListingAvailabilityPanel.WeeklyCalendar.notAvailable" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const MonthlyCalendar = ({
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
  onAddAvailabilityException,
  onDeleteAvailabilityException,
  onFetchExceptions,
  params,
  locationSearch,
  firstDayOfWeek,
  routeConfiguration,
  history,
  timeZone,
}) => {
  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);
  const headerClasses = classNames(css.header, headerClassName);

  // State for current month (start at today)
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Calculate the rolling 3-month window
  const today = new Date();
  const windowStart = startOfDay(today);
  const windowEnd = addMonths(windowStart, MONTHS_TO_SHOW);
  windowEnd.setDate(windowEnd.getDate() - 1); // End is 3 months from today, inclusive

  // Debug: Log the window calculation
  console.log('🧪 [DEBUG] Window calculation:', {
    today: today.toISOString(),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    MONTHS_TO_SHOW,
  });

  // Clamp navigation: don't allow going before windowStart or after windowEnd
  const canGoToPreviousMonth = currentMonth > startOfMonth(windowStart);
  const canGoToNextMonth = startOfMonth(addMonths(currentMonth, 1)) <= startOfMonth(windowEnd);

  // Generate calendar days for the current month (but only within the 3-month window)
  const monthStart = currentMonth;
  const monthEnd = endOfMonth(currentMonth);
  
  // FIXED: Calculate the correct start date based on firstDayOfWeek
  // The original calculation assumed Sunday-first week, but we need to respect firstDayOfWeek
  const daysToSubtractFromStart = (getDay(monthStart) - firstDayOfWeek + 7) % 7;
  const calendarStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - daysToSubtractFromStart);
  
  // FIXED: Calculate the correct end date to complete the week
  const daysToAddToEnd = (7 - getDay(monthEnd) + firstDayOfWeek - 1) % 7;
  const calendarEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + daysToAddToEnd);
  
  const allDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  
  // Debug: Log the calendar grid calculation
  console.log('🧪 [DEBUG] Calendar grid calculation:', {
    monthStart: monthStart.toDateString(),
    monthEnd: monthEnd.toDateString(),
    firstDayOfWeek,
    daysToSubtractFromStart,
    daysToAddToEnd,
    calendarStart: calendarStart.toDateString(),
    calendarEnd: calendarEnd.toDateString(),
    allDaysCount: allDays.length,
    firstDay: allDays[0]?.toDateString(),
    lastDay: allDays[allDays.length - 1]?.toDateString(),
  });

  // Generate availability data for the rolling 3-month window
  const availableDates = availabilityPerDate(
    windowStart,
    addDays(windowEnd, 1), // Make end exclusive so last day is included
    availabilityPlan,
    availabilityExceptions
  );

  // Debug: Log the inputs to availabilityPerDate
  console.log('🧪 [DEBUG] MonthlyCalendar availability inputs:', {
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    availabilityPlan: availabilityPlan,
    availabilityExceptions: availabilityExceptions,
    timeZone: timeZone,
    allDaysCount: allDays.length,
  });

  // Debug: Log the generated availability data
  console.log('🧪 [DEBUG] MonthlyCalendar availability output:', {
    availableDatesKeys: Object.keys(availableDates),
    sampleDate: Object.keys(availableDates)[0],
    sampleData: availableDates[Object.keys(availableDates)[0]],
  });

  // Navigation handlers (clamped)
  const goToPreviousMonth = () => {
    if (canGoToPreviousMonth) {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoToNextMonth) {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
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
            disabled={!canGoToPreviousMonth}
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
            disabled={!canGoToNextMonth}
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
                onAddAvailabilityException={onAddAvailabilityException}
                onDeleteAvailabilityException={onDeleteAvailabilityException}
                timeZone={timeZone}
                intl={intl}
                isCurrentMonth={isCurrentMonth}
                isToday={isTodayDate}
                windowEnd={windowEnd}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MonthlyCalendar; 