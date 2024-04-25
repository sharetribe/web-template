import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldPhoneNumberInput } from '../../components';

const UserFieldPhoneNumber = props => {
  const { rootClassName, className, formId, formName, userTypeConfig, intl } = props;

  const { displayInSignUp, required } = userTypeConfig?.phoneNumberSettings || {};
  const isDisabled = userTypeConfig?.defaultUserFields?.phoneNumber === false;
  const isAllowedInSignUp = displayInSignUp === true;

  if (isDisabled || !isAllowedInSignUp) {
    return null;
  }

  const isRequired = required === true;
  const validateMaybe = isRequired
    ? {
        validate: validators.required(
          intl.formatMessage({
            id: `${formName}.phoneNumberRequired`,
          })
        ),
      }
    : {};

  return (
    <FieldPhoneNumberInput
      className={classNames(className, { [rootClassName]: !!rootClassName })}
      type="text"
      id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
      name="phoneNumber"
      label={intl.formatMessage({
        id: `${formName}.phoneNumberLabel`,
      })}
      placeholder={intl.formatMessage({
        id: `${formName}.phoneNumberPlaceholder`,
      })}
      {...validateMaybe}
    />
  );
};

UserFieldPhoneNumber.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
};

UserFieldPhoneNumber.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  formName: string.isRequired,
  userTypeConfig: propTypes.userType.isRequired,
  intl: intlShape.isRequired,
};

export default UserFieldPhoneNumber;
