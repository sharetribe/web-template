import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldTextInput } from '../../components';

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

UserFieldDisplayName.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
};

UserFieldDisplayName.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  formName: string.isRequired,
  userTypeConfig: propTypes.userType.isRequired,
  intl: intlShape.isRequired,
};

export default UserFieldDisplayName;
