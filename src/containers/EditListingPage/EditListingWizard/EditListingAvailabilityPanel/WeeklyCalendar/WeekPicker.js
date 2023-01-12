import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { getStartOf, initialVisibleMonth } from '../../../../../util/dates';
import {
  endOfAvailabilityExceptionRange,
  getStartOfNextMonth,
  getStartOfPrevMonth,
} from '../availability.helpers';

import {
  FieldDateRangeController,
  Form,
  InlineTextButton,
  OutsideClickHandler,
} from '../../../../../components';

import Next from '../NextArrow';
import Prev from '../PrevArrow';

import css from './WeekPicker.module.css';

const KEY_CODE_ESCAPE = 27;
const TODAY = new Date();

const PickerForm = props => {
  return (
    <FinalForm
      {...props}
      onSubmit={() => null}
      render={formRenderProps => {
        const { handleSubmit, children } = formRenderProps;

        return (
          <Form onSubmit={handleSubmit} tabIndex="0">
            <div>{children}</div>
          </Form>
        );
      }}
    />
  );
};

const handleKeyDown = setIsOpen => e => {
  // Gather all escape presses to close menu
  if (e.keyCode === KEY_CODE_ESCAPE) {
    setIsOpen(false);
  }
};

const WeekPicker = props => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(initialVisibleMonth(props.date, props.timeZone));

  const {
    rootClassName,
    className,
    label,
    date,
    onDateChange,
    timeZone,
    initialValues,
    ...rest
  } = props;
  const onMonthClick = startOfMonth => {
    setCurrentMonth(startOfMonth);
  };
  const classes = classNames(rootClassName || css.root, className);
  const popupClasses = classNames(css.popup, { [css.isOpen]: isOpen });

  return (
    <OutsideClickHandler onOutsideClick={() => setIsOpen(false)}>
      <div className={classes} onKeyDown={handleKeyDown(setIsOpen)}>
        <InlineTextButton className={css.label} onClick={() => setIsOpen(prevState => !prevState)}>
          {label}
        </InlineTextButton>
        <div className={popupClasses}>
          {isOpen ? (
            <PickerForm initialValues={initialValues}>
              <FieldDateRangeController
                name="dates"
                minimumNights={6}
                onChange={({ startDate, endDate }) => {
                  onDateChange(startDate);
                  setIsOpen(false);
                }}
                initialVisibleMonth={initialVisibleMonth(date, timeZone)}
                onPrevMonthClick={() => onMonthClick(getStartOfPrevMonth(currentMonth, timeZone))}
                onNextMonthClick={() => onMonthClick(getStartOfNextMonth(currentMonth, timeZone))}
                navNext={
                  <Next
                    showUntilDate={endOfAvailabilityExceptionRange(timeZone, TODAY)}
                    startOfNextRange={getStartOfNextMonth(currentMonth, timeZone)}
                  />
                }
                navPrev={
                  <Prev
                    showUntilDate={getStartOf(TODAY, 'month', timeZone)}
                    startOfPrevRange={getStartOfPrevMonth(currentMonth, timeZone)}
                  />
                }
                {...rest}
              />
            </PickerForm>
          ) : null}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default WeekPicker;
