import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import {
  hasAvailabilityOrCheckoutOnDay,
  getFirstAvailableDate,
} from './BookingDatesForm';

const { Money } = sdkTypes;
const { screen, within } = testingLibrary;

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

describe('EstimatedCustomerBreakdownMaybe', () => {
  it('renders nothing if nightly is missing start and end date', () => {
    const tree = render(
      <EstimatedCustomerBreakdownMaybe
        lineItems={lineItems}
        currency="USD"
        marketplaceName="MarketplaceX"
        processName="default-booking"
      />
    );
    expect(tree.asFragment().firstChild).toBeFalsy();
  });

  it('renders nothing if nightly is missing end date', () => {
    const data = {
      startDate: new Date(),
    };
    const tree = render(
      <EstimatedCustomerBreakdownMaybe
        breakdownData={data}
        lineItems={lineItems}
        currency="USD"
        marketplaceName="MarketplaceX"
        processName="default-booking"
      />
    );
    expect(tree.asFragment().firstChild).toBeFalsy();
  });

  it('renders breakdown with correct transaction data', () => {
    const startDate = new Date(Date.UTC(2017, 3, 14, 0, 0, 0));
    const endDate = new Date(Date.UTC(2017, 3, 16, 0, 0, 0));
    const props = {
      breakdownData: {
        startDate,
        endDate,
      },
      lineItems,
      currency: 'USD',
      timeZone: 'Etc/UTC',
      marketplaceName: 'MarketplaceX',
      processName: 'default-booking',
    };

    render(<EstimatedCustomerBreakdownMaybe {...props} />);

    const bookingStart = screen.getByText('OrderBreakdown.bookingStart');
    expect(bookingStart).toBeInTheDocument();
    const bookingStartInfo = within(bookingStart.parentNode.parentNode);
    expect(bookingStartInfo.getByText('Friday')).toBeInTheDocument();
    expect(bookingStartInfo.getByText('Apr 14')).toBeInTheDocument();

    const bookingEnd = screen.getByText('OrderBreakdown.bookingEnd');
    expect(bookingEnd).toBeInTheDocument();
    const bookingEndInfo = within(bookingEnd.parentNode.parentNode);
    expect(bookingEndInfo.getByText('Sunday')).toBeInTheDocument();
    expect(bookingEndInfo.getByText('Apr 16')).toBeInTheDocument();

    const baseUnitNight = screen.getByText('OrderBreakdown.baseUnitNight');
    expect(baseUnitNight).toBeInTheDocument();
    const baseUnitNightInfo = within(baseUnitNight.parentNode.parentNode);
    expect(baseUnitNightInfo.getByText('$21.98')).toBeInTheDocument();

    const total = screen.getByText('OrderBreakdown.total');
    expect(total).toBeInTheDocument();
    const totalPayIn = within(total.parentNode.parentNode);
    expect(totalPayIn.getByText('$21.98')).toBeInTheDocument();
  });
});

// ─── hasAvailabilityOrCheckoutOnDay ──────────────────────────────────────────

const makeSlot = (start, end, seats = 1) => ({
  attributes: { start: new Date(start), end: new Date(end), seats },
});

describe('hasAvailabilityOrCheckoutOnDay', () => {
  const timeZone = 'Etc/UTC';
  // Slot covers July 1 → Aug 28 (Aug 28 is the checkout day, i.e. the slot end day)
  const slots = [makeSlot('2026-07-01T00:00:00Z', '2026-08-28T00:00:00Z')];

  it('returns true for a day in the middle of the slot', () => {
    expect(
      hasAvailabilityOrCheckoutOnDay(new Date('2026-07-15T00:00:00Z'), slots, timeZone)
    ).toBe(true);
  });

  it('returns true for the slot end day (checkout)', () => {
    // The bug fix: end day must use <= so checkout day is treated as available
    expect(
      hasAvailabilityOrCheckoutOnDay(new Date('2026-08-28T00:00:00Z'), slots, timeZone)
    ).toBe(true);
  });

  it('returns false for the day after the slot end', () => {
    expect(
      hasAvailabilityOrCheckoutOnDay(new Date('2026-08-29T00:00:00Z'), slots, timeZone)
    ).toBe(false);
  });

  it('returns false for a day before the slot start', () => {
    expect(
      hasAvailabilityOrCheckoutOnDay(new Date('2026-06-30T00:00:00Z'), slots, timeZone)
    ).toBe(false);
  });

  it('returns false when the slot has 0 seats', () => {
    const blocked = [makeSlot('2026-07-01T00:00:00Z', '2026-08-28T00:00:00Z', 0)];
    expect(
      hasAvailabilityOrCheckoutOnDay(new Date('2026-07-15T00:00:00Z'), blocked, timeZone)
    ).toBe(false);
  });

  it('returns false for non-array input', () => {
    expect(hasAvailabilityOrCheckoutOnDay(new Date('2026-07-15T00:00:00Z'), null, timeZone)).toBe(false);
  });
});

// ─── getFirstAvailableDate ───────────────────────────────────────────────────

describe('getFirstAvailableDate', () => {
  const timeZone = 'Etc/UTC';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-26T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null for an empty array', () => {
    expect(getFirstAvailableDate([], timeZone)).toBeNull();
  });

  it('returns null for null input', () => {
    expect(getFirstAvailableDate(null, timeZone)).toBeNull();
  });

  it('returns null when all slots are in the past', () => {
    const pastSlots = [makeSlot('2020-01-01T00:00:00Z', '2020-01-31T00:00:00Z')];
    expect(getFirstAvailableDate(pastSlots, timeZone)).toBeNull();
  });

  it('returns null when all slots have 0 seats', () => {
    const noSeats = [makeSlot('2026-08-01T00:00:00Z', '2026-08-31T00:00:00Z', 0)];
    expect(getFirstAvailableDate(noSeats, timeZone)).toBeNull();
  });

  it('returns the earliest future slot start date', () => {
    const slots = [
      makeSlot('2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z'),
      makeSlot('2026-08-01T00:00:00Z', '2026-08-31T00:00:00Z'),
    ];
    const result = getFirstAvailableDate(slots, timeZone);
    expect(result).not.toBeNull();
    // Earliest is Aug 1 2026
    expect(result.toISOString().startsWith('2026-08-01')).toBe(true);
  });

  it('skips slots that end before today', () => {
    const slots = [
      makeSlot('2026-04-01T00:00:00Z', '2026-04-25T00:00:00Z'), // ends yesterday
      makeSlot('2026-08-01T00:00:00Z', '2026-08-31T00:00:00Z'), // future
    ];
    const result = getFirstAvailableDate(slots, timeZone);
    expect(result).not.toBeNull();
    expect(result.toISOString().startsWith('2026-08-01')).toBe(true);
  });
});
