import React, { useState, useEffect } from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { createResourceLocatorString } from '../../util/routes';
import { isStripeError } from '../../util/errors';
import * as validators from '../../util/validators';
import { propTypes } from '../../util/types';

import {
  H4,
  Button,
  ExternalLink,
  InlineTextButton,
  FieldSelect,
  FieldRadioButton,
  Form,
  StripeBankAccountTokenInputField,
} from '../../components';

import css from './StripeConnectAccountForm.module.css';

const getSupportedCountryCodes = supportedCountries => supportedCountries.map(c => c.code);
const stripeCountryConfigs = (countryCode, supportedCountries) => {
  const country = supportedCountries.find(c => c.code === countryCode);

  if (!country) {
    throw new Error(`Country code not found in Stripe config ${countryCode}`);
  }
  return country;
};

const countryCurrency = (countryCode, supportedCountries) => {
  const country = stripeCountryConfigs(countryCode, supportedCountries);
  return country.currency;
};

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

const CreateStripeAccountFields = props => {
  const routeConfiguration = useRouteConfiguration();
  const {
    disabled,
    countryLabel,
    showAsRequired,
    form,
    values,
    intl,
    currentUserId,
    marketplaceRootURL,
    supportedCountries,
    defaultMCC,
  } = props;

  /*
  We pass some default values to Stripe when creating a new Stripe account in order to reduce couple of steps from Connect Onboarding form.
  - businessProfileURL: user's profile URL
  - businessProfileMCC: default MCC code from stripe-config.js
  - accountToken (https://stripe.com/docs/connect/account-tokens) with following information:
    * accountType: individual or business
    * tos_shown_and_accepted: true
  Only country and bank account token are mandatory values. If you decide to remove the additional default values listed here, remember to update the `createStripeAccount` function in `ducks/stripeConnectAccount.duck.js`.
  */

  useEffect(() => {
    // Use user profile page as business_url on this marketplace
    // or just fake it if it's dev environment using Stripe test endpoints
    // because Stripe will not allow passing a localhost URL
    const hasBusinessURL = values && values.businessProfileURL;
    if (!hasBusinessURL && currentUserId) {
      const pathToProfilePage = uuid =>
        createResourceLocatorString('ProfilePage', routeConfiguration, { id: uuid }, {});
      const hasMarketplaceRootURL = !!marketplaceRootURL;
      const rootUrl = hasMarketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : null;
      const profilePageURL =
        hasMarketplaceRootURL && !rootUrl.includes('localhost')
          ? `${rootUrl}${pathToProfilePage(currentUserId.uuid)}`
          : `https://test-marketplace.com${pathToProfilePage(currentUserId.uuid)}`;
      const defaultBusinessURL = `${profilePageURL}?mode=storefront`;
      form.change('businessProfileURL', defaultBusinessURL);
    }

    const hasMCC = values && values.businessProfileMCC;
    // Use default merchant category code (MCC) from stripe-config.js
    if (!hasMCC && defaultMCC) {
      form.change('businessProfileMCC', defaultMCC);
    }
  }, []);

  const country = values.country;

  return (
    <div className={css.sectionContainer}>
      <H4 as="h3">
        <FormattedMessage id="StripeConnectAccountForm.accountTypeTitle" />
      </H4>
      <div className={css.radioButtonRow}>
        <FieldRadioButton
          id="individual"
          name="accountType"
          label={intl.formatMessage({
            id: 'StripeConnectAccountForm.individualAccount',
          })}
          value="individual"
          showAsRequired={showAsRequired}
        />
        <FieldRadioButton
          id="company"
          name="accountType"
          label={intl.formatMessage({ id: 'StripeConnectAccountForm.companyAccount' })}
          value="company"
          showAsRequired={showAsRequired}
        />
      </div>

      <FieldHidden name="businessProfileURL" />
      <FieldHidden name="businessProfileMCC" />

      <FieldSelect
        id="country"
        name="country"
        disabled={disabled}
        className={css.selectCountry}
        autoComplete="country"
        label={countryLabel}
        validate={validators.required(
          intl.formatMessage({
            id: 'StripeConnectAccountForm.countryRequired',
          })
        )}
      >
        <option disabled value="">
          {intl.formatMessage({ id: 'StripeConnectAccountForm.countryPlaceholder' })}
        </option>
        {getSupportedCountryCodes(supportedCountries).map(c => (
          <option key={c} value={c}>
            {intl.formatMessage({ id: `StripeConnectAccountForm.countryNames.${c}` })}
          </option>
        ))}
      </FieldSelect>

      {country ? (
        <StripeBankAccountTokenInputField
          className={css.bankDetailsStripeField}
          disabled={disabled}
          name="bankAccountToken"
          formName="StripeConnectAccountForm"
          country={country}
          currency={countryCurrency(country, supportedCountries)}
          validate={validators.required(' ')}
        />
      ) : null}
    </div>
  );
};

