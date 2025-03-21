import React from 'react';
import { object } from 'prop-types';

// Import configs and util modules
import { useIntl } from '../../../../util/reactIntl';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../../util/validators';

// Import shared components
import { FieldLocationAutocompleteInput } from '../../../../components';

// Import modules from this directory
import css from './EditLocationForm.module.css';

const identity = v => v;

export const EditLocationForm = ({ values = {} }) => {
  const intl = useIntl();

  const addressRequiredMessage = intl.formatMessage({
    id: 'EditListingLocationForm.addressRequired',
  });
  const addressNotRecognizedMessage = intl.formatMessage({
    id: 'EditListingLocationForm.addressNotRecognized',
  });

  return (
    <FieldLocationAutocompleteInput
      rootClassName={css.locationAddress}
      inputClassName={css.locationAutocompleteInput}
      iconClassName={css.locationAutocompleteInputIcon}
      predictionsClassName={css.predictionsRoot}
      validClassName={css.validLocation}
      name="location"
      label={intl.formatMessage({ id: 'EditListingLocationForm.address' })}
      placeholder={intl.formatMessage({
        id: 'EditListingLocationForm.addressPlaceholder',
      })}
      useDefaultPredictions={false}
      format={identity}
      valueFromForm={values.location}
      validate={composeValidators(
        autocompleteSearchRequired(addressRequiredMessage),
        autocompletePlaceSelected(addressNotRecognizedMessage)
      )}
    />
  );
};

EditLocationForm.propTypes = {
  values: object,
};

export default EditLocationForm;
