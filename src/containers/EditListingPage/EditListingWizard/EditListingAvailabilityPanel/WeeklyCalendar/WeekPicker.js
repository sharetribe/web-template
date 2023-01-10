import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import {
  FieldDateRangeController,
  Form,
  InlineTextButton,
  OutsideClickHandler,
} from '../../../../../components';

import css from './WeekPicker.module.css';
import { initialVisibleMonth } from '../../../../../util/dates';

const KEY_CODE_ESCAPE = 27;

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
