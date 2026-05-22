import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import BalanceSummary from './BalanceSummary';

const { screen, userEvent } = testingLibrary;

const messages = {
  'BalanceSummary.tabAllTime': 'All Time',
  'BalanceSummary.tabCurrentMonth': 'This Month',
  'BalanceSummary.totalEarnings': 'Total Earnings',
  'BalanceSummary.pending': 'Pending',
  'BalanceSummary.cancelled': 'Cancelled',
};

const defaultProps = {
  completedTotalAmount: 100000,
  pendingTotalAmount: 20000,
  cancelledCount: 3,
  currentMonthCompletedAmount: 50000,
  currentMonthPendingAmount: 10000,
  currentMonthCancelledCount: 1,
  currency: 'MXN',
  fetchInProgress: false,
};

describe('BalanceSummary', () => {
  it('renders a spinner while fetching', () => {
    const { container } = render(<BalanceSummary {...defaultProps} fetchInProgress />, {
      messages,
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders three summary cards when not loading', () => {
    render(<BalanceSummary {...defaultProps} />, { messages });
    expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    render(<BalanceSummary {...defaultProps} />, { messages });
    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
  });

  it('shows cancelled count from all-time by default', () => {
    render(<BalanceSummary {...defaultProps} />, { messages });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('switches to current-month values on tab click', async () => {
    const user = userEvent.setup();
    render(<BalanceSummary {...defaultProps} />, { messages });
    await user.click(screen.getByRole('button', { name: 'This Month' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders dashes when no currency provided', () => {
    render(<BalanceSummary {...defaultProps} currency={null} />, { messages });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<BalanceSummary {...defaultProps} />, { messages });
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
