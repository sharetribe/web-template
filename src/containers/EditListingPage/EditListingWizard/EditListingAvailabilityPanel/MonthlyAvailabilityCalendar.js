import React, { useState, useEffect } from 'react';
import {
  getStartOf,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
} from '../../../../util/dates';
import { endOfAvailabilityExceptionRange } from './availability.helpers';

import css from './MonthlyAvailabilityCalendar.module.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_STAY_DAYS = 30;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

const sod = d => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const diffDays = (a, b) => Math.round((sod(b) - sod(a)) / 86400000);

const inRange = (d, s, e) => d >= s && d <= e;

const rangesOverlap = (s1, e1, s2, e2) => s1 <= e2 && e1 >= s2;

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Monday = 0 offset for the first cell
const firstDayOffset = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;

const formatDate = d =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Convert Sharetribe allExceptions → internal ranges ──────────────────────

// Converts UTC timestamps from the API to local-midnight Dates for the calendar grid,
// using the listing's timezone so the displayed dates are correct regardless of browser tz.
const exceptionsToRanges = (allExceptions, timeZone) =>
  allExceptions
    .filter(e => e.attributes.seats > 0)
    .map(e => ({
      start: sod(timeOfDayFromTimeZoneToLocal(e.attributes.start, timeZone)),
      // end is exclusive in Sharetribe — subtract 1ms to land on the last inclusive day
      end: sod(timeOfDayFromTimeZoneToLocal(new Date(e.attributes.end.getTime() - 1), timeZone)),
      exceptionId: e.id,
    }));

// ─── MonthGrid ────────────────────────────────────────────────────────────────

