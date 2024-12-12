import React from 'react';
import '@testing-library/jest-dom';

import { getHostedConfiguration, renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../util/testData';

import { ListingCard } from './ListingCard';

const getConfig = () => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingTypes: {
      listingTypes: [
        {
          id: 'free-inquiry',
          transactionProcess: {
            name: 'default-inquiry',
            alias: 'default-inquiry/release-1',
          },
          unitType: 'inquiry',
          defaultListingFields: {
            price: false,
          },
        },
      ],
    },
  };
};

describe('ListingCard', () => {
  it('matches snapshot', () => {
    // This is quite small component what comes to rendered HTML
    // For now, we rely on snapshot-testing.
    const listing = createListing('listing1', {}, { author: createUser('user1') });
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot without price', () => {
    const config = getConfig();
    const listing = createListing(
      'listing1',
      { publicData: { listingType: 'free-inquiry' } },
      { author: createUser('user1') }
    );
    const tree = render(<ListingCard listing={listing} intl={fakeIntl} />, { config });
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });
});
