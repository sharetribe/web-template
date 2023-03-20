/* eslint-disable no-console */
import React from 'react';

import {
  LISTING_STATE_CLOSED,
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_DRAFT,
} from '../../../util/types';
import { createOwnListing, fakeIntl } from '../../../util/testData';

import ManageListingCard from './ManageListingCard';

const noop = () => null;

const ManageListingCardWrapper = props => (
  <div style={{ maxWidth: '400px' }}>
    <ManageListingCard {...props} />
  </div>
);

export const Published = {
  component: ManageListingCardWrapper,
  props: {
    hasClosingError: false,
    hasOpeningError: false,
    intl: fakeIntl,
    listing: createOwnListing('listing-published', {
      publicData: { listingType: 'sell-bikes' },
    }),
    isMenuOpen: false,
    onCloseListing: noop,
    onOpenListing: noop,
    onToggleMenu: noop,
    history: { push: noop },
  },
  group: 'page:ManageListingsPage',
};

export const Closed = {
  component: ManageListingCardWrapper,
  props: {
    hasClosingError: false,
    hasOpeningError: false,
    intl: fakeIntl,
    listing: createOwnListing('listing-closed', {
      state: LISTING_STATE_CLOSED,
      publicData: { listingType: 'sell-bikes' },
    }),
    isMenuOpen: false,
    onCloseListing: noop,
    onOpenListing: noop,
    onToggleMenu: noop,
    history: { push: noop },
  },
  group: 'page:ManageListingsPage',
};

export const PendingApproval = {
  component: ManageListingCardWrapper,
  props: {
    hasClosingError: false,
    hasOpeningError: false,
    intl: fakeIntl,
    listing: createOwnListing('listing-pending', {
      state: LISTING_STATE_PENDING_APPROVAL,
      publicData: { listingType: 'sell-bikes' },
    }),
    isMenuOpen: false,
    onCloseListing: noop,
    onOpenListing: noop,
    onToggleMenu: noop,
    history: { push: noop },
  },
  group: 'page:ManageListingsPage',
};

export const Draft = {
  component: ManageListingCardWrapper,
  props: {
    hasClosingError: false,
    hasOpeningError: false,
    intl: fakeIntl,
    listing: createOwnListing('listing-draft', {
      state: LISTING_STATE_DRAFT,
      publicData: { listingType: 'sell-bikes' },
    }),
    isMenuOpen: false,
    onCloseListing: noop,
    onOpenListing: noop,
    onToggleMenu: noop,
    history: { push: noop },
  },
  group: 'page:ManageListingsPage',
};

export const OutOfStock = {
  component: ManageListingCardWrapper,
  props: {
    hasClosingError: false,
    hasOpeningError: false,
    intl: fakeIntl,
    listing: createOwnListing('listing-out-of-stock', {
      currentStock: 0,
      publicData: { listingType: 'sell-bikes' },
    }),
    isMenuOpen: false,
    onCloseListing: noop,
    onOpenListing: noop,
    onToggleMenu: noop,
    history: { push: noop },
  },
  group: 'page:ManageListingsPage',
};
