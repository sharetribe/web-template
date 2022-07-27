import React from 'react';
import { renderDeep } from '../../util/test-helpers';
import { createUser, createListing, fakeIntl } from '../../util/test-data';
import { ListingCardComponent } from './ListingCard';

describe('ListingCard', () => {
  it('matches snapshot', () => {
    const listing = createListing('listing1', {}, { author: createUser('user1') });
    const tree = renderDeep(<ListingCardComponent listing={listing} intl={fakeIntl} />);
    expect(tree).toMatchSnapshot();
  });
});
