import React from 'react';
import ListingCard from './ListingGiftCard';
import { createUser, createListing, fakeIntl } from '../../util/testData';

const listing = createListing('listing1', {}, { author: createUser('user1') });

function ListingGiftCardWrapper(props) {
  return (
    <div style={{ maxWidth: '400px' }}>
      <ListingCard {...props} />
    </div>
  );
}

export const ListingGiftCardWrapped = {
  component: ListingCardWrapper,
  props: {
    intl: fakeIntl,
    listing,
  },
};
