import React, { useEffect } from 'react';
import { Field } from 'react-final-form';

import { requiredFieldArrayCheckbox } from '../../../util/validators';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';

import css from './TermsAndConditions.module.css';

const KEY_CODE_ENTER = 13;

// Separate component so useEffect can be used inside the Field render
const TermsInput = props => {
  const {
    input,
    meta,
    tosAccepted,
    onOpenTermsOfService,
    onTermsUnchecked,
    intl,
    formId,
    termsLink,
    privacyLink,
  } = props;

  useEffect(() => {
    if (tosAccepted) {
      input.onChange(['tos-and-privacy']);
    } else {
      input.onChange([]);
    }
  }, [tosAccepted]);

  const isChecked = Array.isArray(input.value) && input.value.includes('tos-and-privacy');
  const id = formId ? `${formId}.terms-accepted` : 'terms-accepted';

  const handleClick = e => {
    e.preventDefault();
    if (isChecked) {
      onTermsUnchecked();
    } else {
      onOpenTermsOfService();
    }
  };

  const label = intl.formatMessage(
    { id: 'AuthenticationPage.termsAndConditionsAcceptText' },
    { termsLink, privacyLink }
  );

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
        onClick={handleClick}
      >
        <input
          id={id}
          type="checkbox"
          checked={isChecked}
          readOnly
          style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0, width: 16, height: 16 }}
        />
        <label htmlFor={id} className={css.finePrint} style={{ cursor: 'pointer', margin: 0 }}>
          {label}
        </label>
      </div>
      {meta.touched && meta.error && (
        <p style={{ color: 'var(--colorFail)', fontSize: 13, margin: '4px 0 0 0' }}>
          {meta.error}
        </p>
      )}
    </div>
  );
};

const TermsAndConditions = props => {
  const {
    onOpenTermsOfService,
    onOpenPrivacyPolicy,
    onTermsUnchecked,
    tosAccepted = false,
    formId,
    intl,
  } = props;

  const handleClick = callback => e => {
    e.preventDefault();
    e.stopPropagation();
    callback(e);
  };
  const handleKeyUp = callback => e => {
    if (e.keyCode === KEY_CODE_ENTER) callback();
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

  const validate = requiredFieldArrayCheckbox(
    intl.formatMessage({ id: 'AuthenticationPage.termsAndConditionsAcceptRequired' })
  );

  return (
    <div className={css.root}>
      <Field name="terms" validate={validate}>
        {fieldProps => (
          <TermsInput
            {...fieldProps}
            tosAccepted={tosAccepted}
            onOpenTermsOfService={onOpenTermsOfService}
            onTermsUnchecked={onTermsUnchecked}
            intl={intl}
            formId={formId}
            termsLink={termsLink}
            privacyLink={privacyLink}
          />
        )}
      </Field>
    </div>
  );
};

export default TermsAndConditions;
