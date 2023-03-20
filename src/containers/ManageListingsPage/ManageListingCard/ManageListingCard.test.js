import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../../util/testHelpers';
import { createOwnListing, fakeIntl } from '../../../util/testData';

import { ManageListingCardComponent } from './ManageListingCard';

const noop = () => null;

describe('ManageListingCard', () => {
  test('matches snapshot', () => {
    const tree = render(
      <ManageListingCardComponent
        history={{ push: noop }}
        listing={createOwnListing('listing1', { publicData: { listingType: 'sell-bikes' } })}
        intl={fakeIntl}
        isMenuOpen={false}
        onCloseListing={noop}
        onOpenListing={noop}
        onToggleMenu={noop}
        hasClosingError={false}
        hasOpeningError={false}
        availabilityEnabled={true}
      />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });
});
