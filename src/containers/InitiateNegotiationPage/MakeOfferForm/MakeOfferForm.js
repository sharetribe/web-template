import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import contexts and util modules
import appSettings from '../../../config/settings.js';
import { types as sdkTypes } from '../../../util/sdkLoader.js';
import { FormattedMessage, intlShape } from '../../../util/reactIntl.js';
import { formatMoney } from '../../../util/currency.js';
import { propTypes } from '../../../util/types.js';
import * as validators from '../../../util/validators.js';

// Import shared components
import {
  FieldCurrencyInput,
  FieldTextInput,
  Form,
  Heading,
  NamedLink,
  PrimaryButton,
} from '../../../components/index.js';

import css from './MakeOfferForm.module.css';

const { Money } = sdkTypes;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const offerRequiredMsgId = { id: 'InitiateNegotiationPage.offerRequired' };
  const offerRequiredMsg = intl.formatMessage(offerRequiredMsgId);
  const offerRequired = validators.required(offerRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const offerTooLowMsgId = { id: 'InitiateNegotiationPage.offerTooLow' };
  const offerTooLowMsg = intl.formatMessage(offerTooLowMsgId, { minPrice });
  const minOfferRequired = validators.moneySubUnitAmountAtLeast(
    offerTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(offerRequired, minOfferRequired)
    : priceRequired;
};

const FinePrint = ({ stripeConnected }) => {
  if (stripeConnected) {
    return (
      <div className={css.finePrint}>
        <FormattedMessage id="InitiateNegotiationPage.finePrint" />
      </div>
    );
  }

  const payoutDetailsWarningLink = (
    <NamedLink name="StripePayoutPage">
      <FormattedMessage id="InitiateNegotiationPage.payoutDetailsWarningLink" />
    </NamedLink>
  );

  return (
    <div className={css.finePrint}>
      <FormattedMessage
        id="InitiateNegotiationPage.payoutDetailsWarning"
        values={{ payoutDetailsWarningLink }}
      />
    </div>
  );
};

/**
 * Make offer step in the default-negotiation process.
 * It's provider's job to make offer for "request" type of listings.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled.
 * @param {string} props.processName - The process name.
 * @param {propTypes.listing} props.listing - The listing.
 * @param {string} props.listingTitle - The listing title.
 * @param {string} props.title - The title.
 * @param {intlShape} props.intl - The intl object.
 * @param {Object} props.config - The config object.
 * @param {propTypes.error} props.initiateInquiryError - The error message.
 */
export const MakeOfferForm = props => {
  const {
    intl,
    config,
    price,
    stripeConnected,
    errorMessageComponent: ErrorMessage,
    makeOfferError,
    onSubmit,
  } = props;

  const initialValuesMaybe = price ? { offer: price } : {};

  const marketplaceCurrency = config.currency;
  const priceValidators = getPriceValidators(
    config.listingMinimumPriceSubUnits,
    marketplaceCurrency,
    intl
  );

  return (
    <FinalForm
      initialValues={initialValuesMaybe}
      onSubmit={onSubmit}
      render={formRenderProps => {
        const {
          rootClassName,
          className,
          submitButtonWrapperClassName,
          formId,
          handleSubmit,
          inProgress,
          authorDisplayName,
        } = formRenderProps;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = submitInProgress || !stripeConnected;

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SaleDetailsPage">
            <div className={css.section}>
              <Heading as="label" htmlFor={`${formId}offer`} rootClassName={css.sectionHeading}>
                <FormattedMessage
                  id="InitiateNegotiationPage.offerLabel"
                  values={{ authorDisplayName }}
                />
              </Heading>

              <FieldCurrencyInput
                id={`${formId}offer`}
                name="offer"
                className={css.input}
                placeholder={intl.formatMessage(
                  {
                    id: 'InitiateNegotiationPage.offerPlaceholder',
                  },
                  { marketplaceCurrency }
                )}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                validate={priceValidators}
              />
            </div>
            <div className={css.section}>
              <Heading as="h4" rootClassName={css.sectionHeading}>
                <FormattedMessage id="InitiateNegotiationPage.additionalDetails" />
              </Heading>

              <FieldTextInput
                className={css.fieldOfferDetails}
                type="textarea"
                name="offerDetails"
                id={formId ? `${formId}.message` : 'message'}
                label={intl.formatMessage({
                  id: 'InitiateNegotiationPage.offerDetailsLabel',
                })}
                placeholder={intl.formatMessage(
                  {
                    id: 'InitiateNegotiationPage.offerDetailsPlaceholder',
                  },
                  { authorDisplayName }
                )}
              />
            </div>

            <div className={submitButtonWrapperClassName}>
              <ErrorMessage error={makeOfferError} />
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="InitiateNegotiationPage.submitButtonText" />
              </PrimaryButton>
              <FinePrint stripeConnected={stripeConnected} />
            </div>
          </Form>
        );
      }}
    />
  );
};

export default MakeOfferForm;
