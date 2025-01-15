import React, { act } from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { NoAccessPageComponent } from './NoAccessPage';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('NoAccessPageComponent', () => {
  it('Check that /no-posting-rights has heading and content', async () => {
    await act(async () => {
      render(
        <NoAccessPageComponent
          params={{ missingAccessRight: 'posting-rights' }}
          scrollingDisabled={false}
          intl={fakeIntl}
        />
      );
    });
    const postListingsHeading = 'NoAccessPage.postListings.heading';
    const found = screen.getByText(postListingsHeading);
    expect(found).toBeInTheDocument();
    const postListingsContent = 'NoAccessPage.postListings.content';
    const found2 = screen.getByText(postListingsContent);
    expect(found2).toBeInTheDocument();
  });

  it('Check that /no-transaction-rights has heading and content', async () => {
    await act(async () => {
      render(
        <NoAccessPageComponent
          params={{ missingAccessRight: 'transaction-rights' }}
          scrollingDisabled={false}
          intl={fakeIntl}
        />
      );
    });

    const initiateTransactionsHeading = 'NoAccessPage.initiateTransactions.heading';
    const found = screen.getByText(initiateTransactionsHeading);
    expect(found).toBeInTheDocument();
    const initiateTransactionsContent = 'NoAccessPage.initiateTransactions.content';
    const found2 = screen.getByText(initiateTransactionsContent);
    expect(found2).toBeInTheDocument();
  });

  it('Check that /no-asdf renders 404', async () => {
    await act(async () => {
      render(
        <NoAccessPageComponent
          params={{ missingAccessRight: 'asdf' }}
          scrollingDisabled={false}
          intl={fakeIntl}
        />
      );
    });
    const theNotFoundHeading = '404';
    const found = screen.queryByText(theNotFoundHeading);
    expect(found).toBeInTheDocument();
  });
});
