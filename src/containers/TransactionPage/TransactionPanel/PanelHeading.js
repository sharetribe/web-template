import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { createSlug, stringify } from '../../../util/urlHelpers';
import { states as productProcessStates } from '../../../util/transactionProcessProduct';

import { NamedLink } from '../../../components';

import css from './TransactionPanel.module.css';

export const HEADING_ENQUIRED = 'enquired';
export const HEADING_PAYMENT_PENDING = 'pending-payment';
export const HEADING_PAYMENT_EXPIRED = 'payment-expired';
export const HEADING_CANCELED = 'canceled';
export const HEADING_PURCHASED = 'purchased';
export const HEADING_DELIVERED = 'delivered';
export const HEADING_DISPUTED = 'disputed';
export const HEADING_RECEIVED = 'received';

const createListingLink = (listingId, label, listingDeleted, searchParams = {}, className = '') => {
  if (!listingDeleted) {
    const params = { id: listingId, slug: createSlug(label) };
    const to = { search: stringify(searchParams) };
    return (
      <NamedLink className={className} name="ListingPage" params={params} to={to}>
        {label}
      </NamedLink>
    );
  } else {
    return <FormattedMessage id="TransactionPanel.deletedListingOrderTitle" />;
  }
};

const ListingDeletedInfoMaybe = props => {
  return props.listingDeleted ? (
    <p className={css.transactionInfoMessage}>
      <FormattedMessage id="TransactionPanel.messageDeletedListing" />
    </p>
  ) : null;
};

const CustomerBannedInfoMaybe = props => {
  return props.isCustomerBanned ? (
    <p className={css.transactionInfoMessage}>
      <FormattedMessage id="TransactionPanel.customerBannedStatus" />
    </p>
  ) : null;
};

const productHeadingStates = {
  // [productProcessStates.INITIAL]: HEADING_ENQUIRED,
  [productProcessStates.ENQUIRY]: HEADING_ENQUIRED,
  [productProcessStates.PENDING_PAYMENT]: HEADING_PAYMENT_PENDING,
  [productProcessStates.PAYMENT_EXPIRED]: HEADING_PAYMENT_EXPIRED,
  [productProcessStates.PURCHASED]: HEADING_PURCHASED,
  [productProcessStates.DELIVERED]: HEADING_DELIVERED,
  [productProcessStates.RECEIVED]: HEADING_RECEIVED,
  [productProcessStates.DISPUTED]: HEADING_DISPUTED,
  [productProcessStates.CANCELED]: HEADING_CANCELED,
  [productProcessStates.COMPLETED]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED_BY_CUSTOMER]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED_BY_PROVIDER]: HEADING_RECEIVED,
};

const headingTranslationId = (panelHeadingState, isCustomer) => {
  // TODO: make the translation key dynamic
  switch (panelHeadingState) {
    case HEADING_ENQUIRED:
      return isCustomer
        ? 'TransactionPanel.orderEnquiredTitle'
        : 'TransactionPanel.saleEnquiredTitle';
    case HEADING_PAYMENT_PENDING:
      return isCustomer
        ? 'TransactionPanel.orderPaymentPendingTitle'
        : 'TransactionPanel.salePaymentPendingTitle';
    case HEADING_PAYMENT_EXPIRED:
      return isCustomer
        ? 'TransactionPanel.orderPaymentExpiredTitle'
        : 'TransactionPanel.salePaymentExpiredTitle';
    case HEADING_PURCHASED:
      return isCustomer
        ? 'TransactionPanel.orderPurchasedTitle'
        : 'TransactionPanel.salePurchasedTitle';
    case HEADING_CANCELED:
      return isCustomer
        ? 'TransactionPanel.orderCanceledTitle'
        : 'TransactionPanel.saleCanceledTitle';
    case HEADING_DELIVERED:
      return isCustomer
        ? 'TransactionPanel.orderDeliveredTitle'
        : 'TransactionPanel.saleDeliveredTitle';
    case HEADING_RECEIVED:
      return isCustomer
        ? 'TransactionPanel.orderReceivedTitle'
        : 'TransactionPanel.saleReceivedTitle';
    case HEADING_DISPUTED:
      return isCustomer
        ? 'TransactionPanel.orderDisputedTitle'
        : 'TransactionPanel.saleDisputedTitle';
    default:
      console.warn('Unknown state given to panel heading.');
      return null;
  }
};

// Functional component as a helper to choose and show Order or Sale heading info:
// title, subtitle, and message
const PanelHeading = props => {
  const {
    className,
    rootClassName,
    processName,
    processState,
    transactionRole,
    customerName,
    listingId,
    listingTitle,
    listingDeleted,
    isCustomerBanned,
  } = props;

  const isCustomer = transactionRole === 'customer';

  const defaultRootClassName = isCustomer ? css.headingOrder : css.headingSale;
  const titleClasses = classNames(rootClassName || defaultRootClassName, className);
  const listingLink = createListingLink(listingId, listingTitle, listingDeleted);

  const productHeadingState = productHeadingStates[processState];
  const panelHeadingState = productHeadingState || 'unknown';

  return (
    <>
      <h1 className={titleClasses}>
        <span className={css.mainTitle}>
          <FormattedMessage
            id={headingTranslationId(panelHeadingState, isCustomer)}
            values={{ customerName, listingLink }}
          />
        </span>
      </h1>
      {isCustomer ? <ListingDeletedInfoMaybe listingDeleted={listingDeleted} /> : null}
      {panelHeadingState === HEADING_PAYMENT_PENDING && !isCustomer ? (
        <p className={css.transactionInfoMessage}>
          <FormattedMessage
            id="TransactionPanel.salePaymentPendingInfo"
            values={{ customerName }}
          />
        </p>
      ) : null}
      {!isCustomer ? <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} /> : null}
    </>
  );
};

export default PanelHeading;