const MonthGrid = ({ year, month, today, getDayClass, onDayClick, onDayHover }) => {
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);

  return (
    <div className={css.monthGrid}>
      <div className={css.monthTitle}>
        {MONTH_NAMES[month]} {year}
      </div>
      <div className={css.dayLabels}>
        {DAY_LABELS.map(l => (
          <div key={l} className={css.dayLabel}>{l}</div>
        ))}
      </div>
      <div className={css.dayCells}>
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = sod(new Date(year, month, i + 1));
          const isPast = day < today;
          const cls = getDayClass(day);
          const isToday = sameDay(day, today);

          return (
            <div
              key={i}
              className={[
                css.dayCell,
                isPast ? css.past : '',
                cls ? css[cls] : '',
                isToday && !cls ? css.todayMarker : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !isPast && onDayClick(day)}
              onMouseEnter={() => !isPast && onDayHover(day)}
              onMouseLeave={() => onDayHover(null)}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * MonthlyAvailabilityCalendar
 *
 * Replaces the WeeklyCalendar + ExceptionForm in EditListingAvailabilityPanel.
 * Hosts click start/end dates to define availability windows (min 30 days each).
 * Each window is saved as an AvailabilityException with seats: 1.
 *
 * @param {Object}   props
 * @param {Array}    props.allExceptions   - from Redux: array of Sharetribe AvailabilityException entities
 * @param {Function} props.onAddAvailabilityException    - Redux thunk: ({ listingId, seats, start, end }) => Promise
 * @param {Function} props.onDeleteAvailabilityException - Redux thunk: ({ id }) => Promise
 * @param {Object}   props.listing         - Sharetribe listing entity
 * @param {boolean}  props.updateInProgress
 * @param {Object}   props.errors
 */
const MonthlyAvailabilityCalendar = props => {
  const {
    allExceptions = [],
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onFetchExceptions,
    listing,
    timeZone,
    updateInProgress,
    errors,
  } = props;

  // Fetch all future exceptions when the component mounts so the calendar
  // displays correctly even after a page refresh or a fresh navigation.
  useEffect(() => {
    if (listing?.id && onFetchExceptions && timeZone) {
      const start = getStartOf(new Date(), 'day', timeZone);
      const end = endOfAvailabilityExceptionRange(timeZone, new Date());
      onFetchExceptions({ listingId: listing.id, start, end, timeZone });
    }
  }, [listing?.id]);

  const today = sod(new Date());

  // View state — which two months to show
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Selection state
  const [selectingStart, setSelectingStart] = useState(null); // Date | null
  const [hovered, setHovered] = useState(null);               // Date | null
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Derive ranges from Sharetribe exceptions every render
  const ranges = exceptionsToRanges(allExceptions, timeZone);

  // Second visible month
  const month2Year = viewMonth === 11 ? viewYear + 1 : viewYear;
  const month2Month = viewMonth === 11 ? 0 : viewMonth + 1;

  // Navigation
  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Which CSS class does a day get?
  const getDayClass = day => {
    // Check committed ranges
    for (const r of ranges) {
      if (inRange(day, r.start, r.end)) {
        if (sameDay(day, r.start) && sameDay(day, r.end)) return 'rangeSolo';
        if (sameDay(day, r.start)) return 'rangeStart';
        if (sameDay(day, r.end)) return 'rangeEnd';
        return 'rangeMid';
      }
    }
    // Check in-progress selection preview
    if (selectingStart) {
      const previewEnd = hovered || selectingStart;
      const [s, e] = selectingStart <= previewEnd ? [selectingStart, previewEnd] : [previewEnd, selectingStart];
      if (inRange(day, s, e)) {
        if (sameDay(day, s) && sameDay(day, e)) return 'selectingStart';
        if (sameDay(day, s)) return 'selectingStart';
        if (sameDay(day, e)) return 'selectingEnd';
        return 'selectingMid';
      }
    }
    return null;
  };

  // Save a new range as a Sharetribe availability exception
  const saveRange = async (start, end) => {
    setSaving(true);
    setError(null);
    try {
      // Convert local-midnight dates to listing-timezone midnight so the API
      // timestamps align with the plan's timezone boundaries (Africa/Nairobi).
      const tzStart = getStartOf(timeOfDayFromLocalToTimeZone(start, timeZone), 'day', timeZone);
      const tzExclusiveEnd = getStartOf(
        timeOfDayFromLocalToTimeZone(end, timeZone),
        'day',
        timeZone,
        1,
        'days'
      );
      await onAddAvailabilityException({
        listingId: listing.id,
        seats: 1,
        start: tzStart,
        end: tzExclusiveEnd,
      });
    } catch (e) {
      console.log('saveRange error:', e);
      setError('Failed to save availability window. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete the exception whose range contains this day
  const deleteRangeContaining = async day => {
    const range = ranges.find(r => inRange(day, r.start, r.end));
    if (!range || !range.exceptionId) return;
    setSaving(true);
    setError(null);
    try {
      await onDeleteAvailabilityException({ id: range.exceptionId });
    } catch (e) {
      setError('Failed to remove availability window. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Day click handler
  const handleDayClick = day => {
    setError(null);

    // Clicking inside an existing range removes it
    const existingRange = ranges.find(r => inRange(day, r.start, r.end));
    if (existingRange) {
      deleteRangeContaining(day);
      return;
    }

    if (!selectingStart) {
      // First click — set start
      setSelectingStart(day);
    } else {
      // Second click — validate and save
      const [s, e] = selectingStart <= day ? [selectingStart, day] : [day, selectingStart];
      const days = diffDays(s, e) + 1;

      if (days < MIN_STAY_DAYS) {
        setError(
          `Minimum availability window is ${MIN_STAY_DAYS} days. You selected ${days} day${days !== 1 ? 's' : ''}. Please pick a longer range.`
        );
        setSelectingStart(null);
        setHovered(null);
        return;
      }

      // Check for overlap with existing ranges
      const overlaps = ranges.some(r => rangesOverlap(s, e, r.start, r.end));
      if (overlaps) {
        setError('This period overlaps with an existing availability window. Please choose a different range.');
        setSelectingStart(null);
        setHovered(null);
        return;
      }

      saveRange(s, e);
      setSelectingStart(null);
      setHovered(null);
    }
  };

  // Selection day count hint
  const selectionDays =
    selectingStart && hovered && hovered > selectingStart
      ? diffDays(selectingStart, hovered) + 1
      : null;

  return (
    <div className={css.root}>

      {/* Calendar navigation */}
      <div className={css.nav}>
        <button className={css.navBtn} onClick={goToPrevMonth} type="button">&#8592;</button>
        <span className={css.navLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear} &mdash; {MONTH_NAMES[month2Month]} {month2Year}
        </span>
        <button className={css.navBtn} onClick={goToNextMonth} type="button">&#8594;</button>
      </div>

      {/* Two-month grid */}
      <div className={css.calendars}>
        <MonthGrid
          year={viewYear} month={viewMonth}
          today={today}
          getDayClass={getDayClass}
          onDayClick={handleDayClick}
          onDayHover={setHovered}
        />
        <MonthGrid
          year={month2Year} month={month2Month}
          today={today}
          getDayClass={getDayClass}
          onDayClick={handleDayClick}
          onDayHover={setHovered}
        />
      </div>

      {/* Instruction / selection hint */}
      <div className={css.hint}>
        {selectingStart ? (
          <span className={css.hintSelecting}>
            Start: <strong>{formatDate(selectingStart)}</strong> — now click an end date
            (min. {MIN_STAY_DAYS} days).
            {selectionDays ? (
              <span className={selectionDays >= MIN_STAY_DAYS ? css.hintOk : css.hintWarn}>
                {' '}{selectionDays} day{selectionDays !== 1 ? 's' : ''} selected
                {selectionDays >= MIN_STAY_DAYS ? ' ✓' : ` (need ${MIN_STAY_DAYS - selectionDays} more)`}
              </span>
            ) : null}
          </span>
        ) : (
          <span className={css.hintIdle}>
            Click a start date, then an end date to add an availability window.
            Click an existing window to remove it.
          </span>
        )}
      </div>

      {/* Saving indicator */}
      {saving ? (
        <p className={css.saving}>Saving&hellip;</p>
      ) : null}

      {/* Error */}
      {error ? (
        <p className={css.error}>{error}</p>
      ) : null}

      {/* Committed windows summary */}
      {ranges.length > 0 ? (
        <div className={css.windowsList}>
          <p className={css.windowsTitle}>Availability windows ({ranges.length})</p>
          {ranges.map((r, i) => (
            <div key={r.exceptionId || i} className={css.windowItem}>
              <span className={css.windowDates}>
                {formatDate(r.start)}
                <span className={css.windowArrow}> → </span>
                {formatDate(r.end)}
                <span className={css.windowDays}> ({diffDays(r.start, r.end) + 1} days)</span>
              </span>
              <button
                type="button"
                className={css.removeBtn}
                onClick={() => deleteRangeContaining(r.start)}
                title="Remove window"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Legend */}
      <div className={css.legend}>
        <span className={css.legendItem}>
          <span className={`${css.legendSwatch} ${css.legendAvailable}`} /> Available window
        </span>
        <span className={css.legendItem}>
          <span className={`${css.legendSwatch} ${css.legendUnavailable}`} /> Unavailable
        </span>
      </div>
    </div>
  );
};

export default MonthlyAvailabilityCalendar;
