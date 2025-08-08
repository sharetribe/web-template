/**
 * This component will show the booking info and calculated total price.
 * I.e. dates and other details related to payment decision in receipt format.
 */
import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  DATE_TYPE_TIME,
  LINE_ITEM_CUSTOMER_COMMISSION,
  LINE_ITEM_FIXED,
  LINE_ITEM_HOUR,
  LINE_ITEM_PROVIDER_COMMISSION,
  LISTING_UNIT_TYPES,
  propTypes,
} from '../../util/types';

import LineItemBookingPeriod, { BookingPeriod } from './LineItemBookingPeriod'; // [SKYFARER MERGE: +BookingPeriod]
import LineItemBasePriceMaybe from './LineItemBasePriceMaybe';
import LineItemSubTotalMaybe from './LineItemSubTotalMaybe';
import LineItemShippingFeeMaybe from './LineItemShippingFeeMaybe';
import LineItemPickupFeeMaybe from './LineItemPickupFeeMaybe';
import LineItemCustomerCommissionMaybe from './LineItemCustomerCommissionMaybe';
import LineItemCustomerCommissionRefundMaybe from './LineItemCustomerCommissionRefundMaybe';
import LineItemProviderCommissionMaybe from './LineItemProviderCommissionMaybe';
import LineItemProviderCommissionRefundMaybe from './LineItemProviderCommissionRefundMaybe';
import LineItemRefundMaybe from './LineItemRefundMaybe';
import LineItemTotalPrice from './LineItemTotalPrice';
import LineItemUnknownItemsMaybe from './LineItemUnknownItemsMaybe';

import css from './OrderBreakdown.module.css';

