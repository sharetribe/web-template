import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { types as sdkTypes } from '../../util/sdkLoader';
import PayoutItem from './PayoutItem';

const { Money } = sdkTypes;

const { screen } = testingLibrary;

const messages = {
  'PayoutItem.gross': 'Gross',
  'PayoutItem.net': 'Net',
  'PayoutItem.statusCompleted': 'Completed',
  'PayoutItem.statusPending': 'Pending',
  'PayoutItem.statusCancelled': 'Cancelled',
};

const makeTx = (overrides = {}) => ({
  id: { uuid: 'tx-abc-123' },
  attributes: {
    lastTransition: 'transition/auto-complete',
    lastTransitionedAt: new Date('2024-03-15T10:00:00Z'),
    payinTotal: new Money(45000, 'MXN'),
    payoutTotal: new Money(40500, 'MXN'),
    processName: 'default-purchase',
    ...overrides,
  },
  listing: { attributes: { title: 'Vestido Vintage' } },
  customer: { attributes: { profile: { displayName: 'Ana García' } } },
});

describe('PayoutItem', () => {
  it('renders the listing title as a link', () => {
    render(<PayoutItem tx={makeTx()} />, { messages });
    const link = screen.getByRole('link', { name: 'Vestido Vintage' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('tx-abc-123'));
  });

  it('renders the buyer display name', () => {
    render(<PayoutItem tx={makeTx()} />, { messages });
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('renders gross and net amount labels', () => {
    render(<PayoutItem tx={makeTx()} />, { messages });
    expect(screen.getByText('Gross')).toBeInTheDocument();
    expect(screen.getByText('Net')).toBeInTheDocument();
  });

  it('shows dashes when payinTotal is absent', () => {
    const tx = makeTx({ payinTotal: null });
    render(<PayoutItem tx={tx} />, { messages });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Completed status badge for completed transition', () => {
    render(<PayoutItem tx={makeTx()} />, { messages });
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders Pending status badge for in-progress transition', () => {
    render(<PayoutItem tx={makeTx({ lastTransition: 'transition/confirm-payment' })} />, {
      messages,
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders Cancelled status badge for cancelled transition', () => {
    render(<PayoutItem tx={makeTx({ lastTransition: 'transition/cancel' })} />, { messages });
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<PayoutItem tx={makeTx()} />, { messages });
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
