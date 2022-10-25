import React from 'react';
import { shallow } from 'enzyme';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderShallow, renderDeep } from '../../../util/test-helpers';
import { fakeIntl } from '../../../util/test-data';
import { LINE_ITEM_NIGHT, LISTING_UNIT_TYPES } from '../../../util/types';
import { timeOfDayFromTimeZoneToLocal } from '../../../util/dates';

import { OrderBreakdown } from '../../../components';

import { BookingDatesFormComponent } from './BookingDatesForm';
import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

const { Money } = sdkTypes;

const noop = () => null;
const lineItems = [
  {
    code: 'line-item/night',
    unitPrice: new Money(1099, 'USD'),
    quantity: new Decimal(2),
    includeFor: ['customer', 'provider'],
    lineTotal: new Money(2198, 'USD'),
    reversal: false,
  },
];

describe('BookingDatesForm', () => {
  it('matches snapshot without selected dates', () => {
    const tree = renderShallow(
      <BookingDatesFormComponent
        lineItemUnitType={LINE_ITEM_NIGHT}
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        price={new Money(1099, 'USD')}
        bookingDates={{}}
        startDatePlaceholder="today"
        endDatePlaceholder="tomorrow"
        fetchLineItemsInProgress={false}
        onFetchTransactionLineItems={noop}
        onFetchTimeSlots={noop}
        lineItems={lineItems}
        currency="USD"
        marketplaceName="MarketplaceX"
        processName="default-booking"
        dayCountAvailableForBooking={90}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});

describe('EstimatedCustomerBreakdownMaybe', () => {
  it('renders nothing if nightly is missing start and end date', () => {
    expect(
      renderDeep(
        <EstimatedCustomerBreakdownMaybe
          lineItems={lineItems}
          currency="USD"
          marketplaceName="MarketplaceX"
          processName="default-booking"
        />
      )
    ).toBeFalsy();
  });
  it('renders nothing if nightly is missing end date', () => {
    const data = {
      startDate: new Date(),
    };
    expect(
      renderDeep(
        <EstimatedCustomerBreakdownMaybe
          breakdownData={data}
          lineItems={lineItems}
          currency="USD"
          marketplaceName="MarketplaceX"
          processName="default-booking"
        />
      )
    ).toBeFalsy();
  });
  it('renders breakdown with correct transaction data', () => {
    const startDate = new Date(2017, 3, 14, 0, 0, 0);
    const endDate = new Date(2017, 3, 16, 0, 0, 0);
    const props = {
      breakdownData: {
        startDate,
        endDate,
      },
      lineItems,
      currency: 'USD',
      marketplaceName: 'MarketplaceX',
      processName: 'default-booking',
    };

    const tree = shallow(<EstimatedCustomerBreakdownMaybe {...props} />);
    const breakdown = tree.find(OrderBreakdown);
    const { userRole, transaction, booking } = breakdown.props();
    const unitLineItem = transaction.attributes.lineItems.find(
      item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
    );

    expect(unitLineItem.code).toEqual(LINE_ITEM_NIGHT);
    expect(userRole).toEqual('customer');

    // booking data doesn't get converted inside EstimatedCustomerBreakdownMaybe
    expect(booking.attributes.start).toEqual(startDate);
    expect(booking.attributes.end).toEqual(endDate);

    expect(transaction.attributes.payinTotal).toEqual(new Money(2198, 'USD'));
    expect(transaction.attributes.payoutTotal).toEqual(new Money(2198, 'USD'));
    expect(transaction.attributes.lineItems).toEqual([
      {
        code: 'line-item/night',
        unitPrice: new Money(1099, 'USD'),
        quantity: new Decimal(2),
        includeFor: ['customer', 'provider'],
        lineTotal: new Money(2198, 'USD'),
        reversal: false,
      },
    ]);
  });
});
