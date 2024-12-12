import React, { useEffect } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { createResourceLocatorString } from '../../util/routes';
import { isStripeError } from '../../util/errors';
import * as validators from '../../util/validators';
import { propTypes } from '../../util/types';

import { H4, Button, ExternalLink, FieldSelect, FieldRadioButton, Form } from '../../components';

import css from './StripeConnectAccountForm.module.css';

const getSupportedCountryCodes = supportedCountries => supportedCountries.map(c => c.code);

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
    formApi,
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
    const hasBusinessURL = values?.businessProfileURL;
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
      formApi.change('businessProfileURL', defaultBusinessURL);
    }

    const hasMCC = values?.businessProfileMCC;
    // Use default merchant category code (MCC) from stripe-config.js
    if (!hasMCC && defaultMCC) {
      formApi.change('businessProfileMCC', defaultMCC);
    }
  }, []);

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
    </div>
  );
};

const UpdateStripeAccountFields = props => {
  const {
    countryLabel,
    savedCountry,
    accountTypeLabel,
    savedAccountType,
    submitInProgress,
    stripeBankAccountLastDigits,
  } = props;
  return (
    <div className={css.savedInformation}>
      <label className={css.accountInformationTitle}>{accountTypeLabel}</label>
      <div className={css.savedCountry}>
        <FormattedMessage id={`StripeConnectAccountForm.accountTypes.${savedAccountType}`} />
      </div>
      <label className={css.accountInformationTitle}>{countryLabel}</label>
      <div className={css.savedCountry}>
        <FormattedMessage id={`StripeConnectAccountForm.countryNames.${savedCountry}`} />
      </div>

      {!submitInProgress && !!stripeBankAccountLastDigits ? (
        <>
          <label className={css.accountInformationTitle}>
            <FormattedMessage id="StripeConnectAccountForm.bankAccountLabel" />
          </label>

          <div className={css.savedBankAccount}>
            •••••••••••••••••••••••• {stripeBankAccountLastDigits}
          </div>
        </>
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

/**
 * A component that renders a Stripe connect account form.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {function} props.onSubmit - The function to call when the form is submitted
 * @param {Object} props.fieldRenderProps - The field render props
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {Object} props.stripeAccountError - The Stripe account error
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {boolean} props.ready - Whether the form is ready
 * @param {string} props.savedCountry - The saved country
 * @param {string} props.stripeBankAccountLastDigits - The last digits of the Stripe bank account
 * @param {boolean} props.stripeAccountFetched - Whether the Stripe account data is fetched
 * @param {string} props.submitButtonText - The text for the submit button
 * @param {Object} props.fieldRenderProps - The field render props
 * @returns {JSX.Element}
 */
const StripeConnectAccountForm = props => {
  const config = useConfiguration();
  const intl = useIntl();
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
          invalid,
          pristine,
          ready,
          savedCountry,
          savedAccountType,
          stripeAccountFetched,
          stripeBankAccountLastDigits,
          submitButtonText,
          form: formApi,
          values,
          stripeConnected,
          currentUser,
        } = fieldRenderProps;

        const accountDataLoaded = stripeConnected && stripeAccountFetched && savedCountry;
        const submitInProgress = inProgress;
        const submitDisabled =
          pristine ||
          invalid ||
          disabled ||
          submitInProgress ||
          (!stripeConnected && !values?.accountType);

        const countryLabel = intl.formatMessage({ id: 'StripeConnectAccountForm.countryLabel' });
        const accountTypeLabel = intl.formatMessage({
          id: 'StripeConnectAccountForm.accountTypeTitle',
        });
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
            disabled={disabled}
            showAsRequired={showAsRequired}
            countryLabel={countryLabel}
            supportedCountries={supportedCountries}
            marketplaceRootURL={config.marketplaceRootURL}
            defaultMCC={config.stripe.defaultMCC}
            currentUserId={currentUserId}
            formApi={formApi}
            values={values}
            intl={intl}
          />
        ) : (
          <UpdateStripeAccountFields
            countryLabel={countryLabel}
            savedCountry={savedCountry}
            accountTypeLabel={accountTypeLabel}
            savedAccountType={savedAccountType}
            stripeBankAccountLastDigits={stripeBankAccountLastDigits}
            submitInProgress={submitInProgress}
            formApi={formApi}
            values={values}
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
          <Form className={classes} onSubmit={handleSubmit}>
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

export default StripeConnectAccountForm;
