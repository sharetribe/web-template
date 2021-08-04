import React from 'react';
import { shallow } from 'enzyme';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderShallow, renderDeep } from '../../../util/test-helpers';
import { fakeIntl } from '../../../util/test-data';
import { LINE_ITEM_NIGHT } from '../../../util/types';
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
        unitType={LINE_ITEM_NIGHT}
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        price={new Money(1099, 'USD')}
        bookingDates={{}}
        startDatePlaceholder="today"
        endDatePlaceholder="tomorrow"
        fetchLineItemsInProgress={false}
        onFetchTransactionLineItems={noop}
        lineItems={lineItems}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});

describe('EstimatedCustomerBreakdownMaybe', () => {
  it('renders breakdown with correct transaction data', () => {
    const bookingStart = new Date(2017, 3, 14, 0, 0, 0);
    const bookingEnd = new Date(2017, 3, 16, 0, 0, 0);
    const props = {
      unitType: LINE_ITEM_NIGHT,
      breakdownData: {
        bookingStart,
        bookingEnd,
      },
      lineItems,
    };

    const tree = shallow(<EstimatedCustomerBreakdownMaybe {...props} />);
    const breakdown = tree.find(OrderBreakdown);
    const { userRole, unitType, transaction, booking } = breakdown.props();

    expect(userRole).toEqual('customer');
    expect(unitType).toEqual(LINE_ITEM_NIGHT);

    // Local time-of-day (startDate) is converted to server's time-of-day (booking.attributes.start)
    // and it's then verified that it's actually UTC time.
    expect(booking.attributes.start).toEqual(new Date(Date.UTC(2017, 3, 14)));
    expect(booking.attributes.end).toEqual(new Date(Date.UTC(2017, 3, 16)));

    // Server's time-of-day for day-based booking times matches the original local time-of-day
    expect(timeOfDayFromTimeZoneToLocal(booking.attributes.start, 'Etc/UTC')).toEqual(bookingStart);
    expect(timeOfDayFromTimeZoneToLocal(booking.attributes.end, 'Etc/UTC')).toEqual(bookingEnd);

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
