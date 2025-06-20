import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../../../util/reactIntl';

import { OutsideClickHandler, IconDate, FieldDateRangeController } from '../../../../../components';

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
  const { className, rootClassName, config, alignLeft } = props;
  const intl = useIntl();

  useEffect(() => {
    if (FieldDateRangeController.preload) {
      FieldDateRangeController.preload();
    }
  }, []);

  const classes = classNames(rootClassName || css.root, className);

  const formatDateRange = (start, end) => {
    const formattedDate = intl.formatDateTimeRange(start, end, {
      day: 'numeric',
      month: 'short',
    });
    return formattedDate;
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

  const datesFilter = config.search.defaultFilters.find(f => f.key === 'dates');
  const { dateRangeMode } = datesFilter || {};
  const isNightlyMode = dateRangeMode === 'night';

  // Compute the CSS class for the label with an "active" modifier if there is a selection or if the picker is open.
  const labelClasses = classNames(css.label, {
    [css.active]: selectedDates || isOpen,
  });

  return (
    <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(false)}>
      <div
        role="button"
        className={css.toggleButton}
        onClick={() => setIsOpen(prevState => !prevState)}
        tabIndex={0}
        onKeyDown={() => setIsOpen(prevState => !prevState)}
      >
        <IconDate />
        <span className={labelClasses}>
          {selectedDates
            ? selectedDates
            : intl.formatMessage({ id: 'PageBuilder.SearchCTA.dateFilterPlaceholder' })}
        </span>
      </div>
      {isOpen ? (
        <FieldDateRangeController
          onChange={handleDateRangeChange}
          showClearButton
          className={classNames(css.datePicker, {
            [css.alignLeft]: alignLeft,
          })}
          name="dateRange"
          minimumNights={isNightlyMode ? 1 : 0}
        />
      ) : null}
    </OutsideClickHandler>
  );
};
export default FilterDateRange;
