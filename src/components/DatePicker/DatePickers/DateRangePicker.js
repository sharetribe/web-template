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

const stringify = arr => (arr ? arr.map(v => (v ? v.getTime() : '')).join(',') : '');

export const DateRangePicker = props => {
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dateRangeData, setDateRangeData] = useState({
    dateRange: props.value || null,
    formatted: props.value
      ? props.value.map(value => intl.formatDate(value, dateFormatOptions))
      : ['', ''],
  });

  const element = useRef(null);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // If value has changed, update internal state
  useEffect(() => {
    if (mounted && stringify(value) !== stringify(dateRangeData.dateRange)) {
      // If mounted, changes to value should be reflected to 'dateRange' state
      setDateRangeData({
        dateRange: value,
        formatted: value.map(value => intl.formatDate(value, dateFormatOptions)),
      });
    }
  }, [mounted, value]);

  useEffect(() => {
    // Call onClose function if it has been passed in among props.
    if (!isOpen && props.onClose) {
      props.onClose();
    }
  }, [isOpen]);

  const id = `${formId}_DateRangePicker`;
  const classes = classNames(rootClassName || css.root, className, css.outsideClickWrapper);
  const startDateMaybe =
    Array.isArray(dateRangeData.dateRange) &&
    dateRangeData.dateRange[0] instanceof Date &&
    !isNaN(dateRangeData.dateRange[0])
      ? { startDate: getISODateString(dateRangeData.dateRange[0]) }
      : {};

  const handleChange = value => {
    if (!Array.isArray(value)) {
      return;
    }

    const cleanedValues = value.map(d => getStartOfDay(d));

    if (cleanedValues.length === 1) {
      setDateRangeData({
        dateRange: cleanedValues,
        formatted: [intl.formatDate(cleanedValues[0], dateFormatOptions), ''],
      });

      if (onChange) {
        onChange(cleanedValues);
      }
    } else if (cleanedValues.length === 2) {
      setDateRangeData({
        dateRange: cleanedValues,
        formatted: cleanedValues.map(value => intl.formatDate(value, dateFormatOptions)),
      });

      setIsOpen(false);

      if (element.current) {
        const el =
          element.current.querySelector(`#${endDateId}`) || document.getElementById(endDateId);
        el.focus();
      }

      if (onChange) {
        onChange(cleanedValues);
      }
    } else {
      // This should not be reached, unless the range is empty.
      setDateRangeData({
        dateRange: cleanedValues,
        formatted: cleanedValues.map(value => intl.formatDate(value, dateFormatOptions)),
      });
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
        inputType === INPUT_START && dateRangeData.formatted[1] && dateRangeData.dateRange[1]
          ? [dateRangeData.dateRange[1]]
          : inputType !== INPUT_START && dateRangeData.formatted[0] && dateRangeData.dateRange[0]
          ? [dateRangeData.dateRange[0]]
          : [];
      setDateRangeData({
        dateRange: newDateRange,
        formatted: getUpdatedRange(inputStr, dateRangeData.formatted),
      });

      if (onChange) {
        const newFormattedValues = getUpdatedRange(null, dateRangeData.formatted);
        const boundaryMaybe = newDateRange[0];
        const valuesForParent = newFormattedValues.map(v =>
          v && boundaryMaybe ? boundaryMaybe : null
        );
        onChange(valuesForParent);
      }
      return;
    } else if (isValidDateString(inputStr)) {
      const d = new Date(inputStr);
      const updatedRange = getUpdatedRange(d, dateRangeData.dateRange);
      if (updatedRange?.[0] && updatedRange?.[1]) {
        if (isBlockedBetween(updatedRange)) {
          // Delete end date
          setDateRangeData({
            dateRange: [updatedRange[0]],
            formatted: [intl.formatDate(updatedRange[0], dateFormatOptions), ''],
          });

          return;
        } else {
          handleChange(updatedRange.sort((d1, d2) => d1 - d2));
          return;
        }
      } else if (updatedRange?.[0] || updatedRange?.[1]) {
        // If only 1 date has been selected, create array with 1 item
        handleChange([updatedRange?.[0] || updatedRange?.[1]]);
        return;
      }
    }

    // If code execution ends up here, then the dateRange is empty or malformed
    setDateRangeData({
      dateRange: dateRangeData.dateRange,
      formatted: getUpdatedRange(inputStr, dateRangeData.formatted),
    });
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
  const inputClasses = classNames(css.input, inputClassName, {
    [css.inputPlaceholder]: !value || value.length === 0,
  });

  return (
    <OutsideClickHandler className={classes} onOutsideClick={handleBlur}>
      <div id={id} className={css.picker} onKeyDown={handleKeyDown} ref={element}>
        <div className={classNames(css.inputWrapper, { [css.open]: isOpen })} onClick={toggleOpen}>
          <div className={css.inputs}>
            <input
              id={startDateId}
              className={inputClasses}
              placeholder={startDatePlaceholderText}
              value={dateRangeData.formatted[0] || ''}
              data-type={INPUT_START}
              {...inputProps}
            />
            <input
              id={endDateId}
              className={inputClasses}
              placeholder={endDatePlaceholderText}
              value={dateRangeData.formatted[1] || ''}
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
              value={dateRangeData.dateRange}
              rangeStartHasValue={dateRangeData.formatted?.[0]?.length > 0}
              rangeEndHasValue={dateRangeData.formatted?.[1]?.length > 0}
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
