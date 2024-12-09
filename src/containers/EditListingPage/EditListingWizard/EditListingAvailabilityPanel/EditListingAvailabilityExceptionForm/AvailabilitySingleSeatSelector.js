import React from 'react';
import classNames from 'classnames';

import { FieldRadioButton } from '../../../../../components';

import css from './AvailabilitySingleSeatSelector.module.css';

/**
 * A Form Field that allows marking singleSeat availability (allow/block)
 *
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.idPrefix
 * @param {boolean?} props.pristine
 * @param {ReactIntl} props.intl
 * @returns {JSX.Element} Form Field looking like a radio button
 */
const AvailabilitySingleSeatSelector = props => {
  const { rootClassName, className, idPrefix, pristine, intl } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <FieldRadioButton
        id={`${idPrefix}.available`}
        name="availability"
        label={intl.formatMessage({ id: 'EditListingAvailabilityExceptionForm.available' })}
        value="available"
        checkedClassName={css.checkedAvailable}
        showAsRequired={pristine}
      />
      <FieldRadioButton
        id={`${idPrefix}.not-available`}
        name="availability"
        label={intl.formatMessage({
          id: 'EditListingAvailabilityExceptionForm.notAvailable',
        })}
        value="not-available"
        checkedClassName={css.checkedNotAvailable}
        showAsRequired={pristine}
      />
    </div>
  );
};

export default AvailabilitySingleSeatSelector;
