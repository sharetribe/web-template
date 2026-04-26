import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthlyAvailabilityCalendar from './MonthlyAvailabilityCalendar';

// Fix today to a known date so tests don't drift.
// April 25 2026 → initial view shows April/May. We navigate to May/June for tests.
const FIXED_TODAY = new Date(2026, 3, 25); // 25 Apr 2026

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  jest.useRealTimers();
});

const listing = {
  id: { uuid: 'listing-1' },
  attributes: { state: 'draft', title: 'Test Listing' },
};

const makeException = (startDate, endDate, id = 'exc-1') => ({
  id: { uuid: id },
  type: 'availabilityException',
  attributes: { start: startDate, end: endDate, seats: 1 },
});

const defaultProps = {
  allExceptions: [],
  onAddAvailabilityException: jest.fn().mockResolvedValue({}),
  onDeleteAvailabilityException: jest.fn().mockResolvedValue({}),
  onFetchExceptions: jest.fn().mockResolvedValue({}),
  listing,
  timeZone: 'Africa/Nairobi',
  updateInProgress: false,
  errors: {},
};

// Navigate forward N months using the → button
const goForwardMonths = (n) => {
  for (let i = 0; i < n; i++) {
    fireEvent.click(screen.getByText('→'));
  }
};

// Click the Nth occurrence of a day number in the DOM (0-indexed)
const clickDayOccurrence = (dayNum, occurrenceIndex = 0) => {
  const cells = screen.getAllByText(String(dayNum));
  fireEvent.click(cells[occurrenceIndex]);
};

// ─── 1. Hosts can choose different availability slots ─────────────────────────

describe('Hosts can choose availability slots', () => {
  it('renders the calendar with the idle hint', () => {
    render(<MonthlyAvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText(/Click a start date/i)).toBeInTheDocument();
  });

  it('prompts for an end date after clicking a start date', () => {
    render(<MonthlyAvailabilityCalendar {...defaultProps} />);
    // Navigate to May/June so all days are in the future
    goForwardMonths(1);
    // Click May 5 as start
    clickDayOccurrence(5, 0);
    expect(screen.getByText(/now click an end date/i)).toBeInTheDocument();
  });

  it('calls onAddAvailabilityException with the right shape for a valid range', async () => {
    const onAdd = jest.fn().mockResolvedValue({});
    render(<MonthlyAvailabilityCalendar {...defaultProps} onAddAvailabilityException={onAdd} />);

    goForwardMonths(1); // show May/June
    clickDayOccurrence(1, 0); // May 1 — start
    clickDayOccurrence(15, 1); // June 15 — end (45 days)

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: listing.id,
        seats: 1,
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );
  });

  it('displays existing availability windows from allExceptions', () => {
    const start = new Date(2026, 5, 1);        // 1 Jun 2026
    const end   = new Date(2026, 6, 16);       // 16 Jul (exclusive → shows as 15 Jul)
    render(
      <MonthlyAvailabilityCalendar
        {...defaultProps}
        allExceptions={[makeException(start, end)]}
      />
    );
    expect(screen.getByText(/Availability windows/i)).toBeInTheDocument();
  });
});

// ─── 2. Availability slots must be at least 30 days ──────────────────────────

describe('30-day minimum enforcement', () => {
  it('shows an error when the selected range is less than 30 days', () => {
    render(<MonthlyAvailabilityCalendar {...defaultProps} />);
    goForwardMonths(1); // May/June

    clickDayOccurrence(1, 0);  // May 1 — start
    clickDayOccurrence(10, 0); // May 10 — end (10 days)

    expect(screen.getByText(/Minimum availability window is 30 days/i)).toBeInTheDocument();
  });

  it('does NOT call onAddAvailabilityException for a short range', () => {
    const onAdd = jest.fn().mockResolvedValue({});
    render(<MonthlyAvailabilityCalendar {...defaultProps} onAddAvailabilityException={onAdd} />);

    goForwardMonths(1);
    clickDayOccurrence(1, 0);  // May 1
    clickDayOccurrence(10, 0); // May 10 — 10 days

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('accepts a range of exactly 30 days without an error', () => {
    const onAdd = jest.fn().mockResolvedValue({});
    render(<MonthlyAvailabilityCalendar {...defaultProps} onAddAvailabilityException={onAdd} />);

    goForwardMonths(1);
    clickDayOccurrence(1, 0);  // May 1
    clickDayOccurrence(30, 0); // May 30 — 30 days inclusive

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Minimum availability window/i)).not.toBeInTheDocument();
  });
});

// ─── 3. Slots don't disappear after listing approval ─────────────────────────

describe('Slots persist after listing approval', () => {
  it('calls onFetchExceptions on mount so slots appear after a page refresh', () => {
    const onFetch = jest.fn().mockResolvedValue({});
    render(<MonthlyAvailabilityCalendar {...defaultProps} onFetchExceptions={onFetch} />);
    expect(onFetch).toHaveBeenCalledTimes(1);
    expect(onFetch).toHaveBeenCalledWith(
      expect.objectContaining({ listingId: listing.id })
    );
  });

  it('still shows existing windows when listing state changes to published', () => {
    const exceptions = [makeException(new Date(2026, 5, 1), new Date(2026, 6, 16))];
    const { rerender } = render(
      <MonthlyAvailabilityCalendar {...defaultProps} allExceptions={exceptions} />
    );

    // Simulate approval — listing state moves from draft → published
    rerender(
      <MonthlyAvailabilityCalendar
        {...defaultProps}
        allExceptions={exceptions}
        listing={{ ...listing, attributes: { ...listing.attributes, state: 'published' } }}
      />
    );

    expect(screen.getByText(/Availability windows/i)).toBeInTheDocument();
  });

  it('does not clear windows when the component re-renders with the same exceptions', () => {
    const exceptions = [makeException(new Date(2026, 5, 1), new Date(2026, 6, 16))];
    const { rerender } = render(
      <MonthlyAvailabilityCalendar {...defaultProps} allExceptions={exceptions} />
    );
    rerender(<MonthlyAvailabilityCalendar {...defaultProps} allExceptions={exceptions} />);
    expect(screen.getByText(/Availability windows/i)).toBeInTheDocument();
  });
});
