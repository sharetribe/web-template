import React, { useEffect, useRef, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dateData, setDateData] = useState({
    date: props.value || null,
    formatted: props.value ? intl.formatDate(props.value, dateFormatOptions) : '',
  });
  const element = useRef(null);

  const {
    className,
    rootClassName,
    inputClassName,
    popupClassName,
    id,
    name,
    placeholderText,
    isDayBlocked,
    onChange,
    value,
    readOnly,
    ...rest
  } = props;

  // If value has changed, update internal state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && value?.getTime() !== dateData?.date?.getTime()) {
      // If mounted, changes to value should be reflected to 'date' state
      setDateData({
        date: value,
        formatted: value ? intl.formatDate(value, dateFormatOptions) : '',
      });
    }
  }, [mounted, value]);

  const pickerId = `${id}_SingleDatePicker`;

  const classes = classNames(rootClassName || css.root, className, css.outsideClickWrapper);
  const startDateMaybe =
    dateData.date instanceof Date && !isNaN(dateData.date)
      ? { startDate: getISODateString(dateData.date) }
      : {};

  const handleChange = value => {
    const startOfDay = getStartOfDay(value);
    setDateData({ date: startOfDay, formatted: intl.formatDate(startOfDay, dateFormatOptions) });
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
      setDateData({ date: null, formatted: inputStr });
      return;
    }

    if (isValidDateString(inputStr)) {
      const d = new Date(inputStr);
      if (isDayBlocked(d)) {
        setDateData({ date: dateData.date, formatted: '' });
        return;
      } else {
        setDateData({ date: d, formatted: intl.formatDate(d, dateFormatOptions) });
        return;
      }
    }

    setDateData({ date: dateData.date, formatted: inputStr });
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
            className={classNames(css.input, { [css.inputPlaceholder]: !value })}
            placeholder={placeholderText}
            value={dateData.formatted}
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
              value={dateData.date}
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
