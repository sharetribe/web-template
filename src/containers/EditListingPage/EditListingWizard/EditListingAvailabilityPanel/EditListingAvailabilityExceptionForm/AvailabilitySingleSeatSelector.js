import React from 'react';
import { FieldRadioButton } from '../../../../../components';

import css from './AvailabilityModeSelector.module.css';

const AvailabilityModeSelector = props => {
  const { idPrefix, pristine, intl } = props;
  return (
    <div className={css.radioButtons}>
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

export default AvailabilityModeSelector;
