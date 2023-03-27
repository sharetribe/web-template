/**
 * Booking breakdown estimation
 *
 * Transactions have payment information that can be shown with the
 * OrderBreakdown component. However, when selecting booking
 * details, there is no transaction object present and we have to
 * estimate the breakdown of the transaction without data from the
 * API.
 *
 * If the payment process of a customized marketplace is something
 * else than simply daily or nightly bookings, the estimation will
 * most likely need some changes.
 *
 * To customize the estimation, first change the BookingDatesForm to
 * collect all booking information from the user (in addition to the
 * default date pickers), and provide that data to the
 * EstimatedBreakdownMaybe components. You can then make customization
 * within this file to create a fake transaction object that
 * calculates the breakdown information correctly according to the
 * process.
 *
 * In the future, the optimal scenario would be to use the same
 * transactions.initiateSpeculative API endpoint as the CheckoutPage
 * is using to get the breakdown information from the API, but
 * currently the API doesn't support that for logged out users, and we
 * are forced to estimate the information here.
 */
import React from 'react';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import { FormattedMessage } from '../../util/reactIntl';
import {
  DATE_TYPE_DATE,
  LINE_ITEM_DAY,
  LINE_ITEM_NIGHT,
  LINE_ITEM_HOUR,
  LISTING_UNIT_TYPES,
  DATE_TYPE_DATETIME,
} from '../../util/types';
import { unitDivisor, convertMoneyToNumber, convertUnitToSubUnit } from '../../util/currency';
import { getProcess, TX_TRANSITION_ACTOR_CUSTOMER } from '../../transactions/transaction';

import { OrderBreakdown } from '../../components';

import css from './OrderPanel.module.css';

const { Money, UUID } = sdkTypes;

const estimatedTotalPrice = (lineItems, marketplaceCurrency) => {
  const numericTotalPrice = lineItems.reduce((sum, lineItem) => {
    const numericPrice = convertMoneyToNumber(lineItem.lineTotal);
    return new Decimal(numericPrice).add(sum);
  }, new Decimal(0));

  // All the lineItems should have same currency so we can use the first one to check that
  // In case there are no lineItems we use currency from config.js as default
  const currency =
    lineItems[0] && lineItems[0].unitPrice ? lineItems[0].unitPrice.currency : marketplaceCurrency;

  return new Money(
    convertUnitToSubUnit(numericTotalPrice.toNumber(), unitDivisor(currency)),
    currency
  );
};

const estimatedBooking = (bookingStart, bookingEnd, lineItemUnitType, timeZone = 'Etc/UTC') => {
  const duration = { start: bookingStart, end: bookingEnd };

  return {
    id: new UUID('estimated-booking'),
    type: 'booking',
    attributes: {
      ...duration,
    },
  };
};

// When we cannot speculatively initiate a transaction (i.e. logged
// out), we must estimate the transaction for booking breakdown. This function creates
// an estimated transaction object for that use case.
//
// We need to use the Template's backend to calculate the correct line items through thransactionLineItems
// endpoint so that they can be passed to this estimated transaction.
const estimatedCustomerTransaction = (
  lineItems,
  bookingStart,
  bookingEnd,
  lineItemUnitType,
  timeZone,
  process,
  processName,
  marketplaceCurrency
) => {
  const transitions = process?.transitions;
  const now = new Date();
  const customerLineItems = lineItems.filter(item => item.includeFor.includes('customer'));
  const providerLineItems = lineItems.filter(item => item.includeFor.includes('provider'));
  const payinTotal = estimatedTotalPrice(customerLineItems, marketplaceCurrency);
  const payoutTotal = estimatedTotalPrice(providerLineItems, marketplaceCurrency);

  const bookingMaybe =
    bookingStart && bookingEnd
      ? { booking: estimatedBooking(bookingStart, bookingEnd, lineItemUnitType, timeZone) }
      : {};

  return {
    id: new UUID('estimated-transaction'),
    type: 'transaction',
    attributes: {
      createdAt: now,
      processName,
      lastTransitionedAt: now,
      lastTransition: transitions.REQUEST_PAYMENT,
      payinTotal,
      payoutTotal,
      lineItems: customerLineItems,
      transitions: [
        {
          createdAt: now,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: transitions.REQUEST_PAYMENT,
        },
      ],
    },
    ...bookingMaybe,
  };
};

const EstimatedCustomerBreakdownMaybe = props => {
  const { breakdownData = {}, lineItems, timeZone, currency, marketplaceName, processName } = props;
  const { startDate, endDate } = breakdownData;

  let process = null;
  try {
    process = getProcess(processName);
  } catch (e) {
    return (
      <div className={css.error}>
        <FormattedMessage id="OrderPanel.unknownTransactionProcess" />
      </div>
    );
  }

  const unitLineItem = lineItems?.find(
    item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
  );
  const lineItemUnitType = unitLineItem?.code;
  const shouldHaveBooking = [LINE_ITEM_DAY, LINE_ITEM_NIGHT].includes(lineItemUnitType);
  const hasLineItems = lineItems && lineItems.length > 0;
  const hasRequiredBookingData = !shouldHaveBooking || (startDate && endDate);
  const dateType = lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;
  const tx =
    hasLineItems && hasRequiredBookingData
      ? estimatedCustomerTransaction(
          lineItems,
          startDate,
          endDate,
          lineItemUnitType,
          timeZone,
          process,
          processName,
          currency
        )
      : null;

  return tx ? (
    <OrderBreakdown
      className={css.receipt}
      userRole="customer"
      transaction={tx}
      booking={tx.booking}
      dateType={dateType}
      timeZone={timeZone}
      currency={currency}
      marketplaceName={marketplaceName}
    />
  ) : null;
};

export default EstimatedCustomerBreakdownMaybe;
