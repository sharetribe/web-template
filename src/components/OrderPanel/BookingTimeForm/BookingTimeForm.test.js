import React from 'react';
import { shallow } from 'enzyme';
import Decimal from 'decimal.js';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderShallow, renderDeep } from '../../../util/test-helpers';
import { fakeIntl } from '../../../util/test-data';
import { DATE_TYPE_DATETIME, LINE_ITEM_HOUR, TIME_SLOT_TIME } from '../../../util/types';
import { OrderBreakdown } from '../../../components';
import { BookingTimeFormComponent } from './BookingTimeForm';
import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

const { UUID, Money } = sdkTypes;

const noop = () => null;
const lineItems = [
  {
    code: LINE_ITEM_HOUR,
    unitPrice: new Money(1099, 'USD'),
    units: new Decimal(2),
    includeFor: ['customer', 'provider'],
    lineTotal: new Money(2198, 'USD'),
    reversal: false,
  },
];

const startDateInputProps = {
  name: 'bookingStartDate',
  useMobileMargins: false,
  id: `EmptyDateInputForm.bookingStartDate`,
  label: 'Start Date',
  placeholderText: 'Start date',
  format: v => v,
};

const endDateInputProps = {
  name: 'bookingEndDate',
  useMobileMargins: false,
  id: `EmptyDateInputForm.bookingEndDate`,
  label: 'End Date',
  placeholderText: 'End date',
  format: v => v,
};

const startTimeInputProps = {
  id: `EmptyDateInputForm.bookingStartDate`,
  name: 'bookingStartTime',
  label: 'Start Time',
};
const endTimeInputProps = {
  id: `EmptyDateInputForm.bookingEndDate`,
  name: 'bookingEndTime',
  label: 'End Time',
};

const timeSlots = [
  {
    id: new UUID(1),
    type: 'timeSlot',
    attributes: {
      start: new Date('2019-10-14T09:00:00Z'),
      end: new Date('2019-10-14T10:00:00Z'),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date('2019-10-14T16:00:00Z'),
      end: new Date('2019-10-14T20:00:00Z'),
      type: TIME_SLOT_TIME,
    },
  },
];

const monthlyTimeSlots = {
  '2019-10': {
    timeSlots,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
};

describe('BookingTimeForm', () => {
  it('matches snapshot without selected dates', () => {
    const tree = renderShallow(
      <BookingTimeFormComponent
        price={new Money(1234, 'USD')}
        startDateInputProps={startDateInputProps}
        endDateInputProps={endDateInputProps}
        startTimeInputProps={startTimeInputProps}
        endTimeInputProps={endTimeInputProps}
        timeZone="Etc/UTC"
        siteTitle="MarketplaceX"
        monthlyTimeSlots={monthlyTimeSlots}
        initialValues={{ bookingStartDate: { date: new Date('2019-10-14T00:00:00Z') } }}
        onChange={noop}
        onSubmit={noop}
        onFetchTimeSlots={noop}
        intl={fakeIntl}
        fetchLineItemsInProgress={false}
        onFetchTransactionLineItems={noop}
        lineItems={lineItems}
        dayCountAvailableForBooking={90}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});

describe('EstimatedBreakdownMaybe', () => {
  it('renders nothing if missing start and end date', () => {
    const data = {};
    expect(
      renderDeep(<EstimatedCustomerBreakdownMaybe breakdownData={data} currency="USD" />)
    ).toBeFalsy();
  });
  it('renders nothing if missing end date', () => {
    const data = {
      startDate: new Date(),
    };
    expect(
      renderDeep(<EstimatedCustomerBreakdownMaybe breakdownData={data} currency="USD" />)
    ).toBeFalsy();
  });
  it('renders breakdown with correct transaction data', () => {
    const startDate = new Date(2022, 3, 16, 12, 0, 0);
    const endDate = new Date(2022, 3, 16, 14, 0, 0);
    const data = { startDate, endDate };
    const tree = shallow(
      <EstimatedCustomerBreakdownMaybe
        breakdownData={data}
        lineItems={lineItems}
        currency="USD"
        timeZone="Etc/UTC"
      />
    );
    const breakdown = tree.find(OrderBreakdown);
    const { userRole, transaction, booking, dateType, timeZone } = breakdown.props();

    expect(userRole).toEqual('customer');
    expect(dateType).toEqual(DATE_TYPE_DATETIME);
    expect(timeZone).toEqual('Etc/UTC');

    // booking data doesn't get converted inside EstimatedCustomerBreakdownMaybe
    expect(booking.attributes.start).toEqual(startDate);
    expect(booking.attributes.end).toEqual(endDate);

    expect(transaction.attributes.payinTotal).toEqual(new Money(2198, 'USD'));
    expect(transaction.attributes.payoutTotal).toEqual(new Money(2198, 'USD'));
    expect(transaction.attributes.lineItems).toEqual([
      {
        code: LINE_ITEM_HOUR,
        includeFor: ['customer', 'provider'],
        unitPrice: new Money(1099, 'USD'),
        units: new Decimal(2),
        lineTotal: new Money(2198, 'USD'),
        reversal: false,
      },
    ]);
  });
});
