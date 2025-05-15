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
import React, { useEffect } from 'react';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { LINE_ITEM_DAY, LINE_ITEM_NIGHT, LISTING_UNIT_TYPES } from '../../util/types';
import { unitDivisor, convertMoneyToNumber, convertUnitToSubUnit, formatMoney } from '../../util/currency';
import { getProcess, TX_TRANSITION_ACTOR_CUSTOMER } from '../../transactions/transaction';

import { OrderBreakdown } from '../../components';

import css from './OrderPanel.module.css';

import { differenceInCalendarDays } from 'date-fns'; // If not already imported


const { Money, UUID } = sdkTypes;

// Add DOM-based logging
const domLog = (label, data) => {
  // Commenting out DOM logging to prevent browser display
  // if (typeof document === 'undefined') return;
  
  // const logDiv = document.getElementById('debug-log') || (() => {
  //   const div = document.createElement('div');
  //   div.id = 'debug-log';
  //   div.style.cssText = 'position: fixed; bottom: 0; right: 0; max-height: 200px; overflow: auto; background: white; border: 1px solid black; padding: 10px; z-index: 9999; font-family: monospace;';
  //   document.body.appendChild(div);
  //   return div;
  // })();

  // const entry = document.createElement('div');
  // entry.style.borderBottom = '1px solid #eee';
  // entry.innerHTML = `
  //   <strong>${new Date().toISOString()} - ${label}</strong><br/>
  //   <pre>${JSON.stringify(data, (key, value) => {
  //     if (value instanceof Money) {
  //       return `Money(${value.amount}, ${value.currency})`;
  //     }
  //     return value;
  //   }, 2)}</pre>
  // `;
  // logDiv.insertBefore(entry, logDiv.firstChild);
};

const debugLog = (label, data) => {
  try {
    window._debug = window._debug || [];
    const logEntry = {
      timestamp: new Date().toISOString(),
      label,
      data: JSON.stringify(data, (key, value) => {
        if (value instanceof Money) {
          return `Money(${value.amount}, ${value.currency})`;
        }
        return value;
      }, 2)
    };
    window._debug.push(logEntry);
    window.console.log(`[DEBUG] ${label}:`, data);
    // domLog(label, data); // Commenting out DOM logging
  } catch (e) {
    window.console.error('Debug logging failed:', e);
    // domLog('Error', e.toString()); // Commenting out DOM logging
  }
};

// Add global error handler for Money type issues
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    if (msg.includes('Money type')) {
      debugLog('Money Type Error', {
        message: msg,
        url,
        lineNo,
        columnNo,
        error: error?.toString(),
        stack: error?.stack
      });
    }
    return false;
  };
}

// Add SDK validation
const validateSDK = () => {
  debugLog('Validating SDK', {
    sdkTypes,
    Money: sdkTypes.Money,
    isMoneyDefined: typeof Money === 'function',
    MoneyPrototype: Money?.prototype
  });

  if (!sdkTypes || typeof Money !== 'function') {
    debugLog('SDK Error', 'SDK or Money constructor not properly initialized');
    return false;
  }
  return true;
};

// Update Money validation
const validateMoneyObject = (obj, context) => {
  if (!validateSDK()) {
    return false;
  }

  debugLog(`Validating Money (${context})`, {
    value: obj,
    type: obj?.constructor?.name,
    isMoneyInstance: obj instanceof Money,
    hasAmount: obj?.amount !== undefined,
    hasCurrency: obj?.currency !== undefined,
    moneyConstructor: Money?.toString()
  });

  if (!obj) {
    debugLog(`Invalid Money (${context})`, 'null or undefined');
    return false;
  }

  if (!(obj instanceof Money)) {
    // Try to coerce to Money if it has the right shape
    if (obj && typeof obj === 'object' && typeof obj.amount === 'number' && typeof obj.currency === 'string') {
      debugLog(`Attempting to coerce to Money (${context})`, obj);
      try {
        return new Money(obj.amount, obj.currency);
      } catch (e) {
        debugLog(`Coercion failed (${context})`, e.toString());
        return false;
      }
    }
    debugLog(`Invalid Money (${context})`, 'not a Money instance and cannot be coerced');
    return false;
  }

  return true;
};