const UpdateStripeAccountFields = props => {
  const {
    disabled,
    countryLabel,
    savedCountry,
    showCardUpdateInput,
    submitInProgress,
    setShowCardUpdateInput,
    stripeBankAccountLastDigits,
    supportedCountries,
  } = props;

  return (
    <div className={css.savedInformation}>
      <label className={css.accountInformationTitle}>{countryLabel}</label>
      <div className={css.savedCountry}>
        <FormattedMessage id={`StripeConnectAccountForm.countryNames.${savedCountry}`} />
      </div>
      <label className={css.accountInformationTitle}>
        <FormattedMessage id="StripeConnectAccountForm.bankAccountLabel" />
      </label>

      {showCardUpdateInput && savedCountry ? (
        <StripeBankAccountTokenInputField
          className={css.bankDetailsStripeField}
          disabled={disabled}
          name="bankAccountToken"
          formName="StripeConnectAccountForm"
          country={savedCountry}
          currency={countryCurrency(savedCountry, supportedCountries)}
          validate={validators.required(' ')}
        />
      ) : !submitInProgress ? (
        <InlineTextButton
          className={css.savedBankAccount}
          onClick={() => setShowCardUpdateInput(true)}
        >
          •••••••••••••••••••••••• {stripeBankAccountLastDigits}
        </InlineTextButton>
      ) : null}
    </div>
  );
};

const ErrorsMaybe = props => {
  const { stripeAccountError, stripeAccountLinkError } = props;

  const errorMessage = isStripeError(stripeAccountError) ? (
    <FormattedMessage
      id="StripeConnectAccountForm.createStripeAccountFailedWithStripeError"
      values={{ stripeMessage: stripeAccountError.apiErrors[0].meta.stripeMessage }}
    />
  ) : stripeAccountError ? (
    <FormattedMessage id="StripeConnectAccountForm.createStripeAccountFailed" />
  ) : isStripeError(stripeAccountLinkError) ? (
    <FormattedMessage
      id="StripeConnectAccountForm.createStripeAccountLinkFailedWithStripeError"
      values={{ stripeMessage: stripeAccountLinkError.apiErrors[0].meta.stripeMessage }}
    />
  ) : stripeAccountLinkError ? (
    <FormattedMessage id="StripeConnectAccountForm.createStripeAccountLinkFailed" />
  ) : null;

  return errorMessage ? <div className={css.error}>{errorMessage}</div> : null;
};

