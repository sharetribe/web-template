import React from 'react';
import Decimal from 'decimal.js';
import { fakeIntl, createBooking } from '../../util/test-data';
import { renderDeep } from '../../util/test-helpers';
import { types as sdkTypes } from '../../util/sdkLoader';
import { getProcess, TX_TRANSITION_ACTOR_CUSTOMER } from '../../transactions/transaction';

import { OrderBreakdownComponent } from './OrderBreakdown';

const { UUID, Money } = sdkTypes;

const marketplaceName = 'MarketplaceX';

const exampleTransaction = params => {
  const transitions = getProcess('default-buying-products')?.transitions;
  const created = new Date(Date.UTC(2017, 1, 1));
  return {
    id: new UUID('example-transaction'),
    type: 'transaction',
    attributes: {
      processName: 'default-buying-products',
      processVersion: 1,
      createdAt: created,
      lastTransitionedAt: created,
      lastTransition: transitions.REQUEST_PAYMENT,
      transitions: [
        {
          createdAt: created,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: transitions.REQUEST_PAYMENT,
        },
      ],

      // payinTotal, payoutTotal, and lineItems required in params
      ...params,
    },
  };
};

describe('OrderBreakdown', () => {
  it('data for product marketplace matches snapshot', () => {
    const tree = renderDeep(
      <OrderBreakdownComponent
        userRole="customer"
        currency="USD"
        marketplaceName={marketplaceName}
        transaction={exampleTransaction({
          payinTotal: new Money(3000, 'USD'),
          payoutTotal: new Money(3000, 'USD'),
          lineItems: [
            {
              code: 'line-item/item',
              includeFor: ['customer', 'provider'],
              quantity: new Decimal(2),
              lineTotal: new Money(2000, 'USD'),
              unitPrice: new Money(1000, 'USD'),
              reversal: false,
            },
            {
              code: 'line-item/shipping-fee',
              includeFor: ['customer', 'provider'],
              quantity: new Decimal(1),
              unitPrice: new Money(1000, 'USD'),
              lineTotal: new Money(1000, 'USD'),
              reversal: false,
            },
          ],
        })}
        intl={fakeIntl}
      />
    );
    expect(tree).toMatchSnapshot();
  });

  it('customer transaction data matches snapshot', () => {
    const tree = renderDeep(
      <OrderBreakdownComponent
        userRole="customer"
        currency="USD"
        marketplaceName={marketplaceName}
        transaction={exampleTransaction({
          payinTotal: new Money(2000, 'USD'),
          payoutTotal: new Money(2000, 'USD'),
          lineItems: [
            {
              code: 'line-item/night',
              includeFor: ['customer', 'provider'],
              quantity: new Decimal(2),
              lineTotal: new Money(2000, 'USD'),
              unitPrice: new Money(1000, 'USD'),
              reversal: false,
            },
          ],
        })}
        booking={createBooking('example-booking', {
          start: new Date(Date.UTC(2017, 3, 14)),
          end: new Date(Date.UTC(2017, 3, 16)),
        })}
        intl={fakeIntl}
        timeZone="Etc/UTC"
      />
    );
    expect(tree).toMatchSnapshot();
  });

  it('provider transaction data matches snapshot', () => {
    const tree = renderDeep(
      <OrderBreakdownComponent
        userRole="provider"
        currency="USD"
        marketplaceName={marketplaceName}
        transaction={exampleTransaction({
          payinTotal: new Money(2000, 'USD'),
          payoutTotal: new Money(1800, 'USD'),
          lineItems: [
            {
              code: 'line-item/night',
              includeFor: ['customer', 'provider'],
              quantity: new Decimal(2),
              lineTotal: new Money(2000, 'USD'),
              unitPrice: new Money(1000, 'USD'),
              reversal: false,
            },
            {
              code: 'line-item/provider-commission',
              includeFor: ['provider'],
              lineTotal: new Money(-200, 'USD'),
              unitPrice: new Money(-200, 'USD'),
              reversal: false,
            },
          ],
        })}
        booking={createBooking('example-booking', {
          start: new Date(Date.UTC(2017, 3, 14)),
          end: new Date(Date.UTC(2017, 3, 16)),
        })}
        intl={fakeIntl}
        timeZone="Etc/UTC"
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
