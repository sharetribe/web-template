import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../../util/sdkLoader';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import {
  hasAvailabilityOrCheckoutOnDay,
  getFirstAvailableDate,
  getAllTimeSlots,
  combineConsecutiveTimeSlots,
  isDayBlockedFn,
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

// ─── getAllTimeSlots ─────────────────────────────────────────────────────────

describe('getAllTimeSlots', () => {
  it('sorts slots chronologically regardless of month insertion order', () => {
    // Sep inserted before May and Jul — simulates async fetch completion out of order
    const monthlyTimeSlots = {
      '2026-09': { timeSlots: [makeSlot('2026-09-01T00:00:00Z', '2026-11-01T00:00:00Z')] },
      '2026-05': { timeSlots: [makeSlot('2026-05-01T00:00:00Z', '2026-06-01T00:00:00Z')] },
      '2026-07': { timeSlots: [makeSlot('2026-07-01T00:00:00Z', '2026-08-01T00:00:00Z')] },
    };
    const result = getAllTimeSlots(monthlyTimeSlots);
    // All 3 distinct (non-adjacent) slots present
    expect(result.length).toBe(3);
    // Must be in chronological start-date order
    expect(new Date(result[0].attributes.start) <= new Date(result[1].attributes.start)).toBe(true);
    expect(new Date(result[1].attributes.start) <= new Date(result[2].attributes.start)).toBe(true);
    // First slot is May
    expect(new Date(result[0].attributes.start).toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });

  it('merges back-to-back same-seat slots after sorting', () => {
    // Jul slot end === Aug slot start (identical timestamp) — would not be adjacent without sort
    const monthlyTimeSlots = {
      '2026-09': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
      '2026-07': { timeSlots: [makeSlot('2026-06-30T21:00:00Z', '2026-07-31T21:00:00Z')] },
      '2026-08': { timeSlots: [makeSlot('2026-07-31T21:00:00Z', '2026-08-31T21:00:00Z')] },
    };
    const result = getAllTimeSlots(monthlyTimeSlots);
    // After sorting, all three slots are exactly back-to-back → merged into one
    expect(result.length).toBe(1);
    expect(new Date(result[0].attributes.start).toISOString()).toBe('2026-06-30T21:00:00.000Z');
    expect(new Date(result[0].attributes.end).toISOString()).toBe('2026-10-31T21:00:00.000Z');
  });

  it('skips months whose fetch is still in progress (no timeSlots array)', () => {
    const monthlyTimeSlots = {
      '2026-07': { fetchTimeSlotsInProgress: true }, // in-flight — no timeSlots
      '2026-08': { timeSlots: [makeSlot('2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z')] },
    };
    const result = getAllTimeSlots(monthlyTimeSlots);
    expect(result.length).toBe(1);
    expect(new Date(result[0].attributes.start).toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});

// ─── combineConsecutiveTimeSlots ─────────────────────────────────────────────

describe('combineConsecutiveTimeSlots', () => {
  // Africa/Nairobi = UTC+3, no DST — same as the Patamali production timezone
  const timeZone = 'Africa/Nairobi';

  it('returns empty array when startDate is not in any slot', () => {
    const slots = [makeSlot('2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z')];
    const startDate = new Date('2026-07-01T00:00:00Z'); // July — outside slot
    expect(combineConsecutiveTimeSlots(slots, startDate, timeZone)).toEqual([]);
  });

  it('merges slots whose boundaries are offset by up to an hour on the same calendar day (timezone fix)', () => {
    // Real-world Sharetribe data: Slot A ends May 31 21:00 UTC (= Jun 1 00:00 EAT),
    // Slot B starts May 31 22:00 UTC (= Jun 1 01:00 EAT) — 1-hour UTC mismatch,
    // same calendar day in EAT. Old code (millisecond equality) treated them as
    // non-consecutive; day-level fix must merge them.
    const slots = [
      makeSlot('2026-04-27T00:00:00Z', '2026-05-31T21:00:00Z'), // ends Jun 1 00:00 EAT
      makeSlot('2026-05-31T22:00:00Z', '2026-07-31T21:00:00Z'), // starts Jun 1 01:00 EAT
    ];
    const startDate = new Date('2026-05-08T21:00:00Z'); // May 9 00:00 EAT
    const result = combineConsecutiveTimeSlots(slots, startDate, timeZone);
    expect(result.length).toBe(1);
    expect(new Date(result[0].attributes.start).toISOString()).toBe('2026-04-27T00:00:00.000Z');
    expect(new Date(result[0].attributes.end).toISOString()).toBe('2026-07-31T21:00:00.000Z');
  });

  it('stops merging at a genuine gap in availability', () => {
    // Aug slot ends Aug 27 — then there is a gap before Sep 1
    const slots = [
      makeSlot('2026-06-30T21:00:00Z', '2026-07-31T21:00:00Z'), // Jul 1–Aug 1 EAT
      makeSlot('2026-07-31T21:00:00Z', '2026-08-26T22:00:00Z'), // Aug 1–Aug 27 EAT
      makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z'), // Sep 1–Nov 1 EAT (gap!)
    ];
    const startDate = new Date('2026-06-30T21:00:00Z'); // Jul 1 00:00 EAT
    const result = combineConsecutiveTimeSlots(slots, startDate, timeZone);
    expect(result.length).toBe(1);
    // Sep-Nov slot must NOT be included
    expect(new Date(result[0].attributes.end).toISOString()).toBe('2026-08-26T22:00:00.000Z');
  });

  it('regression: out-of-order slots (Sep fetched before Jul/Aug) are correctly combined after getAllTimeSlots sorts them', () => {
    // Reproduces the exact bug: months inserted Sep→Oct→Aug→Jul due to async fetch order
    const monthlyTimeSlots = {
      '2026-05': { timeSlots: [makeSlot('2026-05-08T21:00:00Z', '2026-05-31T21:00:00Z')] },
      '2026-06': { timeSlots: [makeSlot('2026-05-31T22:00:00Z', '2026-06-30T21:00:00Z')] },
      '2026-09': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
      '2026-10': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
      '2026-08': { timeSlots: [makeSlot('2026-07-31T21:00:00Z', '2026-08-26T22:00:00Z')] },
      '2026-07': { timeSlots: [makeSlot('2026-06-30T21:00:00Z', '2026-07-31T21:00:00Z')] },
    };
    const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);
    const startDate = new Date('2026-06-30T21:00:00Z'); // Jul 1 00:00 EAT
    const result = combineConsecutiveTimeSlots(allTimeSlots, startDate, timeZone);
    expect(result.length).toBe(1);
    // Must cover Aug 2 (previously blocked due to slot ordering bug)
    const aug2 = new Date('2026-08-01T21:00:00Z'); // Aug 2 00:00 EAT
    const slotStart = new Date(result[0].attributes.start);
    const slotEnd = new Date(result[0].attributes.end);
    expect(aug2 >= slotStart && aug2 < slotEnd).toBe(true);
  });
});

// ─── isDayBlockedFn ──────────────────────────────────────────────────────────

describe('isDayBlockedFn — exclusive-end boundary (endDate awareness)', () => {
  const timeZone = 'Etc/UTC';
  // Listing available Jul 1 → Nov 30; exclusive API end = Dec 1 00:00 UTC
  const slot = makeSlot('2026-07-01T00:00:00Z', '2026-12-01T00:00:00Z');
  const allTimeSlots = [slot];
  // monthlyTimeSlots: Jul–Nov fetched with availability; Dec fetched but empty
  const monthlyTimeSlots = {
    '2026-07': { timeSlots: [slot] },
    '2026-08': { timeSlots: [slot] },
    '2026-09': { timeSlots: [slot] },
    '2026-10': { timeSlots: [slot] },
    '2026-11': { timeSlots: [slot] },
    '2026-12': { timeSlots: [] },
  };
  const dec1 = new Date('2026-12-01T00:00:00Z');

  it('blocks the exclusive-end boundary day when both startDate and endDate are set', () => {
    const isDayBlocked = isDayBlockedFn({
      allTimeSlots,
      monthlyTimeSlots,
      isDaily: false,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-10-01T00:00:00Z'),
      timeZone,
    });
    expect(isDayBlocked(dec1)).toBe(true);
  });

  it('allows the exclusive-end boundary day as a checkout option when only startDate is set', () => {
    const isDayBlocked = isDayBlockedFn({
      allTimeSlots,
      monthlyTimeSlots,
      isDaily: false,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: null,
      timeZone,
    });
    expect(isDayBlocked(dec1)).toBe(false);
  });

  it('blocks days that are clearly past the slot end in both states', () => {
    const dec2 = new Date('2026-12-02T00:00:00Z');
    const withEndDate = isDayBlockedFn({
      allTimeSlots, monthlyTimeSlots, isDaily: false,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-10-01T00:00:00Z'), timeZone,
    });
    const withoutEndDate = isDayBlockedFn({
      allTimeSlots, monthlyTimeSlots, isDaily: false,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: null, timeZone,
    });
    expect(withEndDate(dec2)).toBe(true);
    expect(withoutEndDate(dec2)).toBe(true);
  });

  it('does not block days well within the available slot', () => {
    const aug15 = new Date('2026-08-15T00:00:00Z');
    const isDayBlocked = isDayBlockedFn({
      allTimeSlots, monthlyTimeSlots, isDaily: false,
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: null, timeZone,
    });
    expect(isDayBlocked(aug15)).toBe(false);
  });
});

// ─── Checkout back-navigation integration ────────────────────────────────────
//
// These tests replicate the full pipeline that runs when a user returns from
// the checkout page (URL params pre-fill startDate/endDate) and then picks a
// new start date.  They exercise getAllTimeSlots → combineConsecutiveTimeSlots
// → isDayBlockedFn end-to-end so that any future regression in the pipeline
// is caught at the right level.

describe('checkout back-navigation: calendar availability after picking new start date', () => {
  const timeZone = 'Africa/Nairobi'; // UTC+3, matches production

  // Exact slot data observed in the wild when the bug was live.
  // Months were inserted in this order due to async fetch completion:
  // May → Jun → Sep → Oct → Aug → Jul
  const buildMonthlyTimeSlots = () => ({
    '2026-05': { timeSlots: [makeSlot('2026-05-08T21:00:00Z', '2026-05-31T21:00:00Z')] },
    '2026-06': { timeSlots: [makeSlot('2026-05-31T22:00:00Z', '2026-06-30T21:00:00Z')] },
    '2026-09': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
    '2026-10': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
    '2026-08': { timeSlots: [makeSlot('2026-07-31T21:00:00Z', '2026-08-26T22:00:00Z')] },
    '2026-07': { timeSlots: [makeSlot('2026-06-30T21:00:00Z', '2026-07-31T21:00:00Z')] },
  });

  it('does not block Aug 2 when user picks Jul 1 as new start (all months fetched)', () => {
    const monthlyTimeSlots = buildMonthlyTimeSlots();
    const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);

    // Simulate the render-function logic: combine consecutive slots from startDate,
    // fall back to allTimeSlots if result is empty.
    const startDate = new Date('2026-06-30T21:00:00Z'); // Jul 1 00:00 EAT
    const combined = combineConsecutiveTimeSlots(allTimeSlots, startDate, timeZone);
    const relevantTimeSlots = combined.length > 0 ? combined : allTimeSlots;

    const isDayBlocked = isDayBlockedFn({
      allTimeSlots: relevantTimeSlots,
      monthlyTimeSlots,
      isDaily: false,
      startDate,
      endDate: null,
      timeZone,
    });

    const aug2 = new Date('2026-08-01T21:00:00Z'); // Aug 2 00:00 EAT
    expect(isDayBlocked(aug2)).toBe(false);
  });

  it('does not block Aug 2 when Jul fetch is still in-flight (fallback to allTimeSlots)', () => {
    // Jul is missing from monthlyTimeSlots (fetch dispatched but not yet complete).
    // The render-function fallback must kick in and keep August visible.
    const monthlyTimeSlots = {
      '2026-05': { timeSlots: [makeSlot('2026-05-08T21:00:00Z', '2026-05-31T21:00:00Z')] },
      '2026-06': { timeSlots: [makeSlot('2026-05-31T22:00:00Z', '2026-06-30T21:00:00Z')] },
      '2026-08': { timeSlots: [makeSlot('2026-07-31T21:00:00Z', '2026-08-26T22:00:00Z')] },
      '2026-09': { timeSlots: [makeSlot('2026-08-31T21:00:00Z', '2026-10-31T21:00:00Z')] },
      // '2026-07' intentionally absent — simulates in-flight fetch
    };
    const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);

    const startDate = new Date('2026-06-30T21:00:00Z'); // Jul 1 00:00 EAT
    const combined = combineConsecutiveTimeSlots(allTimeSlots, startDate, timeZone);
    // Jul is not in allTimeSlots → combined must be empty → fallback applies
    expect(combined.length).toBe(0);
    const relevantTimeSlots = combined.length > 0 ? combined : allTimeSlots;

    const isDayBlocked = isDayBlockedFn({
      allTimeSlots: relevantTimeSlots,
      monthlyTimeSlots,
      isDaily: false,
      startDate,
      endDate: null,
      timeZone,
    });

    const aug2 = new Date('2026-08-01T21:00:00Z'); // Aug 2 00:00 EAT
    expect(isDayBlocked(aug2)).toBe(false);
  });

  it('blocks Dec 1 (exclusive end) after returning from checkout with both dates pre-filled', () => {
    // Simulates the state when URL params are loaded: both startDate and endDate set.
    const slot = makeSlot('2026-07-01T00:00:00Z', '2026-12-01T00:00:00Z');
    const monthlyTimeSlots = {
      '2026-07': { timeSlots: [slot] },
      '2026-08': { timeSlots: [slot] },
      '2026-09': { timeSlots: [slot] },
      '2026-10': { timeSlots: [slot] },
      '2026-11': { timeSlots: [slot] },
      '2026-12': { timeSlots: [] },
    };
    const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);

    // Both dates set → relevantTimeSlots = allTimeSlots (no combine)
    const isDayBlocked = isDayBlockedFn({
      allTimeSlots,
      monthlyTimeSlots,
      isDaily: false,
      startDate: new Date('2026-09-02T00:00:00Z'),
      endDate: new Date('2026-10-21T00:00:00Z'),
      timeZone: 'Etc/UTC',
    });

    const dec1 = new Date('2026-12-01T00:00:00Z');
    expect(isDayBlocked(dec1)).toBe(true);
  });
});
