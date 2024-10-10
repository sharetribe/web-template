/**
 * This module is loosely based on wc-datepicker v0.5.3
 * https://github.com/Sqrrl/wc-datepicker
 *
 * @license
 * MIT License
 *
 * Copyright (c) 2022
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext.js';

import {
  addDays,
  getCalendarRows,
  getFirstOfMonth,
  getISODateString,
  getLastOfMonth,
  getLocalDateFromISOString,
  getLocalizedWeekDays,
  getNextDay,
  getNextMonth,
  getPreviousDay,
  getPreviousMonth,
  getStartOfDay,
  isDateInRange,
  isSameDay,
  subDays,
} from './DatePicker.helpers.js';

import DatePickerFooter from './DatePickerFooter';
import css from './DatePicker.module.css';
import DatePickerHeader from './DatePickerHeader.js';

const CELL_WIDTH = 38;
const SLIDE_WIDTH = CELL_WIDTH * 7;
const OUTLINE_WIDTH = 2;

const CalendarMonth = props => {
  const {
    currentDate,
    currentMonth,
    currentValue,
    firstDayOfWeek,
    range,
    rangeStartHasValue,
    rangeEndHasValue,
    disabled,
    isDayBlocked,
    onClick,
    onKeyDown,
    hasMinimumNights,
    visible,
    startDateOffset,
    endDateOffset,
    intl,
  } = props;
  const [hoveredDate, setHoveredDate] = useState(null);
  const [keyboardUsed, setKeyboardUsed] = useState(false);
  const weekdays = getLocalizedWeekDays(firstDayOfWeek, intl);
  const calendarRows = getCalendarRows(currentMonth, firstDayOfWeek);

  // TODO: currently, startDateOffset & endDateOffset are only used for
  // to highlight days around hovered date.
  // I.e. show hover-color over a current week on WeekPicker.
  const isInsideOffsets = day => {
    const startOffset = startDateOffset ? startDateOffset(hoveredDate) : null;
    const endOffset = endDateOffset ? endDateOffset(hoveredDate) : null;
    if (startOffset && endOffset) {
      return isDateInRange(day, { from: startOffset, to: endOffset });
    }
    return false;
  };

  const handleKeyDown = event => {
    if (!keyboardUsed) {
      setKeyboardUsed(true);
    }
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  const onMouseEnter = event => {
    if (disabled) {
      return;
    }

    const date = getLocalDateFromISOString(event.target.closest('td').dataset.date);

    setHoveredDate(date);
  };

  const onMouseLeave = () => {
    setHoveredDate(null);
  };

  return (
    <div
      className={classNames(css.calendarMonth, {
        [css.visuallyHidden]: !visible,
        [css.keyboardUsed]: keyboardUsed,
      })}
    >
      <table className={css.calendarTable} onKeyDown={handleKeyDown} role="presentation">
        <thead className={css.calendarHeader}>
          <tr className={css.weekdayRow} aria-hidden="true">
            {weekdays.map(weekday => (
              <th
                abbr={weekday[1]}
                className={css.weekday}
                key={weekday[0]}
                scope="col"
                data-testid="weekday"
              >
                <span>{weekday[0]}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {calendarRows.map(calendarRow => {
            const rowKey = `row-${calendarRow[0].getMonth()}-${calendarRow[0].getDate()}`;

            return (
              <tr className={css.calendarRow} key={rowKey}>
                {calendarRow.map(day => {
                  const isCurrent = isSameDay(day, currentMonth);
                  const isOverflowing = day.getMonth() !== currentMonth.getMonth();

                  const isSelected = Array.isArray(currentValue)
                    ? isSameDay(day, currentValue[0]) || isSameDay(day, currentValue[1])
                    : isSameDay(day, currentValue);

                  const isInRange = !range
                    ? false
                    : isDateInRange(day, {
                        from: currentValue?.[0],
                        to: currentValue?.[1] || hoveredDate || currentDate,
                      });

                  const hasStartDate = !!currentValue?.[0];
                  const potentialRangeEnd = currentValue?.[1] || hoveredDate || currentDate;
                  const currentDateVisible = keyboardUsed && currentDate;
                  const hasHoveredRange = hasStartDate && hoveredDate;
                  const hasKeyboardRange = hasStartDate && currentDateVisible;
                  const orderedValues =
                    hasHoveredRange || hasKeyboardRange
                      ? [currentValue?.[0], potentialRangeEnd].sort((a, b) => a - b)
                      : !hoveredDate
                      ? [currentValue?.[0], currentValue?.[1]]
                      : [];

                  const startMissing = !rangeStartHasValue && rangeEndHasValue;
                  const startExist = !startMissing || hoveredDate || currentDateVisible;
                  const boundaryPointsToEnd = !startExist && isSameDay(orderedValues[0], day);

                  const isStart = range && startExist && isSameDay(orderedValues[0], day);
                  const isEnd = range && (isSameDay(orderedValues[1], day) || boundaryPointsToEnd);
                  const isToday = isSameDay(day, new Date());
                  const isDisabled = isDayBlocked(day);

                  const hasOneDateSelected =
                    range && Array.isArray(currentValue) && currentValue.length === 1;
                  const isDisabledMinimumNights =
                    !isCurrent &&
                    hasOneDateSelected &&
                    (currentValue[0] < hoveredDate || !hoveredDate)
                      ? currentValue[0] < day &&
                        !hasMinimumNights({ start: currentValue[0], end: day })
                      : !isCurrent && hasOneDateSelected && currentValue[0] > hoveredDate
                      ? currentValue[0] > day &&
                        !hasMinimumNights({ start: day, end: currentValue[0] })
                      : false;

                  const isoDateString = getISODateString(day);
                  const cellKey = `cell-${isoDateString}`;

                  const classes = classNames({
                    [css.date]: true,
                    [css.dateCurrent]: isCurrent,
                    [css.dateDisabled]: isDisabled || isDisabledMinimumNights,
                    [css.dateMinimumNights]: isDisabledMinimumNights,
                    [css.dateOverflowing]: isOverflowing,
                    [css.dateToday]: isToday,
                    [css.dateSelected]: isSelected,
                    [css.dateInRange]: isInRange,
                    [css.dateStart]: isStart,
                    [css.dateEnd]: isEnd,
                    [css.dateOffset]: isInsideOffsets(day),
                  });

                  const Tag = 'span';
                  const dateString = intl.formatDate(day, { day: 'numeric', month: 'long' });
                  const getMessage = id => intl.formatMessage({ id }, { date: dateString });
                  const ariaLabel =
                    !range && isSelected
                      ? getMessage('DatePicker.screenreader.selectedDate')
                      : isDisabled || isDisabledMinimumNights
                      ? getMessage('DatePicker.screenreader.blockedDate')
                      : isSelected && range && hasOneDateSelected
                      ? getMessage('DatePicker.screenreader.selectedDate')
                      : isSelected && isStart && isEnd
                      ? getMessage('DatePicker.screenreader.selectedDate')
                      : isSelected && isStart
                      ? getMessage('DatePicker.screenreader.selectedStartDate')
                      : isSelected && isEnd
                      ? getMessage('DatePicker.screenreader.selectedEndDate')
                      : range && hasOneDateSelected && day < currentValue?.[0]
                      ? getMessage('DatePicker.screenreader.chooseStartDate')
                      : range && hasOneDateSelected && day > currentValue?.[0]
                      ? getMessage('DatePicker.screenreader.chooseEndDate')
                      : getMessage('DatePicker.screenreader.chooseDate');

                  return (
                    <td
                      aria-disabled={String(isDisabled)}
                      aria-selected={isSelected ? 'true' : undefined}
                      aria-label={ariaLabel}
                      className={classes}
                      data-date={isoDateString}
                      key={cellKey}
                      onClick={onClick}
                      onMouseEnter={onMouseEnter}
                      onMouseLeave={onMouseLeave}
                      role="button"
                      tabIndex={isSameDay(day, currentDate) && !disabled ? 0 : -1}
                    >
                      <Tag className={css.renderedDay}>{day.getDate()}</Tag>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const isDate = d => d instanceof Date && !isNaN(d);
const isDateArray = a => Array.isArray(a) && a.every(d => isDate(d));
const isDateRangeChanged = (arr1, arr2) => {
  const differentLength = arr1.length !== arr2.length;
  return differentLength || arr1.filter((d, i) => d === arr2[i]).length !== arr1.length;
};

const DatePicker = props => {
  const intl = props.intl || useIntl();
  const config = useConfiguration();
  const defaultFirstDayOfWeek = config.localization.firstDayOfWeek;
  const {
    disabled = false,
    firstDayOfWeek = defaultFirstDayOfWeek,
    minimumNights = 0,
    range,
    rangeStartHasValue,
    rangeEndHasValue,
    theme = 'default',
    showClearButton = false,
    showMonthStepper = true,
    showPreviousMonthStepper = true,
    showNextMonthStepper = true,
    showTodayButton = false,
    startDate = getISODateString(new Date()),
    startDateOffset, // () => false,
    endDateOffset, // () => false,
    value,
    onChange,
    onMonthChange,
    isDayBlocked = () => false,
    isBlockedBetween = () => false,
  } = props;

  const pickerRef = useRef(null);

  const getInitialStartDate = startDate =>
    startDate ? getLocalDateFromISOString(startDate) : getStartOfDay(new Date());
  const [currentDate, setCurrentDate] = useState(getInitialStartDate(startDate));
  const [currentValue, setCurrentValue] = useState(value);
  const [calendarIndex, setCalendarIndex] = useState(0);
  const [allowSlide, setAllowSlide] = useState(true);

  useEffect(() => {
    if (!range && (isDate(value) || value == null) && value !== currentValue) {
      if (isDate(value)) {
        setCurrentDate(value);
      } else {
        focusDate(currentDate);
      }
      // Update single date
      setCurrentValue(value);
    } else if (
      range &&
      isDateArray(value) &&
      (value.length > 0 && isDateRangeChanged(value, currentValue))
    ) {
      if (isDate(value[0])) {
        setCurrentDate(value[0]);
      } else {
        focusDate(currentDate);
      }
      // Update date range when range it exists and has been changed
      setCurrentValue(value);
    } else if (range && isDateArray(value) && value.length === 0 && currentValue.length > 0) {
      // Update date range when range is set to empty
      setCurrentValue(value);
    }
  }, [value]);

  useEffect(() => {
    focusDate(currentDate);
  }, [currentDate]);

  const onCurrentValueChange = value => {
    setCurrentValue(value);

    if (onChange) {
      onChange(value);
    }
  };

  const focusDate = date => {
    const el = pickerRef.current;
    if (el) {
      const matches = el.querySelectorAll(`[data-date="${getISODateString(date)}"]`);
      for (const entry of matches.entries()) {
        if (entry[1].classList.contains(css.dateCurrent)) {
          entry[1].focus();
          break;
        }
      }
    }
  };

  const updateCurrentDate = date => {
    const year = date.getFullYear();

    if (year > 9999 || year < 0) {
      return;
    }

    // TODO Do we need month transition?
    const monthChanged =
      date.getMonth() !== currentDate.getMonth() || year !== currentDate.getFullYear();
    if (monthChanged && onMonthChange) {
      onMonthChange(getFirstOfMonth(date));
    }

    setCurrentDate(date);
  };

  const hasStartAndEnd = value => value.length === 2;
  const hasMinimumNights = ({ start, end }) =>
    Math.abs(start?.getTime() - end?.getTime()) >= minimumNights * 864e5;

  const onSelectDate = date => {
    if (isDayBlocked(date)) {
      return;
    }

    // Date range:
    if (range) {
      const newValue =
        currentValue?.[0] == null || hasStartAndEnd(currentValue)
          ? [date]
          : [currentValue[0], date];

      // If range is in wrong order, reverse it
      if (hasStartAndEnd(newValue) && newValue[0] > newValue[1]) {
        newValue.reverse();
      }

      // If minimumNights requirement is not fulfilled, don't allow date to be selected
      if (hasStartAndEnd(newValue) && !hasMinimumNights({ start: newValue[0], end: newValue[1] })) {
        return;
      }

      // If there's a range with blocked day inside, discard the range
      // and select the new date for starting point for the new range
      if (newValue[0] && newValue[1] && isBlockedBetween(newValue)) {
        onCurrentValueChange([date]);
        return;
      }

      onCurrentValueChange(newValue);
    } else {
      // Don't allow selecting the same day.
      // This relies on assumption that date points to the same time of day. (00:00)
      if (isSameDay(currentValue, date)) {
        return;
      }

      onCurrentValueChange(date);
    }
  };

  const nextMonth = () => {
    slide(1);
  };

  const previousMonth = () => {
    slide(-1);
  };

  const onShowToday = () => {
    updateCurrentDate(new Date());
  };

  const onClear = () => {
    onCurrentValueChange(null);
  };

  const onClick = event => {
    if (disabled) {
      return;
    }

    const target = event.target.closest('[data-date]');

    if (!Boolean(target)) {
      return;
    }

    const date = getLocalDateFromISOString(target.dataset.date);

    updateCurrentDate(date);
    onSelectDate(date);
  };

  const onKeyDown = event => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      updateCurrentDate(getPreviousDay(currentDate));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      updateCurrentDate(getNextDay(currentDate));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      updateCurrentDate(subDays(currentDate, 7));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      updateCurrentDate(addDays(currentDate, 7));
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      updateCurrentDate(getPreviousMonth(currentDate));
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      updateCurrentDate(getNextMonth(currentDate));
    } else if (event.key === 'Home') {
      event.preventDefault();
      updateCurrentDate(getFirstOfMonth(currentDate));
    } else if (event.key === 'End') {
      event.preventDefault();
      updateCurrentDate(getLastOfMonth(currentDate));
    } else if (event.key === 'Space' || event.key === 'Enter') {
      event.preventDefault();
      onSelectDate(currentDate);
    }
  };

  // Transition used to slide next/prev month in
  // Currently, only used with nextMonth & previousMonth buttons
  const slide = direction => {
    const calendarsPanel = pickerRef?.current?.querySelector('#calendars');
    if (!calendarsPanel) {
      return;
    }
    calendarsPanel.classList.add(css.slide);
    const posInitial = -1 * SLIDE_WIDTH + OUTLINE_WIDTH;

    if (allowSlide) {
      if (direction == 1) {
        calendarsPanel.style.transform = `translateX(${posInitial - SLIDE_WIDTH}px)`;
        setCalendarIndex(prevIndex => ++prevIndex);
      } else if (direction == -1) {
        calendarsPanel.style.transform = `translateX(${posInitial + SLIDE_WIDTH}px)`;
        setCalendarIndex(prevIndex => --prevIndex);
      }
    }

    setAllowSlide(false);
  };

  // When the transition ends, we need to update current date.
  // That re-renders the component with new calendar panels.
  // Then we need to reselect the correct month (the one in the middle)
  // And lastly, we allow new slides to happen
  const handleTransitionEnd = () => {
    const calendarsPanel = pickerRef?.current?.querySelector('#calendars');
    if (!calendarsPanel) {
      return;
    }
    calendarsPanel.classList.remove(css.slide);

    calendarsPanel.style.transform = `translateX(${-(1 * SLIDE_WIDTH - OUTLINE_WIDTH)}px)`;

    if (calendarIndex == -1) {
      updateCurrentDate(getPreviousMonth(currentDate));
    } else if (calendarIndex == 1) {
      updateCurrentDate(getNextMonth(currentDate));
    }
    setCalendarIndex(0);
    setAllowSlide(true);
  };

  // Calculate height of calendar grid for transition effect
  // Note 1: we assume that cells are square
  // Note 2: Stylesheet needs to be changed too if cells are resized
  const rows = getCalendarRows(currentDate, firstDayOfWeek);
  const extraHeight = 52; // weekday row + some extra
  const height = rows ? `${rows.length * CELL_WIDTH + extraHeight}px` : '242px';

  const commonMonthProps = {
    currentDate,
    currentValue,
    firstDayOfWeek,
    disabled,
    isDayBlocked,
    range,
    hasMinimumNights,
    onClick,
    onKeyDown,
    rangeStartHasValue,
    rangeEndHasValue,
    intl,
  };

  return (
    <div
      aria-disabled={String(disabled)}
      aria-label="Calendar"
      aria-roledescription="datepicker"
      className={classNames(css.root, {
        [css.light]: theme === 'light',
        [css.disabled]: disabled,
      })}
      role="application"
    >
      <div className={css.datepicker} ref={pickerRef}>
        <DatePickerHeader
          monthClassName={allowSlide ? null : css.monthSlideEffect}
          currentDate={currentDate}
          showMonthStepper={showMonthStepper}
          showPreviousMonthStepper={showPreviousMonthStepper}
          showNextMonthStepper={showNextMonthStepper}
          nextMonth={nextMonth}
          previousMonth={previousMonth}
          disabled={disabled}
          intl={intl}
        />

        <div className={css.body} style={{ height }}>
          <div className={css.calendarViewport}>
            <div id="calendars" className={css.calendars} onTransitionEnd={handleTransitionEnd}>
              <CalendarMonth
                currentMonth={getPreviousMonth(currentDate)}
                visible={!allowSlide}
                {...commonMonthProps}
              />
              <CalendarMonth
                currentMonth={currentDate}
                visible={true}
                startDateOffset={startDateOffset}
                endDateOffset={endDateOffset}
                {...commonMonthProps}
              />
              <CalendarMonth
                currentMonth={getNextMonth(currentDate)}
                visible={!allowSlide}
                {...commonMonthProps}
              />
            </div>
          </div>
        </div>

        <DatePickerFooter
          showFooter={showTodayButton || showClearButton}
          showTodayButton={showTodayButton}
          showClearButton={showClearButton}
          disabled={disabled}
          onShowToday={onShowToday}
          onClear={onClear}
        />
      </div>
    </div>
  );
};

export default DatePicker;
