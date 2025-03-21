import React from 'react';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldTextInput } from '../../components';

/**
 * A component that renders the display name field.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.displayName
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {string} props.formName - The form name
 * @param {propTypes.userType} props.userTypeConfig - The user type config
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const UserFieldDisplayName = props => {
  const { rootClassName, className, formId, formName, userTypeConfig, intl } = props;

  const { displayInSignUp, required } = userTypeConfig?.displayNameSettings || {};
  const isDisabled = userTypeConfig?.defaultUserFields?.displayName === false;
  const isAllowedInSignUp = displayInSignUp === true;

  if (isDisabled || !isAllowedInSignUp) {
    return null;
  }

  const isRequired = required === true;
  const validateMaybe = isRequired
    ? {
        validate: validators.required(
          intl.formatMessage({
            id: `${formName}.displayNameRequired`,
          })
        ),
      }
    : {};

  return (
    <FieldTextInput
      className={classNames(className, { [rootClassName]: !!rootClassName })}
      type="text"
      id={formId ? `${formId}.displayName` : 'displayName'}
      name="displayName"
      label={intl.formatMessage({
        id: `${formName}.displayNameLabel`,
      })}
      placeholder={intl.formatMessage({
        id: `${formName}.displayNamePlaceholder`,
      })}
      {...validateMaybe}
    />
  );
};

export default UserFieldDisplayName;
