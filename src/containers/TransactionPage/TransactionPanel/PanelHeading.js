import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { createSlug, stringify } from '../../../util/urlHelpers';

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

const Heading = props => {
  const { className, id, values } = props;
  return (
    <h1 className={className}>
      <span className={css.mainTitle}>
        <FormattedMessage id={id} values={values} />
      </span>
    </h1>
  );
};

const CustomerBannedInfoMaybe = props => {
  return props.isCustomerBanned ? (
    <p className={css.transactionInfoMessage}>
      <FormattedMessage id="TransactionPanel.customerBannedStatus" />
    </p>
  ) : null;
};

// Functional component as a helper to choose and show Order or Sale heading info:
// title, subtitle, and message
const PanelHeading = props => {
  const {
    className,
    rootClassName,
    panelHeadingState,
    customerName,
    listingId,
    listingTitle,
    listingDeleted,
    isCustomerBanned,
  } = props;

  const isCustomer = props.transactionRole === 'customer';

  const defaultRootClassName = isCustomer ? css.headingOrder : css.headingSale;
  const titleClasses = classNames(rootClassName || defaultRootClassName, className);
  const listingLink = createListingLink(listingId, listingTitle, listingDeleted);

  switch (panelHeadingState) {
    case HEADING_ENQUIRED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderEnquiredTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.saleEnquiredTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_PAYMENT_PENDING:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderPaymentPendingTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.salePaymentPendingTitle"
            values={{ customerName, listingLink }}
          />
          <p className={css.transactionInfoMessage}>
            <FormattedMessage
              id="TransactionPanel.salePaymentPendingInfo"
              values={{ customerName }}
            />
          </p>
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_PAYMENT_EXPIRED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderPaymentExpiredTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.salePaymentExpiredTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_PURCHASED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderPurchasedTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.salePurchasedTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_CANCELED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderCanceledTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.saleCanceledTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_DELIVERED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderDeliveredTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.saleDeliveredTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_RECEIVED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderReceivedTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.saleReceivedTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    case HEADING_DISPUTED:
      return isCustomer ? (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.orderDisputedTitle"
            values={{ customerName, listingLink }}
          />
          <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
        </>
      ) : (
        <>
          <Heading
            className={titleClasses}
            id="TransactionPanel.saleDisputedTitle"
            values={{ customerName, listingLink }}
          />
          <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
        </>
      );
    default:
      console.warn('Unknown state given to panel heading.');
      return null;
  }
};

export default PanelHeading;
