import React, { useState, useRef } from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../../../util/reactIntl';
import { OutsideClickHandler, IconDate, FieldDateRangeController } from '../../../../../components';

import css from './FilterDateRange.module.css';

const MIN_STAY_NIGHTS = 30;

const handleKeyDown = (isOpen, setIsOpen) => e => {
  const toggleButton = e.currentTarget.getElementsByClassName(css.toggleButton)[0];
  if ((e.target === toggleButton && e.key === 'Enter') || e.key === ' ') {
    e.preventDefault();
    setIsOpen(prevState => !prevState);
    return;
  } else if (!isOpen && e.key === 'ArrowDown') {
    e.preventDefault();
    setIsOpen(true);
    return;
  } else if (isOpen && e.key === 'Escape') {
    e.preventDefault();
    toggleButton.focus();
    setIsOpen(false);
    return;
  }
};

/**
 * FilterDateRange displays a toggleable date range picker.
 *
 * @component
 * @param {Object} props Component properties.
 * @param {Object} props.config Marketplace configuration object
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} The FilterDateRange component.
 */
const FilterDateRange = props => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef(null);
  const { className, rootClassName, config, alignLeft, initialDateLabel } = props;
  const [selectedDates, setSelectedDates] = useState(initialDateLabel || null);
  const intl = useIntl();

  const classes = classNames(rootClassName || css.root, className);

  const formatDateRange = (start, end) =>
    intl.formatDateTimeRange(start, end, { day: 'numeric', month: 'short' });

  const handleDateRangeChange = value => {
    if (!value) {
      setSelectedDates(null);
      return;
    }

    const { startDate, endDate } = value;
    if (startDate && endDate) {
      setSelectedDates(formatDateRange(startDate, endDate));
      toggleButtonRef.current?.focus();
      setIsOpen(false);
    } else {
      setSelectedDates(null);
    }
  };

  const handleClick = event => {
    const el = event.currentTarget;
    const dropdownHeight = 350;
    const toBottom = window.innerHeight - el.getBoundingClientRect().bottom;
    if (!isOpen && toBottom < dropdownHeight) {
      const topbarOffset = 72;
      const toTop = el.getBoundingClientRect().top - topbarOffset;
      const scrollDownNeed = dropdownHeight - toBottom;
      const top = toTop < scrollDownNeed ? toTop : scrollDownNeed;
      window.scrollBy({ top });
    }
    setIsOpen(prevState => !prevState);
  };

  const datesFilter = config?.search?.defaultFilters?.find(f => f.key === 'dates');
  const { dateRangeMode } = datesFilter || {};
  const isNightlyMode = dateRangeMode === 'night';

  const labelClasses = classNames(css.label, {
    [css.active]: selectedDates || isOpen,
  });

  return (
    <OutsideClickHandler
      className={classes}
      onOutsideClick={() => setIsOpen(false)}
      onKeyDown={handleKeyDown(isOpen, setIsOpen)}
    >
      <div
        role="button"
        ref={toggleButtonRef}
        className={css.toggleButton}
        onClick={handleClick}
        tabIndex={0}
        aria-controls={isOpen ? 'dateRange' : ''}
        aria-expanded={isOpen}
      >
        <IconDate rootClassName={css.iconDate} />
        <span className={labelClasses}>
          {selectedDates
            ? selectedDates
            : intl.formatMessage({ id: 'PageBuilder.SearchCTA.dateFilterPlaceholder' })}
        </span>
      </div>
      {/* Always mounted so the Final Form field stays registered and its value isn't dropped on close */}
      <div style={isOpen ? undefined : { display: 'none' }}>
        <FieldDateRangeController
          onChange={handleDateRangeChange}
          showClearButton
          className={classNames(css.datePicker, { [css.alignLeft]: alignLeft })}
          name="dateRange"
          id="dateRange"
          minimumNights={MIN_STAY_NIGHTS}
        />
      </div>
    </OutsideClickHandler>
  );
};

export default FilterDateRange;
