import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { LISTING_UNIT_TYPES } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
import { getProcess, resolveLatestProcessName } from '../../../transactions/transaction';

import { Heading } from '../../../components';

import TextMaybe from '../TextMaybe/TextMaybe';
import css from './Offer.module.css';

const { Money } = sdkTypes;

// Functional component as a helper to build ActivityFeed section
const Offer = props => {
  const {
    className,
    rootClassName,
    transaction,
    transactionRole,
    isNegotiationProcess,
    isRegularNegotiation,
    intl,
  } = props;

  if (!isNegotiationProcess) {
    return null;
  }

  const isProvider = transactionRole === 'provider';
  const protectedData = transaction?.attributes?.protectedData;
  const offers = transaction?.attributes?.metadata?.offers;

  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  let process = null;
  try {
    process = processName ? getProcess(processName) : null;
  } catch (error) {
    // Process was not recognized!
    return null;
  }

  const hasLineItems = transaction?.attributes?.lineItems?.length > 0;
  const unitLineItem = hasLineItems
    ? transaction.attributes?.lineItems?.find(
        item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
      )
    : null;

  // If the customer has made a counter offer,
  // we show the previous offer (that was in pending-offer state) as a quote
  const isCustomerCounterOffer =
    transaction?.attributes?.lastTransition === process.transitions.CUSTOMER_MAKE_COUNTER_OFFER;
  const previousOfferInSubunits = offers?.at(-2)?.offerInSubunits;
  const currency = transaction?.attributes?.payinTotal?.currency;

  const previousOffer =
    isCustomerCounterOffer && previousOfferInSubunits
      ? new Money(previousOfferInSubunits, currency)
      : null;
  const formattedPreviousOffer = previousOffer ? formatMoney(intl, previousOffer) : '';
  const currentOffer = unitLineItem?.lineTotal ? unitLineItem.lineTotal : null;
  const formattedCurrentOffer = currentOffer ? formatMoney(intl, currentOffer) : '';

  const classes = classNames(rootClassName || css.offerContainer, className, {
    [css.reducedMargin]: isRegularNegotiation,
  });
  return formattedCurrentOffer ? (
    <div className={classes}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="TransactionPage.Offer.heading" />
      </Heading>

      {isCustomerCounterOffer ? (
        <>
          <div className={css.quoteRow}>
            <span className={css.quoteLabel}>
              <FormattedMessage id="TransactionPage.Offer.quoteLabel" />
            </span>
            <s>
              <FormattedMessage
                id="TransactionPage.Offer.quote"
                values={{ quote: formattedPreviousOffer }}
              />
            </s>
          </div>

          <div className={css.counterOfferRow}>
            <span className={css.quoteLabel}>
              <FormattedMessage id="TransactionPage.Offer.counterOfferLabel" />
            </span>
            <FormattedMessage
              id="TransactionPage.Offer.quote"
              values={{ quote: formattedCurrentOffer }}
            />
          </div>
        </>
      ) : (
        <div className={css.quoteRow}>
          <span className={css.quoteLabel}>
            <FormattedMessage id="TransactionPage.Offer.quoteLabel" />
          </span>
          <FormattedMessage
            id="TransactionPage.Offer.quote"
            values={{ quote: formattedCurrentOffer }}
          />
        </div>
      )}

      <TextMaybe
        heading={intl.formatMessage({ id: 'TransactionPage.Offer.providerDefaultMessageLabel' })}
        headingClassName={css.defaultMessageLabel}
        text={protectedData?.providerDefaultMessage}
        isOwn={isNegotiationProcess && isProvider}
        showText={isNegotiationProcess}
      />
    </div>
  ) : null;
};

export default Offer;