const StripeConnectAccountFormComponent = props => {
  const [showCardUpdateInput, setShowCardUpdateInput] = useState(false);
  const config = useConfiguration();
  const { onSubmit, ...restOfProps } = props;
  const isUpdate = props.stripeConnected;
  const stripePublishableKey = config.stripe.publishableKey;
  const supportedCountries = config.stripe.supportedCountries;

  return (
    <FinalForm
      {...restOfProps}
      onSubmit={values => onSubmit({ ...values, stripePublishableKey }, isUpdate)}
      mutators={{
        ...arrayMutators,
      }}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          children,
          stripeAccountError,
          stripeAccountLinkError,
          disabled,
          handleSubmit,
          inProgress,
          intl,
          invalid,
          pristine,
          ready,
          savedCountry,
          stripeAccountFetched,
          stripeBankAccountLastDigits,
          submitButtonText,
          form,
          values,
          stripeConnected,
          currentUser,
        } = fieldRenderProps;

        const accountDataLoaded = stripeConnected && stripeAccountFetched && savedCountry;
        const submitInProgress = inProgress;
        const submitDisabled = pristine || invalid || disabled || submitInProgress;

        const handleFormSubmit = event => {
          // Close the bank account form when clicking "save details"
          setShowCardUpdateInput(false);
          handleSubmit(event);
        };

        const countryLabel = intl.formatMessage({ id: 'StripeConnectAccountForm.countryLabel' });
        const classes = classNames(rootClassName || css.root, className, {
          [css.disabled]: disabled,
        });

        const showAsRequired = pristine;

        const currentUserId = currentUser ? currentUser.id : null;

        // If the user doesn't have Stripe connected account,
        // show fields for country and bank account.
        // Otherwise, show only possibility the edit bank account
        // because Stripe doesn't allow user to change the country
        const stripeAccountFields = !stripeConnected ? (
          <CreateStripeAccountFields
            stripeConnected={stripeConnected}
            disabled={disabled}
            showAsRequired={showAsRequired}
            countryLabel={countryLabel}
            supportedCountries={supportedCountries}
            marketplaceRootURL={config.marketplaceRootURL}
            defaultMCC={config.stripe.defaultMCC}
            currentUserId={currentUserId}
            form={form}
            values={values}
            intl={intl}
          />
        ) : (
          <UpdateStripeAccountFields
            disabled={disabled}
            countryLabel={countryLabel}
            supportedCountries={supportedCountries}
            savedCountry={savedCountry}
            stripeBankAccountLastDigits={stripeBankAccountLastDigits}
            showCardUpdateInput={showCardUpdateInput}
            values={values}
            submitInProgress={submitInProgress}
            setShowCardUpdateInput={setShowCardUpdateInput}
            intl={intl}
          />
        );

        const stripeConnectedAccountTermsLink = (
          <ExternalLink href="https://stripe.com/connect-account/legal" className={css.termsLink}>
            <FormattedMessage id="StripeConnectAccountForm.stripeConnectedAccountTermsLink" />
          </ExternalLink>
        );

        // Don't show the submit button while fetching the Stripe account data
        const submitButtonMaybe =
          !stripeConnected || accountDataLoaded ? (
            <>
              <p className={css.termsText}>
                <FormattedMessage
                  id="StripeConnectAccountForm.stripeToSText"
                  values={{ stripeConnectedAccountTermsLink }}
                />
              </p>

              <Button
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                ready={ready}
              >
                {submitButtonText || (
                  <FormattedMessage id="StripeConnectAccountForm.submitButtonText" />
                )}
              </Button>
            </>
          ) : null;

        // If the Stripe publishable key is not set up, don't show the form
        return config.stripe.publishableKey ? (
          <Form className={classes} onSubmit={handleFormSubmit}>
            {!stripeConnected || accountDataLoaded ? (
              stripeAccountFields
            ) : (
              <div className={css.savedInformation}>
                <FormattedMessage id="StripeConnectAccountForm.loadingStripeAccountData" />
              </div>
            )}

            <ErrorsMaybe
              stripeAccountError={stripeAccountError}
              stripeAccountLinkError={stripeAccountLinkError}
            />

            {children}

            {submitButtonMaybe}
          </Form>
        ) : (
          <div className={css.missingStripeKey}>
            <FormattedMessage id="StripeConnectAccountForm.missingStripeKey" />
          </div>
        );
      }}
    />
  );
};

StripeConnectAccountFormComponent.defaultProps = {
  className: null,
  currentUser: null,
  stripeAccountError: null,
  disabled: false,
  inProgress: false,
  ready: false,
  savedCountry: null,
  stripeBankAccountLastDigits: null,
  submitButtonText: null,
  fieldRenderProps: null,
};

StripeConnectAccountFormComponent.propTypes = {
  currentUser: propTypes.currentUser,
  className: string,
  stripeAccountError: object,
  disabled: bool,
  inProgress: bool,
  ready: bool,
  savedCountry: string,
  stripeBankAccountLastDigits: string,
  stripeAccountFetched: bool.isRequired,
  submitButtonText: string,
  fieldRenderProps: shape({
    handleSubmit: func,
    invalid: bool,
    pristine: bool,
    values: object,
  }),

  // from injectIntl
  intl: intlShape.isRequired,
};

const StripeConnectAccountForm = compose(injectIntl)(StripeConnectAccountFormComponent);

export default StripeConnectAccountForm;
