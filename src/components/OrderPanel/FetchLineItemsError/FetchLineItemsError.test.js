import React from 'react';
import '@testing-library/jest-dom';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import FetchLineItemsError from './FetchLineItemsError';
const { screen } = testingLibrary;

describe('FetchLineItemsError', () => {
  it('renders nothing if error is null', () => {
    const error = null;
    const tree = render(<FetchLineItemsError error={error} />);
    expect(tree.asFragment().firstChild).toBeFalsy();
  });

  it('renders unknown error message if error is empty', () => {
    const error = {};
    const tree = render(<FetchLineItemsError error={error} />);
    const unknownErrorText = screen.getByText('FetchLineItemsError.unknownError');
    expect(unknownErrorText).toBeInTheDocument();
  });

  it('renders unknown error message if error status code is incorrect', () => {
    const error = { status: 500 };
    const tree = render(<FetchLineItemsError error={error} />);
    const unknownErrorText = screen.getByText('FetchLineItemsError.unknownError');
    expect(unknownErrorText).toBeInTheDocument();
  });

  it('renders unknown error message if error status text is incorrect', () => {
    const error = { statusText: 'Error status text' };
    const tree = render(<FetchLineItemsError error={error} />);
    const unknownErrorText = screen.getByText('FetchLineItemsError.unknownError');
    expect(unknownErrorText).toBeInTheDocument();
  });

  it('renders provider commission is bigger than minimum commission error message with correctly formed error object', () => {
    const error = {
      status: 400,
      statusText: 'Minimum commission amount is greater than the amount of money paid in',
    };
    const tree = render(<FetchLineItemsError error={error} />);
    const providerCommissionBiggerThanMinPriceText = screen.getByText(
      'FetchLineItemsError.providerCommissionBiggerThanMinPrice'
    );
    expect(providerCommissionBiggerThanMinPriceText).toBeInTheDocument();
  });
});
