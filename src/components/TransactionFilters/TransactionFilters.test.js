import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import TransactionFilters from './TransactionFilters';

const { screen, userEvent } = testingLibrary;

const messages = {
  'TransactionFilters.status': 'Status',
  'TransactionFilters.all': 'All',
  'TransactionFilters.completed': 'Completed',
  'TransactionFilters.pending': 'Pending',
  'TransactionFilters.cancelled': 'Cancelled',
  'TransactionFilters.dateFrom': 'From',
  'TransactionFilters.dateTo': 'To',
  'TransactionFilters.clearAll': 'Clear filters',
};

describe('TransactionFilters', () => {
  it('renders status select and date inputs', () => {
    render(<TransactionFilters pageName="MyBalancePage" />, { messages });
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('status select contains all status options', () => {
    render(<TransactionFilters pageName="MyBalancePage" />, { messages });
    const select = screen.getByLabelText('Status');
    expect(select).toContainElement(screen.getByRole('option', { name: 'All' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Completed' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Pending' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Cancelled' }));
  });

  it('does not render clear button when no filters active', () => {
    render(<TransactionFilters pageName="MyBalancePage" />, { messages });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<TransactionFilters pageName="MyBalancePage" />, { messages });
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
