import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import { BookingDateRangeFilterComponent } from './BookingDateRangeFilter';

const { screen, userEvent, waitFor } = testingLibrary;

const noop = () => null;

const baseProps = {
  id: 'test-dates-filter',
  label: 'Dates',
  queryParamNames: ['dates'],
  initialValues: { dates: null },
  onSubmit: noop,
  showAsPopup: true,
  isDesktop: false,
  minimumNights: 29,
  intl: fakeIntl,
  getAriaLabel: () => 'Filter: Dates',
};

describe('BookingDateRangeFilter', () => {
  it('renders the popup trigger button with the label prop', () => {
    render(<BookingDateRangeFilterComponent {...baseProps} />);
    // When no dates are selected, the passed label prop is displayed directly
    expect(screen.getByRole('button', { name: 'Filter: Dates' })).toBeInTheDocument();
  });

  it('shows two calendar months when the popup is opened', async () => {
    const user = userEvent.setup();
    render(<BookingDateRangeFilterComponent {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'Filter: Dates' }));

    await waitFor(() => {
      // Single-month layout slides 3 calendar tables (prev/current/next).
      // Two-month layout renders exactly 2 tables side-by-side.
      const calendarTables = screen.getAllByRole('presentation');
      expect(calendarTables).toHaveLength(2);
    });
  });

  it('shows the selected-dates label when initialValues contains a date range', () => {
    const propsWithDates = {
      ...baseProps,
      initialValues: { dates: '2026-05-01,2026-06-15' },
    };
    render(<BookingDateRangeFilterComponent {...propsWithDates} />);

    // When dates are selected, fakeIntl returns the message ID as text
    expect(
      screen.getByRole('button', { name: 'Filter: Dates' })
    ).toBeInTheDocument();
    // The rendered label text switches from the plain 'Dates' label to the selected-message ID
    expect(screen.queryByText('Dates')).not.toBeInTheDocument();
    expect(screen.getByText('BookingDateRangeFilter.labelSelectedPopup')).toBeInTheDocument();
  });
});
