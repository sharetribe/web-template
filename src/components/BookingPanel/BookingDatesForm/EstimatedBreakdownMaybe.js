/**
 * Booking breakdown estimation
 *
 * Transactions have payment information that can be shown with the
 * BookingBreakdown component. However, when selecting booking
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

import config from '../../../config';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { timeOfDayFromLocalToTimeZone, getStartOf } from '../../../util/dates';
import {
  TRANSITION_REQUEST_PAYMENT,
  TX_TRANSITION_ACTOR_CUSTOMER,
} from '../../../util/transaction';
import { DATE_TYPE_DATE } from '../../../util/types';
import { unitDivisor, convertMoneyToNumber, convertUnitToSubUnit } from '../../../util/currency';

import { BookingBreakdown } from '../../../components';

import css from './BookingDatesForm.module.css';

const { Money, UUID } = sdkTypes;

const estimatedTotalPrice = lineItems => {
  const numericTotalPrice = lineItems.reduce((sum, lineItem) => {
    const numericPrice = convertMoneyToNumber(lineItem.lineTotal);
    return new Decimal(numericPrice).add(sum);
  }, 0);

  // All the lineItems should have same currency so we can use the first one to check that
  // In case there are no lineItems we use currency from config.js as default
  const currency =
    lineItems[0] && lineItems[0].unitPrice ? lineItems[0].unitPrice.currency : config.currency;

  return new Money(
    convertUnitToSubUnit(numericTotalPrice.toNumber(), unitDivisor(currency)),
    currency
  );
};

// When we cannot speculatively initiate a transaction (i.e. logged
// out), we must estimate the transaction for booking breakdown. This function creates
// an estimated transaction object for that use case.
//
// We need to use FTW backend to calculate the correct line items through thransactionLineItems
// endpoint so that they can be passed to this estimated transaction.
const estimatedTransaction = (bookingStart, bookingEnd, lineItems, userRole) => {
  const now = new Date();

  const isCustomer = userRole === 'customer';

  const customerLineItems = lineItems.filter(item => item.includeFor.includes('customer'));
  const providerLineItems = lineItems.filter(item => item.includeFor.includes('provider'));

  const payinTotal = estimatedTotalPrice(customerLineItems);
  const payoutTotal = estimatedTotalPrice(providerLineItems);

  // Server normalizes night/day bookings to start from 00:00 UTC. In this case, it would remove 23 hours.
  // We convert local (start of day) to the same time-of-day in UTC time zone to prevent untracked conversions.
  // local noon -> startOf('day') => 00:00 local
  // => convert to the same time of day to server's tz aka remove timezoneoffset => 00:00 API (UTC)
  const apiTimeZone = 'Etc/UTC';
  const serverDayStart = timeOfDayFromLocalToTimeZone(getStartOf(bookingStart, 'day'), apiTimeZone);
  const serverDayEnd = timeOfDayFromLocalToTimeZone(getStartOf(bookingEnd, 'day'), apiTimeZone);

  return {
    id: new UUID('estimated-transaction'),
    type: 'transaction',
    attributes: {
      createdAt: now,
      lastTransitionedAt: now,
      lastTransition: TRANSITION_REQUEST_PAYMENT,
      payinTotal,
      payoutTotal,
      lineItems: isCustomer ? customerLineItems : providerLineItems,
      transitions: [
        {
          createdAt: now,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: TRANSITION_REQUEST_PAYMENT,
        },
      ],
    },
    booking: {
      id: new UUID('estimated-booking'),
      type: 'booking',
      attributes: {
        start: serverDayStart,
        end: serverDayEnd,
      },
    },
  };
};

const EstimatedBreakdownMaybe = props => {
  const { unitType, startDate, endDate } = props.orderData;
  const lineItems = props.lineItems;

  // Currently the estimated breakdown is used only on ListingPage where we want to
  // show the breakdown for customer so we can use hard-coded value here
  const userRole = 'customer';

  const tx =
    startDate && endDate && lineItems
      ? estimatedTransaction(startDate, endDate, lineItems, userRole)
      : null;

  return tx ? (
    <BookingBreakdown
      className={css.receipt}
      userRole={userRole}
      unitType={unitType}
      transaction={tx}
      booking={tx.booking}
      dateType={DATE_TYPE_DATE}
    />
  ) : null;
};

export default EstimatedBreakdownMaybe;
