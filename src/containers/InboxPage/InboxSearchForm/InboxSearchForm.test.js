import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';
import InboxSearchForm from './InboxSearchForm';

const { screen } = testingLibrary;

describe('InboxSearchForm', () => {
  it('renders the dropdown with correct initial value and options', () => {
    render(
      <InboxSearchForm
        onSubmit={() => {}}
        onSelect={() => {}}
        intl={fakeIntl}
        tab={'orders'}
        routeConfiguration={{}}
        history={{}}
      />
    );

    const sortByLabel = screen.getByText('InboxSearchForm.sortLabel');
    expect(sortByLabel).toBeInTheDocument();

    // Appears twice as the default option and again as a menu item
    const sortByCreatedAt = screen.getAllByText('InboxPage.sortBy.createdAt');
    expect(sortByCreatedAt[0]).toBeInTheDocument();
    expect(sortByCreatedAt[1]).toBeInTheDocument();

    const sortByLastMessageAt = screen.getByText('InboxPage.sortBy.lastMessageAt');
    expect(sortByLastMessageAt).toBeInTheDocument();

    const sortByLastTransitionedAt = screen.getByText('InboxPage.sortBy.lastTransitionedAt');
    expect(sortByLastTransitionedAt).toBeInTheDocument();
  });
});
