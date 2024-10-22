import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { OutsideClickHandler } from '../../../components';

import { getISODateString, getStartOfDay, isValidDateString } from './DatePicker.helpers';
import DatePicker from './DatePicker';

import css from './SingleDatepicker.module.css';

const dateFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export const SingleDatePicker = props => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(props.value || null);
  const [rawValue, setRawValue] = useState(
    props.value ? intl.formatDate(props.value, dateFormatOptions) : ''
  );
  const element = useRef(null);
  const {
    className,
    rootClassName,
    inputClassName,
    popupClassName,
    id,
    placeholderText,
    isDayBlocked,
    onChange,
    value,
    readOnly,
    ...rest
  } = props;
  const pickerId = `${id}_SingleDatePicker`;

  const classes = classNames(rootClassName || css.root, className, css.outsideClickWrapper);
  const startDateMaybe =
    date instanceof Date && !isNaN(date) ? { startDate: getISODateString(date) } : {};

  const handleChange = value => {
    const startOfDay = getStartOfDay(value);
    setDate(startOfDay);
    setRawValue(intl.formatDate(startOfDay, dateFormatOptions));
    setIsOpen(false);

    if (element.current) {
      element.current.querySelector('input').focus();
    }

    if (onChange) {
      onChange(startOfDay);
    }
  };

  const handleOnChangeOnInput = e => {
    const inputStr = e.target.value;
    if (!inputStr) {
      setDate(null);
    }

    const d = new Date(inputStr);
    if (d instanceof Date && !isNaN(d)) {
      handleChange(d);
    }

    if (isValidDateString(inputStr)) {
      const d = new Date(inputStr);
      if (isDayBlocked(d)) {
        setRawValues('');
        handleChange(d);
        return;
      }
    }

    setRawValue(inputStr);
  };

  const handleBlur = () => {
    setIsOpen(false);
  };

  const handleKeyDown = e => {
    // Gather all escape presses to close menu
    if (e.key === 'Escape') {
      toggleOpen(false);
    }
  };
  const handleOnKeyDownOnInput = e => {
    // Gather all escape presses to close menu
    if (e.key === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      toggleOpen();
    }
  };

  const toggleOpen = enforcedState => {
    if (enforcedState) {
      setIsOpen(enforcedState);
    } else {
      setIsOpen(prevState => !prevState);
    }
  };

  const inputProps = {
    type: 'text',
    onChange: handleOnChangeOnInput,
    onKeyDown: handleOnKeyDownOnInput,
    ...(readOnly ? { readOnly } : {}),
  };

  return (
    <OutsideClickHandler className={classes} onOutsideClick={handleBlur}>
      <div id={pickerId} onKeyDown={handleKeyDown} ref={element}>
        <div
          className={classNames(css.inputWrapper, {
            [css.open]: isOpen,
            [inputClassName]: inputClassName,
          })}
          onClick={toggleOpen}
        >
          <input
            id={id}
            className={css.input}
            placeholder={placeholderText}
            value={rawValue}
            {...inputProps}
          />
        </div>

        <div className={popupClassName || css.popup}>
          {isOpen ? (
            <DatePicker
              range={false}
              showMonthStepper={true}
              onChange={handleChange}
              isDayBlocked={isDayBlocked}
              value={date}
              {...startDateMaybe}
              {...rest}
            />
          ) : null}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default SingleDatePicker;
