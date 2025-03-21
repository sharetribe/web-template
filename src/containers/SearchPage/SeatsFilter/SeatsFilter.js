import React, { createRef } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';

import { FieldNumber } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import css from './SeatsFilter.module.css';

const getSeatsQueryParam = queryParamNames => {
  const param = Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'seats';
  return param;
};

/**
 * A filter component for filtering with the number of available seats.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {Array<string>} props.queryParamNames
 * @param {string} props.label
 * @param {Function} props.onSubmit
 * @param {Object?} props.initialValues
 * @param {string | number} props.initialValues.seats
 * @param {number} props.contentPlacementOffset
 * @param {string?} props.rootClassName
 * @param {string?} props.className
 * @returns {JSX.Element} containing a numeric seats filter component
 */
const SeatsFilter = props => {
  const mobileInputRef = createRef();

  const {
    rootClassName,
    className,
    id,
    name,
    label,
    initialValues,
    contentPlacementOffset = 0,
    onSubmit,
    queryParamNames,
    intl,
    showAsPopup,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const urlParam = getSeatsQueryParam(queryParamNames);
  const hasInitialValues = !!initialValues && !!initialValues[urlParam];

  const initialSeats = initialValues[urlParam];
  const seatsInitialValue = initialSeats ? { seats: initialSeats } : {};

  const labelForPopup = hasInitialValues
    ? intl.formatMessage({ id: 'SeatsFilter.labelSelected' }, { seatCount: initialSeats })
    : label;

  const labelForPlain = hasInitialValues ? (
    <span className={css.labelPlainSelected}>
      <FormattedMessage id="SeatsFilter.labelSelected" values={{ seatCount: initialSeats }} />
    </span>
  ) : (
    <span className={css.labelPlain}>{label}</span>
  );

  const handleSubmit = values => {
    const usedValue = values ? values[name] : values;
    onSubmit({ [urlParam]: usedValue });
  };

  // Uncontrolled input needs to be cleared through the reference to DOM element.
  const handleClear = () => {
    if (mobileInputRef && mobileInputRef.current) {
      mobileInputRef.current.value = '';
    }
  };

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      popupClassName={css.popupSize}
      name={name}
      label={labelForPopup}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      showAsPopup
      labelMaxWidth={250}
      contentPlacementOffset={contentPlacementOffset}
      onSubmit={handleSubmit}
      initialValues={seatsInitialValue}
      keepDirtyOnReinitialize
      {...rest}
    >
      <fieldset className={css.fieldPopup}>
        <label className={css.fieldPopupLabel} htmlFor={`${id}-input`}>
          {label}
        </label>
        <FieldNumber
          className={css.field}
          name={name}
          id={name}
          type="text"
          autoComplete="off"
          initialValue={initialSeats}
          minValue={1}
          maxValue={99}
        />
      </fieldset>
    </FilterPopup>
  ) : (
    <FilterPlain
      className={className}
      rootClassName={rootClassName}
      label={labelForPlain}
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmit}
      onClear={handleClear}
      initialValues={seatsInitialValue}
      {...rest}
    >
      <fieldset className={css.fieldPlain}>
        <FieldNumber
          className={css.field}
          name={name}
          id={name}
          type="text"
          initialValue={initialSeats}
          minValue={1}
        />
      </fieldset>
    </FilterPlain>
  );
};

export default injectIntl(SeatsFilter);