export const OrderBreakdownComponent = props => {
  const {
    rootClassName,
    className,
    userRole,
    transaction,
    booking,
    timeZone,
    currency,
    marketplaceName,
    intl,
  } = props;

  const isCustomer = userRole === 'customer';
  const isProvider = userRole === 'provider';
  const allLineItems = transaction.attributes.lineItems || [];
  // We'll show only line-items that are specific for the current userRole (customer vs provider)
  const lineItems = allLineItems.filter(lineItem => lineItem.includeFor.includes(userRole));
  const unitLineItem = lineItems.find(
    item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
  );
  // Line-item code that matches with base unit: day, night, hour, fixed, item
  const lineItemUnitType = unitLineItem?.code;
  const dateType = [LINE_ITEM_HOUR, LINE_ITEM_FIXED].includes(lineItemUnitType)
    ? DATE_TYPE_DATETIME
    : DATE_TYPE_DATE;

  const hasCommissionLineItem = lineItems.find(item => {
    const hasCustomerCommission = isCustomer && item.code === LINE_ITEM_CUSTOMER_COMMISSION;
    const hasProviderCommission = isProvider && item.code === LINE_ITEM_PROVIDER_COMMISSION;
    return (hasCustomerCommission || hasProviderCommission) && !item.reversal;
  });

  const classes = classNames(rootClassName || css.root, className);

  /**
   * OrderBreakdown contains different line items:
   *
   * LineItemBookingPeriod: prints booking start and booking end types. Prop dateType
   * determines if the date and time or only the date is shown
   *
   * LineItemShippingFeeMaybe: prints the shipping fee (combining additional fee of
   * additional items into it).
   *
   * LineItemShippingFeeRefundMaybe: prints the amount of refunded shipping fee
   *
   * LineItemBasePriceMaybe: prints the base price calculation for the listing, e.g.
   * "$150.00 * 2 nights $300"
   *
   * LineItemUnknownItemsMaybe: prints the line items that are unknown. In ideal case there
   * should not be unknown line items. If you are using custom pricing, you should create
   * new custom line items if you need them.
   *
   * LineItemSubTotalMaybe: prints subtotal of line items before possible
   * commission or refunds
   *
   * LineItemRefundMaybe: prints the amount of refund
   *
   * LineItemCustomerCommissionMaybe: prints the amount of customer commission
   * The default transaction process used by this template doesn't include the customer commission.
   *
   * LineItemCustomerCommissionRefundMaybe: prints the amount of refunded customer commission
   *
   * LineItemProviderCommissionMaybe: prints the amount of provider commission
   *
   * LineItemProviderCommissionRefundMaybe: prints the amount of refunded provider commission
   *
   * LineItemTotalPrice: prints total price of the transaction
   *
   */

  return (
    <div className={classes}>
      <LineItemBookingPeriod
        booking={booking}
        code={lineItemUnitType}
        dateType={dateType}
        timeZone={timeZone}
      />

      {/* Adjustment Section */}
      {/* {transaction?.attributes?.metadata?.adjustment && (
        <div className={css.adjustmentSection} style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4, padding: 16, margin: '16px 0' }}>
          <strong>Adjustment</strong>
          <div style={{ marginTop: 8 }}>
            <div>
              <span style={{ fontWeight: 500 }}>Previous hours:</span> {booking?.attributes?.hours ?? 'N/A'}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>Previous price:</span> {typeof booking?.attributes?.price?.amount === 'number' ? (booking.attributes.price.amount / 100).toFixed(2) : 'N/A'}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>New hours:</span> {transaction.attributes.metadata.adjustment.newHours ?? 'N/A'}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>New price:</span> {typeof transaction.attributes.metadata.adjustment.newPrice === 'number' ? (transaction.attributes.metadata.adjustment.newPrice / 100).toFixed(2) : 'N/A'}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>Difference:</span> {typeof transaction.attributes.metadata.adjustment.diff === 'number' ? (transaction.attributes.metadata.adjustment.diff / 100).toFixed(2) : 'N/A'}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>Adjusted at:</span> {transaction.attributes.metadata.adjustment.adjustedAt ? new Date(transaction.attributes.metadata.adjustment.adjustedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      )} */}

      {transaction?.attributes?.metadata?.rescheduleRequest && (
        <div className={css.rescheduleRequest}>
          <p>
            <FormattedMessage id="TransactionPage.default-booking.customer.reschedule-pending.title" />
          </p>

          <BookingPeriod
            startDate={transaction.attributes.metadata.rescheduleRequest.start}
            endDate={transaction.attributes.metadata.rescheduleRequest.end}
            dateType={dateType}
            timeZone={timeZone}
          />
        </div>
      )}

      <LineItemBasePriceMaybe lineItems={lineItems} code={lineItemUnitType} intl={intl} />
      <LineItemShippingFeeMaybe lineItems={lineItems} intl={intl} />
      <LineItemPickupFeeMaybe lineItems={lineItems} intl={intl} />
      <LineItemUnknownItemsMaybe lineItems={lineItems} isProvider={isProvider} intl={intl} />

      <LineItemSubTotalMaybe
        lineItems={lineItems}
        code={lineItemUnitType}
        userRole={userRole}
        intl={intl}
        marketplaceCurrency={currency}
      />
      <LineItemRefundMaybe lineItems={lineItems} intl={intl} marketplaceCurrency={currency} />

      <LineItemCustomerCommissionMaybe
        lineItems={lineItems}
        isCustomer={isCustomer}
        marketplaceName={marketplaceName}
        intl={intl}
      />
      <LineItemCustomerCommissionRefundMaybe
        lineItems={lineItems}
        isCustomer={isCustomer}
        marketplaceName={marketplaceName}
        intl={intl}
      />

      <LineItemProviderCommissionMaybe
        lineItems={lineItems}
        isProvider={isProvider}
        marketplaceName={marketplaceName}
        intl={intl}
      />
      <LineItemProviderCommissionRefundMaybe
        lineItems={lineItems}
        isProvider={isProvider}
        marketplaceName={marketplaceName}
        intl={intl}
      />

      <LineItemTotalPrice transaction={transaction} isProvider={isProvider} intl={intl} />

      {hasCommissionLineItem ? (
        <span className={css.feeInfo}>
          <FormattedMessage id="OrderBreakdown.commissionFeeNote" />
        </span>
      ) : null}
    </div>
  );
};

/**
 * Order breakdown aka receipt
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.marketplaceName
 * @param {string} props.timeZone IANA time zone name
 * @param {string} props.currency E.g. 'USD'
 * @param {'customer' | 'provider'} props.userRole
 * @param {propTypes.transaction} props.transaction
 * @param {propTypes.booking?} props.booking
 * @param {DATE_TYPE_DATE | DATE_TYPE_TIME | DATE_TYPE_DATETIME} props.dateType
 * @returns {JSX.Element} the order breakdown component
 */
const OrderBreakdown = props => {
  const intl = useIntl();
  return <OrderBreakdownComponent intl={intl} {...props} />;
};

export default OrderBreakdown;
