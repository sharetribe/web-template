import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';

import {
  Form,
  PrimaryButton,
  FieldTextInput,
  FieldRadioButton,
  FieldSelect,
} from '../../../components';

import FieldPhoneWithCountry from './FieldPhoneWithCountry';
import FieldUrlInput from './FieldUrlInput';
import css from './ExpertSignupForm.module.css';

const YEARS_OF_EXPERIENCE_OPTIONS = [
  { value: '0-2', label: '0 – 2 years' },
  { value: '3-5', label: '3 – 5 years' },
  { value: '6-10', label: '6 – 10 years' },
  { value: '10+', label: '10+ years' },
];

const PRIMARY_EXPERTISE_OPTIONS = [
  { value: 'strategy', label: 'Strategy & Consulting' },
  { value: 'marketing', label: 'Marketing & Growth' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'technology', label: 'Technology & Engineering' },
  { value: 'design', label: 'Design & UX' },
  { value: 'hr', label: 'HR & People Operations' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'sales', label: 'Sales & Business Development' },
  { value: 'operations', label: 'Operations & Supply Chain' },
  { value: 'other', label: 'Other' },
];

const TARGET_CUSTOMER_BASE_OPTIONS = [
  { value: 'startups', label: 'Startups' },
  { value: 'sme', label: 'SMEs' },
  { value: 'enterprise', label: 'Enterprises' },
  { value: 'nonprofit', label: 'Non-profits' },
  { value: 'public', label: 'Public sector' },
  { value: 'all', label: 'All types' },
];

const ExpertSignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        values,
      } = formRenderProps;

      // email
      const emailRequired = validators.required(
        intl.formatMessage({ id: 'ExpertSignupForm.emailRequired' })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({ id: 'ExpertSignupForm.emailInvalid' })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'ExpertSignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        { id: 'ExpertSignupForm.passwordTooShort' },
        { minLength: validators.PASSWORD_MIN_LENGTH }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        { id: 'ExpertSignupForm.passwordTooLong' },
        { maxLength: validators.PASSWORD_MAX_LENGTH }
      );
      const passwordValidators = validators.composeValidators(
        validators.requiredStringNoTrim(passwordRequiredMessage),
        validators.minLength(passwordMinLengthMessage, validators.PASSWORD_MIN_LENGTH),
        validators.maxLength(passwordMaxLengthMessage, validators.PASSWORD_MAX_LENGTH)
      );

      const phoneRequired = validators.required(
        intl.formatMessage({ id: 'ExpertSignupForm.phoneRequired' })
      );
      const phoneMinDigits = value => {
        const digits = (value || '').replace(/\D/g, '');
        return digits.length >= 8
          ? undefined
          : intl.formatMessage({ id: 'ExpertSignupForm.phoneTooShort' });
      };
      const phoneValidators = validators.composeValidators(phoneRequired, phoneMinDigits);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* Name row */}
          <div className={css.nameRow}>
            <FieldTextInput
              className={css.firstNameRoot}
              type="text"
              id={formId ? `${formId}.fname` : 'fname'}
              name="fname"
              autoComplete="given-name"
              label={intl.formatMessage({ id: 'ExpertSignupForm.firstNameLabel' })}
              placeholder={intl.formatMessage({ id: 'ExpertSignupForm.firstNamePlaceholder' })}
              validate={validators.required(
                intl.formatMessage({ id: 'ExpertSignupForm.firstNameRequired' })
              )}
            />
            <FieldTextInput
              className={css.lastNameRoot}
              type="text"
              id={formId ? `${formId}.lname` : 'lname'}
              name="lname"
              autoComplete="family-name"
              label={intl.formatMessage({ id: 'ExpertSignupForm.lastNameLabel' })}
              placeholder={intl.formatMessage({ id: 'ExpertSignupForm.lastNamePlaceholder' })}
              validate={validators.required(
                intl.formatMessage({ id: 'ExpertSignupForm.lastNameRequired' })
              )}
            />
          </div>

          {/* Email + Phone row */}
          <div className={css.twoColRow}>
            <FieldTextInput
              className={css.halfField}
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={intl.formatMessage({ id: 'ExpertSignupForm.emailLabel' })}
              placeholder={intl.formatMessage({ id: 'ExpertSignupForm.emailPlaceholder' })}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />

            {/* Professional Phone */}
            <FieldPhoneWithCountry
              className={css.halfField}
              id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
              name="phoneNumber"
              label={intl.formatMessage({ id: 'ExpertSignupForm.phoneLabel' })}
              placeholder={intl.formatMessage({ id: 'ExpertSignupForm.phonePlaceholder' })}
              validate={phoneValidators}
            />
          </div>

          {/* Password */}
          <FieldTextInput
            className={css.field}
            type="password"
            id={formId ? `${formId}.password` : 'password'}
            name="password"
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'ExpertSignupForm.passwordLabel' })}
            placeholder={intl.formatMessage({ id: 'ExpertSignupForm.passwordPlaceholder' })}
            validate={passwordValidators}
          />

          {/* Links */}
          <div className={css.field}>
            <label className={css.linksLabel}>
              <FormattedMessage id="ExpertSignupForm.linksLabel" />
            </label>
            <div className={css.linksRow}>
              <FieldUrlInput
                id={formId ? `${formId}.linkedinUrl` : 'linkedinUrl'}
                name="linkedinUrl"
                placeholder={intl.formatMessage({ id: 'ExpertSignupForm.linkedinPlaceholder' })}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                }
              />
              <FieldUrlInput
                id={formId ? `${formId}.websiteUrl` : 'websiteUrl'}
                name="websiteUrl"
                placeholder={intl.formatMessage({ id: 'ExpertSignupForm.websitePlaceholder' })}
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Company Information */}
          <div className={css.companySection}>
            <div className={css.companySectionLeft}>
              <div className={css.companyTopGroup}>
                <p className={css.companyInfoLabel}>
                  <FormattedMessage id="ExpertSignupForm.companyInfoLabel" />
                </p>
                <div className={css.radioGroup}>
                  <FieldRadioButton
                    id={formId ? `${formId}.companyType.individual` : 'companyType.individual'}
                    name="companyType"
                    value="individual"
                    label={intl.formatMessage({ id: 'ExpertSignupForm.companyTypeIndividual' })}
                  />
                  <FieldRadioButton
                    id={formId ? `${formId}.companyType.company` : 'companyType.company'}
                    name="companyType"
                    value="company"
                    label={intl.formatMessage({ id: 'ExpertSignupForm.companyTypeCompany' })}
                  />
                </div>
              </div>
              {values.companyType === 'company' ? (
                <FieldTextInput
                  className={css.companyField}
                  type="text"
                  id={formId ? `${formId}.vatNumber` : 'vatNumber'}
                  name="vatNumber"
                  label={intl.formatMessage({ id: 'ExpertSignupForm.vatNumberLabel' })}
                  placeholder={intl.formatMessage({ id: 'ExpertSignupForm.vatNumberPlaceholder' })}
                />
              ) : null}
            </div>

            {values.companyType === 'company' ? (
              <div className={css.companySectionRight}>
                <div className={css.addressWrapper}>
                  <FieldTextInput
                    className={css.companyField}
                    type="text"
                    id={formId ? `${formId}.address` : 'address'}
                    name="address"
                    autoComplete="street-address"
                    label={intl.formatMessage({ id: 'ExpertSignupForm.addressLabel' })}
                    placeholder={intl.formatMessage({ id: 'ExpertSignupForm.addressPlaceholder' })}
                    validate={validators.required(
                      intl.formatMessage({ id: 'ExpertSignupForm.addressRequired' })
                    )}
                  />
                </div>
                <FieldTextInput
                  className={css.companyField}
                  type="text"
                  id={formId ? `${formId}.city` : 'city'}
                  name="city"
                  autoComplete="address-level2"
                  label={intl.formatMessage({ id: 'ExpertSignupForm.cityLabel' })}
                  placeholder={intl.formatMessage({ id: 'ExpertSignupForm.cityPlaceholder' })}
                  validate={validators.required(
                    intl.formatMessage({ id: 'ExpertSignupForm.cityRequired' })
                  )}
                />
              </div>
            ) : null}
          </div>

          {/* ===== Expert Profile Section ===== */}
          <div className={css.expertProfileSection}>
            {/* Three dropdowns row */}
            <div className={css.dropdownsRow}>
              <FieldSelect
                className={css.dropdownField}
                id={formId ? `${formId}.yearsOfExperience` : 'yearsOfExperience'}
                name="yearsOfExperience"
                label={intl.formatMessage({ id: 'ExpertSignupForm.yearsOfExperienceLabel' })}
                validate={validators.required(
                  intl.formatMessage({ id: 'ExpertSignupForm.yearsOfExperienceRequired' })
                )}
              >
                <option value="" disabled>
                  {intl.formatMessage({ id: 'ExpertSignupForm.yearsOfExperiencePlaceholder' })}
                </option>
                {YEARS_OF_EXPERIENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FieldSelect>

              <FieldSelect
                className={css.dropdownField}
                id={formId ? `${formId}.primaryExpertise` : 'primaryExpertise'}
                name="primaryExpertise"
                label={intl.formatMessage({ id: 'ExpertSignupForm.primaryExpertiseLabel' })}
                validate={validators.required(
                  intl.formatMessage({ id: 'ExpertSignupForm.primaryExpertiseRequired' })
                )}
              >
                <option value="" disabled>
                  {intl.formatMessage({ id: 'ExpertSignupForm.primaryExpertisePlaceholder' })}
                </option>
                {PRIMARY_EXPERTISE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FieldSelect>

              <FieldSelect
                className={css.dropdownField}
                id={formId ? `${formId}.targetCustomerBase` : 'targetCustomerBase'}
                name="targetCustomerBase"
                label={intl.formatMessage({ id: 'ExpertSignupForm.targetCustomerBaseLabel' })}
                validate={validators.required(
                  intl.formatMessage({ id: 'ExpertSignupForm.targetCustomerBaseRequired' })
                )}
              >
                <option value="" disabled>
                  {intl.formatMessage({ id: 'ExpertSignupForm.targetCustomerBasePlaceholder' })}
                </option>
                {TARGET_CUSTOMER_BASE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </FieldSelect>
            </div>

            {/* Unique Value Proposition */}
            <FieldTextInput
              className={css.textareaField}
              type="textarea"
              id={formId ? `${formId}.uniqueValueProposition` : 'uniqueValueProposition'}
              name="uniqueValueProposition"
              label={intl.formatMessage({ id: 'ExpertSignupForm.uvpLabel' })}
              placeholder={intl.formatMessage({ id: 'ExpertSignupForm.uvpPlaceholder' })}
              helpText={intl.formatMessage({ id: 'ExpertSignupForm.uvpHelpText' })}
              validate={validators.required(
                intl.formatMessage({ id: 'ExpertSignupForm.uvpRequired' })
              )}
            />

            {/* Motivation Letter */}
            <FieldTextInput
              className={css.textareaField}
              type="textarea"
              id={formId ? `${formId}.motivationLetter` : 'motivationLetter'}
              name="motivationLetter"
              label={intl.formatMessage({ id: 'ExpertSignupForm.motivationLetterLabel' })}
              placeholder={intl.formatMessage({
                id: 'ExpertSignupForm.motivationLetterPlaceholder',
              })}
              helpText={intl.formatMessage({ id: 'ExpertSignupForm.motivationLetterHelpText' })}
              validate={validators.required(
                intl.formatMessage({ id: 'ExpertSignupForm.motivationLetterRequired' })
              )}
            />
          </div>

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="ExpertSignupForm.submit" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the expert signup form.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Overrides the default root class
 * @param {string} [props.className] - Extends the root class
 * @param {string} [props.formId] - The form id
 * @param {boolean} [props.inProgress] - Whether the form is submitting
 * @param {Function} props.onSubmit - Submit handler
 * @returns {JSX.Element}
 */
const ExpertSignupForm = props => {
  const intl = useIntl();
  return <ExpertSignupFormComponent {...props} intl={intl} />;
};

export default ExpertSignupForm;
