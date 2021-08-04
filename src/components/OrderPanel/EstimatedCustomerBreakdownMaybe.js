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

import config from '../../config';
import { types as sdkTypes } from '../../util/sdkLoader';
import { timeOfDayFromLocalToTimeZone, getStartOf } from '../../util/dates';
import { TRANSITION_REQUEST_PAYMENT, TX_TRANSITION_ACTOR_CUSTOMER } from '../../util/transaction';
import { DATE_TYPE_DATE } from '../../util/types';
import { unitDivisor, convertMoneyToNumber, convertUnitToSubUnit } from '../../util/currency';

import { OrderBreakdown } from '../../components';

import css from './OrderPanel.module.css';

const { Money, UUID } = sdkTypes;

const estimatedTotalPrice = lineItems => {
  const numericTotalPrice = lineItems.reduce((sum, lineItem) => {
    const numericPrice = convertMoneyToNumber(lineItem.lineTotal);
    return new Decimal(numericPrice).add(sum);
  }, new Decimal(0));

  // All the lineItems should have same currency so we can use the first one to check that
  // In case there are no lineItems we use currency from config.js as default
  const currency =
    lineItems[0] && lineItems[0].unitPrice ? lineItems[0].unitPrice.currency : config.currency;

  return new Money(
    convertUnitToSubUnit(numericTotalPrice.toNumber(), unitDivisor(currency)),
    currency
  );
};

const estimatedBooking = (bookingStart, bookingEnd) => {
  // Server normalizes night/day bookings to start from 00:00 UTC. In this case, it would remove 23 hours.
  // We convert local (start of day) to the same time-of-day in UTC time zone to prevent untracked conversions.
  // local noon -> startOf('day') => 00:00 local
  // => convert to the same time of day to server's tz aka remove timezoneoffset => 00:00 API (UTC)
  const apiTimeZone = 'Etc/UTC';
  const serverDayStart = timeOfDayFromLocalToTimeZone(getStartOf(bookingStart, 'day'), apiTimeZone);
  const serverDayEnd = timeOfDayFromLocalToTimeZone(getStartOf(bookingEnd, 'day'), apiTimeZone);

  return {
    id: new UUID('estimated-booking'),
    type: 'booking',
    attributes: {
      start: serverDayStart,
      end: serverDayEnd,
    },
  };
};

// When we cannot speculatively initiate a transaction (i.e. logged
// out), we must estimate the transaction for booking breakdown. This function creates
// an estimated transaction object for that use case.
//
// We need to use FTW backend to calculate the correct line items through thransactionLineItems
// endpoint so that they can be passed to this estimated transaction.
const estimatedCustomerTransaction = (breakdownData, lineItems) => {
  const { bookingStart, bookingEnd } = breakdownData;
  const now = new Date();
  const customerLineItems = lineItems.filter(item => item.includeFor.includes('customer'));
  const providerLineItems = lineItems.filter(item => item.includeFor.includes('provider'));
  const payinTotal = estimatedTotalPrice(customerLineItems);
  const payoutTotal = estimatedTotalPrice(providerLineItems);

  const bookingMaybe =
    bookingStart && bookingEnd ? { booking: estimatedBooking(bookingStart, bookingEnd) } : {};

  return {
    id: new UUID('estimated-transaction'),
    type: 'transaction',
    attributes: {
      createdAt: now,
      lastTransitionedAt: now,
      lastTransition: TRANSITION_REQUEST_PAYMENT,
      payinTotal,
      payoutTotal,
      lineItems: customerLineItems,
      transitions: [
        {
          createdAt: now,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: TRANSITION_REQUEST_PAYMENT,
        },
      ],
    },
    ...bookingMaybe,
  };
};

const EstimatedCustomerBreakdownMaybe = props => {
  const { unitType, breakdownData = {}, lineItems = [] } = props;
  console.log('estimated breakdown with:', unitType, breakdownData, lineItems);
  const tx = estimatedCustomerTransaction(breakdownData, lineItems);

  return tx ? (
    <OrderBreakdown
      className={css.receipt}
      userRole="customer"
      unitType={unitType}
      transaction={tx}
      booking={tx.booking}
      dateType={DATE_TYPE_DATE}
    />
  ) : null;
};

export default EstimatedCustomerBreakdownMaybe;
