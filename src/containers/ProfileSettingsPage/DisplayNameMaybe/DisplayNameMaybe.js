import React from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';

import { FieldTextInput, H4 } from '../../../components';

import css from './DisplayNameMaybe.module.css';

function DisplayNameMaybe({ userTypeConfig, intl }) {
  const isDisabled = userTypeConfig?.defaultUserFields?.displayName === false;
  if (isDisabled) {
    return null;
  }
  const { required } = userTypeConfig?.displayNameSettings || {};
  const isRequired = required === true;
  const validateMaybe = isRequired
    ? {
        validate: validators.required(
          intl.formatMessage({
            id: 'ProfileSettingsForm.displayNameRequired',
          })
        ),
      }
    : {};
  return (
    <div className={css.sectionContainer}>
      <H4 as="h2" className={css.sectionTitle}>
        <FormattedMessage id="ProfileSettingsForm.displayNameHeading" />
      </H4>
      <FieldTextInput
        className={css.row}
        type="text"
        id="displayName"
        name="displayName"
        label={intl.formatMessage({
          id: 'ProfileSettingsForm.displayNameLabel',
        })}
        placeholder={intl.formatMessage({
          id: 'ProfileSettingsForm.displayNamePlaceholder',
        })}
        {...validateMaybe}
      />
      <p className={css.extraInfo}>
        <FormattedMessage id="ProfileSettingsForm.displayNameInfo" />
      </p>
    </div>
  );
}

export default DisplayNameMaybe;
