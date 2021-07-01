import React from 'react';

import { injectIntl } from '../../util/reactIntl';
import { createUser, createTransaction } from '../../util/test-data';
import {
  TRANSITION_ENQUIRE,
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_CANCEL_OPERATOR,
  TRANSITION_MARK_DELIVERED,
  TRANSITION_MARK_RECEIVED,
  TRANSITION_DISPUTE,
  TRANSITION_REVIEW_1_BY_CUSTOMER,
  TRANSITION_REVIEW_1_BY_PROVIDER,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
} from '../../util/transaction';
import { LINE_ITEM_UNITS } from '../../util/types';

import { InboxItem, txState } from './InboxPage';

const noop = () => null;

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
  });

const TranslatedInboxItem = props => {
  const { intl, tx, type, ...rest } = props;
  const stateData = txState(intl, tx, type);

  return <InboxItem intl={intl} tx={tx} stateData={stateData} type={type} {...rest} />;
};

export const EnquiryPayment = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_ENQUIRE),
  },
  group: 'page:InboxPage',
};

///////////
// Order //
///////////

export const PendingPayment_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_REQUEST_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Purchased_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_CONFIRM_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Canceled_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_CANCEL_OPERATOR),
  },
  group: 'page:InboxPage',
};

export const Delivered_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_MARK_DELIVERED),
  },
  group: 'page:InboxPage',
};

export const Disputed_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_DISPUTE),
  },
  group: 'page:InboxPage',
};

export const Received_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_MARK_RECEIVED),
  },
  group: 'page:InboxPage',
};

export const ReviewedByCustomer_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_REVIEW_1_BY_CUSTOMER),
  },
  group: 'page:InboxPage',
};

export const ReviewedByProvider_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_REVIEW_1_BY_PROVIDER),
  },
  group: 'page:InboxPage',
};

export const Reviewed_Order = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'order',
    tx: tx(TRANSITION_EXPIRE_REVIEW_PERIOD),
  },
  group: 'page:InboxPage',
};

//////////
// Sale //
//////////

export const PendingPayment_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_REQUEST_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Purchased_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_CONFIRM_PAYMENT),
  },
  group: 'page:InboxPage',
};

export const Canceled_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_CANCEL_OPERATOR),
  },
  group: 'page:InboxPage',
};

export const Delivered_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_MARK_DELIVERED),
  },
  group: 'page:InboxPage',
};

export const Disputed_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_DISPUTE),
  },
  group: 'page:InboxPage',
};

export const Received_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_MARK_RECEIVED),
  },
  group: 'page:InboxPage',
};

export const ReviewedByCustomer_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_REVIEW_1_BY_CUSTOMER),
  },
  group: 'page:InboxPage',
};

export const ReviewedByProvider_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_REVIEW_1_BY_PROVIDER),
  },
  group: 'page:InboxPage',
};

export const Reviewed_Sale = {
  component: injectIntl(TranslatedInboxItem),
  props: {
    unitType: LINE_ITEM_UNITS,
    type: 'sale',
    tx: tx(TRANSITION_EXPIRE_REVIEW_PERIOD),
  },
  group: 'page:InboxPage',
};
