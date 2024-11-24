import React from 'react';
import ListingGiftCard from './ListingGiftCard';
import { createUser, createListing, fakeIntl } from '../../util/testData';

const listing = createListing('listing1', {}, { author: createUser('user1') });

function ListingCardWrapper(props) {
  return (
    <div style={{ maxWidth: '400px' }}>
      <ListingCard {...props} />
    </div>
  );
}

export const ListingCardWrapped = {
  component: ListingCardWrapper,
  props: {
    intl: fakeIntl,
    listing,
  },
};
