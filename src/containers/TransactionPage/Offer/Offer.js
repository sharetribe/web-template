import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { LISTING_UNIT_TYPES } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
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
    intl,
  } = props;

  if (!isNegotiationProcess) {
    return null;
  }

  const isProvider = transactionRole === 'provider';
  const protectedData = transaction?.attributes?.protectedData;

  const latestOfferInSubunits = transaction?.attributes?.offers?.at(-1)?.offerInSubunits;
  const hasLineItems = transaction?.attributes?.lineItems?.length > 0;
  const unitLineItem = hasLineItems
    ? transaction.attributes?.lineItems?.find(
        item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
      )
    : null;

  const currency = transaction?.attributes?.payinTotal?.currency;
  const quote = latestOfferInSubunits
    ? new Money(latestOfferInSubunits, currency)
    : unitLineItem?.lineTotal
    ? unitLineItem.lineTotal
    : null;
  const formattedQuote = quote ? formatMoney(intl, quote) : '';

  const classes = classNames(rootClassName || css.offerContainer, className);
  return quote ? (
    <div className={classes}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="TransactionPage.Offer.heading" />
      </Heading>

      <div className={css.quoteRow}>
        <span className={css.quoteLabel}>
          <FormattedMessage id="TransactionPage.Offer.quoteLabel" />
        </span>
        <FormattedMessage id="TransactionPage.Offer.quote" values={{ quote: formattedQuote }} />
      </div>

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
