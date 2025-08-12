import React from 'react';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import { injectIntl } from '../../util/reactIntl';
import { createUser, createListing, createTransaction } from '../../util/testData';
import { LINE_ITEM_ITEM } from '../../util/types';
import { getProcess } from '../../transactions/transaction';

import { getStateData } from './InboxPage.stateData';
import { InboxItem } from './InboxPage';

const noop = () => null;
const { Money } = sdkTypes;
const transitions = getProcess('default-purchase')?.transitions;

const lineItems = [
  {
    code: LINE_ITEM_ITEM,
    includeFor: ['customer', 'provider'],
    quantity: new Decimal(1),
    unitPrice: new Money(1000, 'USD'),
    lineTotal: new Money(1000, 'USD'),
    reversal: false,
  },
  {
    code: 'line-item/provider-commission',
    includeFor: ['provider'],
    unitPrice: new Money(100 * -1, 'USD'),
    lineTotal: new Money(100 * -1, 'USD'),
    reversal: false,
  },
];

const tx = lastTransition =>
  createTransaction({
    id: 'order-1',
    lastTransition,
    lastTransitionedAt: new Date(Date.UTC(2017, 0, 15)),
    customer: createUser('John Customer', {
      banned: false,
      deleted: false,
      profile: {
        displayName: 'John C',
        abbreviatedName: 'JC',
      },
    }),
    provider: createUser('Jane Provider', {
      banned: false,
      deleted: false,
      profile: {
        displayName: 'Jane P',
        abbreviatedName: 'JP',
      },
    }),
    listing: createListing('ItemX', {
      publicData: {
        listingType: 'product-selling',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    }),
    lineItems,
  });

const TranslatedInboxItem = props => {
  const { intl, tx, transactionRole, ...rest } = props;
  const stateData = getStateData({ transaction: tx, transactionRole });

  return (
    <InboxItem
      intl={intl}
      tx={tx}
      stateData={stateData}
      transactionRole={transactionRole}
      {...rest}
    />
  );
};

export const InquiryPayment = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.INQUIRE),
  },
  group: 'page:InboxPage',
};

///////////
// Order //
///////////

export const PendingPayment_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.REQUEST_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Purchased_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.CONFIRM_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Canceled_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.CANCEL),
  },
  group: 'page:InboxPage',
};

export const Delivered_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.MARK_DELIVERED),
  },
  group: 'page:InboxPage',
};

export const Disputed_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.DISPUTE),
  },
  group: 'page:InboxPage',
};

export const Received_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.MARK_RECEIVED),
  },
  group: 'page:InboxPage',
};

export const ReviewedByCustomer_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.REVIEW_1_BY_CUSTOMER),
  },
  group: 'page:InboxPage',
};

export const ReviewedByProvider_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.REVIEW_1_BY_PROVIDER),
  },
  group: 'page:InboxPage',
};

export const Reviewed_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: tx(transitions.EXPIRE_REVIEW_PERIOD),
  },
  group: 'page:InboxPage',
};

//////////
// Sale //
//////////

export const PendingPayment_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.REQUEST_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Purchased_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.CONFIRM_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Canceled_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.CANCEL),
  },
  group: 'page:InboxPage',
};

export const Delivered_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.MARK_DELIVERED),
  },
  group: 'page:InboxPage',
};

export const Disputed_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.DISPUTE),
  },
  group: 'page:InboxPage',
};

export const Received_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.MARK_RECEIVED),
  },
  group: 'page:InboxPage',
};

export const ReviewedByCustomer_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.REVIEW_1_BY_CUSTOMER),
  },
  group: 'page:InboxPage',
};

export const ReviewedByProvider_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.REVIEW_1_BY_PROVIDER),
  },
  group: 'page:InboxPage',
};

export const Reviewed_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: tx(transitions.EXPIRE_REVIEW_PERIOD),
  },
  group: 'page:InboxPage',
};

///////////////
// Negotiation //
///////////////

// Get negotiation process transitions
const negotiationTransitions = getProcess('default-negotiation')?.transitions;

// Create negotiation transaction with different listing type
const negotiationTx = lastTransition =>
  createTransaction({
    id: 'negotiation-1',
    processName: 'default-negotiation',
    processVersion: 1,
    lastTransition,
    lastTransitionedAt: new Date(Date.UTC(2017, 0, 15)),
    customer: createUser('John Customer', {
      banned: false,
      deleted: false,
      profile: {
        displayName: 'John C',
        abbreviatedName: 'JC',
      },
    }),
    provider: createUser('Jane Provider', {
      banned: false,
      deleted: false,
      profile: {
        displayName: 'Jane P',
        abbreviatedName: 'JP',
      },
    }),
    listing: createListing('RequestX', {
      publicData: {
        listingType: 'request',
        transactionProcessAlias: 'default-negotiation/release-1',
        unitType: 'request',
      },
    }),
    lineItems,
  });

// Forward mode examples (customer initiates)
export const Negotiation_QuoteRequested = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: negotiationTx(negotiationTransitions.REQUEST_QUOTE),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferPending = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.MAKE_OFFER_FROM_QUOTE_REQUESTED),
  },
  group: 'page:InboxPage',
};

// Reverse mode examples (provider initiates)
export const Negotiation_Inquiry = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.INQUIRE),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferPendingReverse = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.MAKE_OFFER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferPendingAfterInquiry = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.MAKE_OFFER_AFTER_INQUIRY),
  },
  group: 'page:InboxPage',
};

// Counter offer examples
export const Negotiation_CustomerCounterOfferPending = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: negotiationTx(negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_ProviderCounterOfferPending = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.PROVIDER_MAKE_COUNTER_OFFER),
  },
  group: 'page:InboxPage',
};

// Offer rejection examples
export const Negotiation_OfferRejectedCustomer = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: negotiationTx(negotiationTransitions.CUSTOMER_REJECT_OFFER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferRejectedProvider = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.PROVIDER_WITHDRAW_OFFER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferRejectedOperator = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.OPERATOR_REJECT_OFFER),
  },
  group: 'page:InboxPage',
};

// Payment examples
export const Negotiation_PendingPayment = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_PaymentExpired = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.EXPIRE_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Negotiation_OfferAccepted = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.CONFIRM_PAYMENT),
  },
  group: 'page:InboxPage',
};

// Delivery examples
export const Negotiation_Delivered = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.DELIVER),
  },
  group: 'page:InboxPage',
};

export const Negotiation_ChangesRequested = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'provider',
    tx: negotiationTx(negotiationTransitions.REQUEST_CHANGES),
  },
  group: 'page:InboxPage',
};

export const Negotiation_ChangesDelivered = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.DELIVER_CHANGES),
  },
  group: 'page:InboxPage',
};

// Completion examples
export const Negotiation_Completed = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.ACCEPT_DELIVERABLE),
  },
  group: 'page:InboxPage',
};

// Cancellation examples
export const Negotiation_Canceled = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.OPERATOR_CANCEL),
  },
  group: 'page:InboxPage',
};

export const Negotiation_AutoCanceled = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    transactionRole: 'customer',
    tx: negotiationTx(negotiationTransitions.AUTO_CANCEL),
  },
  group: 'page:InboxPage',
};