const estimatedTotalPrice = (lineItems, marketplaceCurrency) => {
  // Log incoming data
  console.log('🔍 Debugging estimatedTotalPrice input:');
  console.log('Line items:', lineItems);
  console.log('Marketplace currency:', marketplaceCurrency);

  debugLog('estimatedTotalPrice input', {
    lineItems,
    marketplaceCurrency
  });

  const numericTotalPrice = lineItems.reduce((sum, lineItem) => {
    // Validate each lineItem's lineTotal
    console.log('🔍 Debugging lineItem.lineTotal:');
    console.log('Is Money instance:', lineItem.lineTotal instanceof Money);
    console.log('Object details:', lineItem.lineTotal);
    
    validateMoneyObject(lineItem.lineTotal, 'lineItem.lineTotal');
    const numericPrice = convertMoneyToNumber(lineItem.lineTotal);
    return new Decimal(numericPrice).add(sum);
  }, new Decimal(0));

  const currency =
    lineItems[0] && lineItems[0].unitPrice ? lineItems[0].unitPrice.currency : marketplaceCurrency;

  const result = new Money(
    convertUnitToSubUnit(numericTotalPrice.toNumber(), unitDivisor(currency)),
    currency
  );

  // Log result
  console.log('🔍 Debugging estimatedTotalPrice result:');
  console.log('Is Money instance:', result instanceof Money);
  console.log('Object details:', result);

  debugLog('estimatedTotalPrice result', result);
  return result;
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

// Add robust Money validation and coercion helpers
const isMoney = obj => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.amount === 'number' &&
    !isNaN(obj.amount) &&
    typeof obj.currency === 'string' &&
    obj.currency.length > 0
  );
};

const ensureMoney = (value, currency, fallbackAmount = 0) => {
  if (value instanceof Money) {
    return value;
  }
  if (isMoney(value)) {
    return new Money(Math.round(value.amount), value.currency);
  }
  if (typeof value === 'number' && !isNaN(value)) {
    return new Money(Math.round(value), currency);
  }
  console.error('Failed to coerce value to Money:', { value, currency });
  return new Money(fallbackAmount, currency);
};

const formatMoneySafely = (intl, money, fallbackText = 'Price unavailable') => {
  try {
    console.log('🔍 Debugging price formatting in EstimatedCustomerBreakdownMaybe:');
    console.log('Is Money instance:', money instanceof Money);
    console.log('Object details:', money);
    console.log('Money constructor:', Money);

    debugLog('Formatting money', {
      input: money,
      isMoneyInstance: money instanceof Money,
      amount: money?.amount,
      currency: money?.currency
    });

    // If it's not a Money instance but has the right shape, try to convert it
    if (!(money instanceof Money) && money?.amount !== undefined && money?.currency) {
      console.log('Attempting to convert to Money instance:', money);
      money = new Money(money.amount, money.currency);
    }

    if (!(money instanceof Money)) {
      throw new Error('Not a valid Money instance');
    }

    const formatted = formatMoney(intl, money);
    console.log('Money formatted successfully:', { input: money, output: formatted });
    debugLog('Money formatted successfully', { input: money, output: formatted });
    return formatted;
  } catch (e) {
    console.error('Money formatting failed:', e);
    debugLog('Money formatting failed', { error: e.toString(), input: money });
    return fallbackText;
  }
};

const EstimatedCustomerBreakdownMaybe = props => {
  const intl = useIntl();
  useEffect(() => {
    validateSDK();
    // debugLog('EstimatedCustomerBreakdownMaybe mounted', {
    //   props,
    //   sdkTypes,
    //   Money: sdkTypes.Money
    // });
  }, []);

  try {
    const { breakdownData = {}, lineItems, timeZone, currency, marketplaceName, processName } = props;
    const { startDate, endDate } = breakdownData;

    debugLog('Processing props', { lineItems, currency });

    if (!lineItems?.length) {
      debugLog('No line items', null);
      return null;
    }

    // Find the unit line item and validate it
    const unitLineItem = lineItems.find(
      item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
    );
    
    if (!unitLineItem) {
      debugLog('No unit line item found', null);
      return null;
    }

    debugLog('Unit line item', {
      code: unitLineItem.code,
      unitPrice: unitLineItem.unitPrice,
      isValid: validateMoneyObject(unitLineItem.unitPrice, 'unitLineItem.unitPrice')
    });

    const lineItemUnitType = unitLineItem.code;
    const numberOfDays = startDate && endDate ? differenceInCalendarDays(endDate, startDate) : 0;

    // Early return if invalid booking duration
    if (numberOfDays <= 0) {
      debugLog('Invalid booking duration', { startDate, endDate, numberOfDays });
      return null;
    }

    // Remove all frontend discount logic. Only use the provided lineItems.
    let adjustedLineItems = lineItems;

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

    const shouldHaveBooking = [LINE_ITEM_DAY, LINE_ITEM_NIGHT].includes(lineItemUnitType);
    const hasLineItems = lineItems && lineItems.length > 0;
    const hasRequiredBookingData = !shouldHaveBooking || (startDate && endDate);

    const tx =
      hasLineItems && hasRequiredBookingData
        ? estimatedCustomerTransaction(
            adjustedLineItems,
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
        timeZone={timeZone}
        currency={currency}
        marketplaceName={marketplaceName}
      />
    ) : null;
  } catch (error) {
    debugLog('Component Error', {
      error: error?.toString(),
      stack: error?.stack
    });
    return null;
  }
};

export default EstimatedCustomerBreakdownMaybe;
