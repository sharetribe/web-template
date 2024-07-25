import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { OutsideClickHandler } from '../..';

import DatePicker from './DatePicker';

import css from './DateRangePicker.module.css';
import { getISODateString, getStartOfDay, isValidDateString } from './DatePicker.helpers';

const INPUT_START = 'start';
const INPUT_END = 'end';

const dateFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export const DateRangePicker = props => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState(props.value || null);
  const [rawValues, setRawValues] = useState(
    props.value ? props.value.map(value => intl.formatDate(value, dateFormatOptions)) : ['', '']
  );
  const element = useRef(null);

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (!isOpen && props.onClose) {
      props.onClose();
    }
  }, [isOpen]);

  const {
    className,
    rootClassName,
    inputClassName,
    popupClassName,
    formId = '',
    startDateId,
    endDateId,
    startDatePlaceholderText = intl.formatDate(new Date(), dateFormatOptions),
    endDatePlaceholderText = intl.formatDate(new Date(), dateFormatOptions),
    isBlockedBetween,
    onChange,
    onBlur,
    onClose,
    value,
    readOnly,
    ...rest
  } = props;

  const id = `${formId}_DateRangePicker`;
  const classes = classNames(rootClassName || css.root, className, css.outsideClickWrapper);
  const startDateMaybe =
    Array.isArray(dateRange) && dateRange[0] instanceof Date && !isNaN(dateRange[0])
      ? { startDate: getISODateString(dateRange[0]) }
      : {};

  const handleChange = value => {
    if (!Array.isArray(value)) {
      return;
    }

    const cleanedValues = value.map(d => getStartOfDay(d));
    setDateRange(cleanedValues);

    if (cleanedValues.length === 1) {
      setRawValues([intl.formatDate(cleanedValues[0], dateFormatOptions), '']);
      if (onChange) {
        onChange(cleanedValues);
      }
    } else if (cleanedValues.length === 2) {
      setRawValues(cleanedValues.map(value => intl.formatDate(value, dateFormatOptions)));

      setIsOpen(false);

      if (element.current) {
        const el =
          element.current.querySelector(`#${endDateId}`) || document.getElementById(endDateId);
        el.focus();
      }

      if (onChange) {
        onChange(cleanedValues);
      }
    }
  };

  const handleOnChangeOnInput = e => {
    const input = e.target;
    const inputType = input.dataset.type;
    const inputStr = input.value;

    const getUpdatedRange = (fillIn, arr) =>
      inputType === INPUT_START ? [fillIn, arr[1]] : [arr[0], fillIn];

    if (!inputStr) {
      const newDateRange =
        inputType === INPUT_START && rawValues[1] && dateRange[1]
          ? [dateRange[1]]
          : inputType !== INPUT_START && rawValues[0] && dateRange[0]
          ? [dateRange[0]]
          : [];
      setDateRange(newDateRange);

      if (onChange) {
        const newRawValues = getUpdatedRange(null, rawValues);
        const boundaryMaybe = newDateRange[0];
        const valuesForParent = newRawValues.map(v => (v && boundaryMaybe ? boundaryMaybe : null));
        onChange(valuesForParent);
      }
    }

    if (isValidDateString(inputStr)) {
      const d = new Date(inputStr);
      const updatedRange = getUpdatedRange(d, dateRange);
      if (updatedRange?.[0] && updatedRange?.[1]) {
        if (isBlockedBetween(updatedRange)) {
          setRawValues([updatedRange[0], '']);
          handleChange([updatedRange[0]]);
          return;
        } else {
          handleChange(updatedRange);
          return;
        }
      } else if (updatedRange?.[0] || updatedRange?.[1]) {
        setRawValues([updatedRange[0], '']);
        handleChange([updatedRange?.[0] || updatedRange?.[1]]);
      }
    }

    setRawValues(getUpdatedRange(inputStr, rawValues));
  };

  const handleBlur = () => {
    if (isOpen && onBlur) {
      onBlur();
    }
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
      <div id={id} className={css.picker} onKeyDown={handleKeyDown} ref={element}>
        <div className={classNames(css.inputWrapper, { [css.open]: isOpen })} onClick={toggleOpen}>
          <div className={css.inputs}>
            <input
              id={startDateId}
              className={classNames(css.input, inputClassName)}
              placeholder={startDatePlaceholderText}
              value={rawValues[0] || ''}
              data-type={INPUT_START}
              {...inputProps}
            />
            <input
              id={endDateId}
              className={classNames(css.input, inputClassName)}
              placeholder={endDatePlaceholderText}
              value={rawValues[1] || ''}
              data-type={INPUT_END}
              {...inputProps}
            />
          </div>
        </div>

        <div className={popupClassName || css.popup}>
          {isOpen ? (
            <DatePicker
              range={true}
              showMonthStepper={true}
              onChange={handleChange}
              isBlockedBetween={isBlockedBetween}
              value={dateRange}
              rangeStartHasValue={rawValues?.[0]?.length > 0}
              rangeEndHasValue={rawValues?.[1]?.length > 0}
              {...startDateMaybe}
              {...rest}
            />
          ) : null}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default DateRangePicker;
