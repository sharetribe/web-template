import React, { useState } from 'react';
import classNames from 'classnames';

import FieldDateRangeController from '../../../../components/DatePicker/FieldDateRangeController/FieldDateRangeController';
import { OutsideClickHandler, IconDate } from '../../../../components';

import { useIntl } from '../../../../util/reactIntl';

import css from './FilterDateRange.module.css';

/**
 * FilterDateRange displays a toggleable date range picker.
 *
 * @component
 * @param {Object} props Component properties.
 * @param {Object} props.config Marketplace configuration object
 * @param {string?} props.className e add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} The FilterDateRange component.
 */
const FilterDateRange = props => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState(null);
  const { className, rootClassName, config } = props;
  const intl = useIntl();

  const classes = classNames(rootClassName || css.root, className);

  const formatDateRange = (start, end) => {
    const formattedStart = intl.formatDate(start, { day: 'numeric', month: 'short' });
    const formattedEnd = intl.formatDate(end, { day: 'numeric', month: 'short' });
    return `${formattedStart} - ${formattedEnd}`;
  };

  const handleDateRangeChange = value => {
    if (!value) {
      setSelectedDates(null);
      return;
    }

    const { startDate, endDate } = value;
    if (startDate && endDate) {
      setSelectedDates(formatDateRange(startDate, endDate));
      setIsOpen(false);
    } else {
      setSelectedDates(null);
    }
  };

  const { dateRangeMode } = config;
  const isNightlyMode = dateRangeMode === 'night';

  // Compute the CSS class for the label with an "active" modifier if there is a selection or if the picker is open.
  const labelClasses = classNames(css.label, {
    [css.active]: selectedDates || isOpen,
  });

  return (
    <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(false)}>
      <div className={css.toggleButton} onClick={() => setIsOpen(prevState => !prevState)}>
        <IconDate />
        <span className={labelClasses}>
          {selectedDates
            ? selectedDates
            : intl.formatMessage({ id: 'SearchCTA.dateFilterPlaceholder' })}
        </span>
      </div>

      {isOpen ? (
        <FieldDateRangeController
          onChange={handleDateRangeChange}
          showClearButton
          className={css.datePicker}
          name="dateRange"
          minimumNights={isNightlyMode ? 1 : 0}
        />
      ) : null}
    </OutsideClickHandler>
  );
};
export default FilterDateRange;
