/* eslint-disable no-console */
import React from 'react';
import ListingCard, { LISTING_CARD_VARIANT_COURSE } from './ListingCard';
import { createUser, createListing, fakeIntl } from '../../util/testData';

const listing = createListing('listing1', {}, { author: createUser('user1') });

const ListingCardWrapper = props => (
  <div style={{ maxWidth: props.cardVariant === LISTING_CARD_VARIANT_COURSE ? '960px' : '400px' }}>
    <ListingCard {...props} />
  </div>
);

export const ListingCardWrapped = {
  component: ListingCardWrapper,
  props: {
    intl: fakeIntl,
    listing,
  },
};

export const ListingCardCourseVariant = {
  component: ListingCardWrapper,
  props: {
    intl: fakeIntl,
    listing,
    cardVariant: LISTING_CARD_VARIANT_COURSE,
  },
};
