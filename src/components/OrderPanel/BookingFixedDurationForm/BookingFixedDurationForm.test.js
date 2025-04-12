import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { LINE_ITEM_FIXED } from '../../../util/types';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

const { Money } = sdkTypes;
const { screen, within } = testingLibrary;

const lineItems = [
  {
    code: LINE_ITEM_FIXED,
    unitPrice: new Money(1099, 'USD'),
    quantity: new Decimal(2),
    includeFor: ['customer', 'provider'],
    lineTotal: new Money(2198, 'USD'),
    reversal: false,
  },
];

describe('EstimatedBreakdownMaybe', () => {
  it('renders nothing if missing start date', () => {
    const data = {};
    const tree = render(
      <EstimatedCustomerBreakdownMaybe
        breakdownData={data}
        lineItems={[]}
        currency="USD"
        marketplaceName="MarketplaceX"
        processName="default-booking"
      />
    );
    expect(tree.asFragment().firstChild).toBeFalsy();
  });

  it('renders breakdown with correct transaction data', () => {
    const startDate = new Date(Date.UTC(2022, 3, 16, 12, 0, 0));
    const endDate = new Date(Date.UTC(2022, 3, 16, 14, 45, 0));
    const data = { startDate, endDate };
    render(
      <EstimatedCustomerBreakdownMaybe
        breakdownData={data}
        lineItems={lineItems}
        currency="USD"
        timeZone="Etc/UTC"
        marketplaceName="MarketplaceX"
        processName="default-booking"
      />
    );

    const bookingStart = screen.getByText('OrderBreakdown.bookingStart');
    expect(bookingStart).toBeInTheDocument();
    const bookingStartInfo = within(bookingStart.parentNode.parentNode);
    expect(bookingStartInfo.getByText('Sat 12:00 PM')).toBeInTheDocument();
    expect(bookingStartInfo.getByText('Apr 16')).toBeInTheDocument();

    const bookingEnd = screen.getByText('OrderBreakdown.bookingEnd');
    expect(bookingEnd).toBeInTheDocument();
    const bookingEndInfo = within(bookingEnd.parentNode.parentNode);
    expect(bookingEndInfo.getByText('Sat 2:45 PM')).toBeInTheDocument();
    expect(bookingEndInfo.getByText('Apr 16')).toBeInTheDocument();

    const baseUnitNight = screen.getByText('OrderBreakdown.baseUnitFixedBooking');
    expect(baseUnitNight).toBeInTheDocument();
    const baseUnitNightInfo = within(baseUnitNight.parentNode.parentNode);
    expect(baseUnitNightInfo.getByText('$21.98')).toBeInTheDocument();

    const total = screen.getByText('OrderBreakdown.total');
    expect(total).toBeInTheDocument();
    const totalPayIn = within(total.parentNode.parentNode);
    expect(totalPayIn.getByText('$21.98')).toBeInTheDocument();
  });
});
