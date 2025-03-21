import React, { Component } from 'react';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { parseDateFromISO8601, stringifyDateToISO8601 } from '../../../util/dates';

import { FieldDateRangeController } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import FilterPopupForSidebar from './FilterPopupForSidebar';
import css from './BookingDateRangeFilter.module.css';

const getDatesQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'dates';
};

// Parse query parameter, which should look like "2020-05-28,2020-05-31"
const parseValue = value => {
  const rawValuesFromParams = value ? value.split(',') : [];
  const [startDate, endDate] = rawValuesFromParams.map(v => parseDateFromISO8601(v));
  return value && startDate && endDate ? { dates: { startDate, endDate } } : { dates: null };
};
// Format dateRange value for the query. It's given by FieldDateRangeInput:
// { dates: { startDate, endDate } }
const formatValue = (dateRange, queryParamName) => {
  const hasDates = dateRange && dateRange.dates;
  const { startDate, endDate } = hasDates ? dateRange.dates : {};
  const start = startDate ? stringifyDateToISO8601(startDate) : null;
  const end = endDate ? stringifyDateToISO8601(endDate) : null;
  const value = start && end ? `${start},${end}` : null;
  return { [queryParamName]: value };
};

/**
 * BookingDateRangeFilter component
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The ID
 * @param {React.Node} [props.label] - The label
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {boolean} [props.liveEdit] - Whether to live edit
 * @param {Array<string>} [props.queryParamNames] - The query param names (e.g. ['dates'])
 * @param {Function} props.onSubmit - The function to submit
 * @param {number} [props.minimumNights] - The minimum nights (default: 0)
 * @param {Object} [props.initialValues] - The initial values
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
export class BookingDateRangeFilterComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: true };

    this.popupControllerRef = null;
    this.plainControllerRef = null;

    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      className,
      rootClassName,
      showAsPopup = true,
      isDesktop = false,
      initialValues,
      id,
      contentPlacementOffset = 0,
      onSubmit,
      queryParamNames,
      label,
      intl,
      minimumNights = 0,
      ...rest
    } = this.props;

    const datesQueryParamName = getDatesQueryParamName(queryParamNames);
    const initialDates =
      initialValues && initialValues[datesQueryParamName]
        ? parseValue(initialValues[datesQueryParamName])
        : { dates: null };

    const isSelected = !!initialDates.dates;
    const startDate = isSelected ? initialDates.dates.startDate : null;
    const endDate = isSelected ? initialDates.dates.endDate : null;

    const format = {
      month: 'short',
      day: 'numeric',
    };

    const formattedStartDate = isSelected ? intl.formatDate(startDate, format) : null;
    const formattedEndDate = isSelected ? intl.formatDate(endDate, format) : null;

    const labelForPlain = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPlain' },
          {
            dates: `${formattedStartDate} - ${formattedEndDate}`,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPlain' });

    const labelForPopup = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            dates: `${formattedStartDate} - ${formattedEndDate}`,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPopup' });

    const labelSelection = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            dates: `${formattedStartDate} - ${formattedEndDate}`,
          }
        )
      : null;

    const handleSubmit = values => {
      onSubmit(formatValue(values, datesQueryParamName));
    };

    const onClearPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onClear: () => this.popupControllerRef.onReset(null, null) }
        : {};

    const onCancelPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onCancel: () => this.popupControllerRef.onReset(startDate, endDate) }
        : {};

    const onClearPlainMaybe =
      this.plainControllerRef && this.plainControllerRef.onReset
        ? { onClear: () => this.plainControllerRef.onReset(null, null) }
        : {};

    return showAsPopup ? (
      <FilterPopup
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={labelForPopup}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopup>
    ) : isDesktop ? (
      <FilterPopupForSidebar
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={label}
        labelSelection={labelSelection}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopupForSidebar>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={label}
        labelSelection={labelSelection}
        labelSelectionSeparator=":"
        isSelected={isSelected}
        id={`${id}.plain`}
        liveEdit
        onSubmit={handleSubmit}
        {...onClearPlainMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.plainControllerRef = node;
          }}
        />
      </FilterPlain>
    );
  }
}

const BookingDateRangeFilter = injectIntl(BookingDateRangeFilterComponent);

export default BookingDateRangeFilter;
