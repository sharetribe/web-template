import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { NoAccessPageComponent } from './NoAccessPage';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('NoAccessPageComponent', () => {
  it('Check that /no-posting-right has heading and content', () => {
    render(
      <NoAccessPageComponent
        params={{ missingAccessRight: 'posting-right' }}
        scrollingDisabled={false}
        intl={fakeIntl}
      />
    );

    const postListingsHeading = 'NoAccessPage.postListings.heading';
    const found = screen.getByText(postListingsHeading);
    expect(found).toBeInTheDocument();
    const postListingsContent = 'NoAccessPage.postListings.content';
    const found2 = screen.getByText(postListingsContent);
    expect(found2).toBeInTheDocument();
  });

  it('Check that /no-asdf renders 404', () => {
    render(
      <NoAccessPageComponent
        params={{ missingAccessRight: 'asdf' }}
        scrollingDisabled={false}
        intl={fakeIntl}
      />
    );

    const theNotFoundHeading = '404';
    const found = screen.queryByText(theNotFoundHeading);
    expect(found).toBeInTheDocument();
  });
});
