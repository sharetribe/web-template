import React from 'react';
import { func } from 'prop-types';

import { requiredFieldArrayCheckbox } from '../../../util/validators';
import { FieldCheckboxGroup } from '../../../components';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';

import css from './TermsAndConditions.module.css';

const KEY_CODE_ENTER = 13;

const TermsAndConditions = props => {
  const { onOpenTermsOfService, onOpenPrivacyPolicy, intl } = props;

  const handleClick = callback => e => {
    e.preventDefault();
    callback(e);
  };
  const handleKeyUp = callback => e => {
    // Allow click action with keyboard like with normal links
    if (e.keyCode === KEY_CODE_ENTER) {
      callback();
    }
  };

  const termsLink = (
    <span
      className={css.termsLink}
      onClick={handleClick(onOpenTermsOfService)}
      role="button"
      tabIndex="0"
      onKeyUp={handleKeyUp(onOpenTermsOfService)}
    >
      <FormattedMessage id="AuthenticationPage.termsAndConditionsTermsLinkText" />
    </span>
  );

  const privacyLink = (
    <span
      className={css.privacyLink}
      onClick={handleClick(onOpenPrivacyPolicy)}
      role="button"
      tabIndex="0"
      onKeyUp={handleKeyUp(onOpenPrivacyPolicy)}
    >
      <FormattedMessage id="AuthenticationPage.termsAndConditionsPrivacyLinkText" />
    </span>
  );

  return (
    <div className={css.root}>
      <FieldCheckboxGroup
        name="terms"
        id="terms-accepted"
        optionLabelClassName={css.finePrint}
        options={[
          {
            key: 'tos-and-privacy',
            label: intl.formatMessage(
              { id: 'AuthenticationPage.termsAndConditionsAcceptText' },
              { termsLink, privacyLink }
            ),
          },
        ]}
        validate={requiredFieldArrayCheckbox(
          intl.formatMessage({ id: 'AuthenticationPage.termsAndConditionsAcceptRequired' })
        )}
      />
    </div>
  );
};

// TermsAndConditions.defaultProps = {};

TermsAndConditions.propTypes = {
  onOpenTermsOfService: func.isRequired,
  onOpenPrivacyPolicy: func.isRequired,
  intl: intlShape.isRequired,
};

export default TermsAndConditions;
