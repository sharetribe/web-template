import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createUser,
  createCurrentUser,
  createListing,
  createOwnListing,
  fakeIntl,
} from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getDefaultConfiguration,
} from '../../util/testHelpers';

import { storableError } from '../../util/errors';

import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  LISTING_STATE_CLOSED,
} from '../../util/types';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { showListingRequest, showListingError, showListing } from './ListingPage.duck';

import { ListingPageComponent as ListingPageCoverPhotoComponent } from './ListingPageCoverPhoto';
import { ListingPageComponent as ListingPageCarouselComponent } from './ListingPageCarousel';
import ActionBarMaybe from './ActionBarMaybe';

const { UUID } = sdkTypes;
const { screen } = testingLibrary;
const noop = () => null;

const listingConfig = {
  listingFields: [
    {
      key: 'category',
      scope: 'public',
      includeForListingTypes: ['sell-bicycles'],
      schemaType: 'enum',
      enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
      filterConfig: {
        indexForSearch: true,
      },
      showConfig: {
        label: 'Category',
        isDetail: true,
      },
    },
    {
      key: 'amenities',
      scope: 'public',
      includeForListingTypes: [
        'rent-bicycles-daily',
        'rent-bicycles-nightly',
        'rent-bicycles-hourly',
      ],
      schemaType: 'multi-enum',
      enumOptions: [
        { option: 'feat_1', label: 'Feat 1' },
        { option: 'feat_2', label: 'Feat 2' },
        { option: 'feat_3', label: 'Feat 3' },
      ],
      filterConfig: {
        indexForSearch: true,
      },
      showConfig: {
        label: 'Amenities',
        searchMode: 'has_all',
        group: 'secondary',
      },
    },
  ],
};

describe('ListingPage variants', () => {
  const currentUser = createCurrentUser('user-2');
  const id = 'listing1';
  const slug = 'listing1-title';
  const publicData = {
    listingType: 'sell-bicycles',
    transactionProcessAlias: 'default-purchase/release-1',
    unitType: 'item',
    category: 'cat_1',
  };
  const listing1 = createListing(id, { publicData }, { author: createUser('user-1') });
  const listing1Own = createOwnListing(id, {}, { author: createCurrentUser('user-1') });
  const getListing = () => listing1;
  const getOwnListing = () => listing1Own;

  const props = {
    location: {
      pathname: `/l/${slug}/${id}`,
      search: '',
      hash: '',
    },
    history: {
      push: () => console.log('HistoryPush called'),
    },
    params: { id, slug },
    currentUser,
    getListing,
    getOwnListing,
    intl: fakeIntl,
    authInProgress: false,
    currentUserHasListings: false,
    isAuthenticated: false,
    onLogout: noop,
    onLoadListing: noop,
    onManageDisableScrolling: noop,
    scrollingDisabled: false,
    callSetInitialValues: noop,
    sendVerificationEmailInProgress: false,
    onResendVerificationEmail: noop,
    onInitializeCardPaymentData: noop,
    sendInquiryInProgress: false,
    onSendInquiry: noop,
    listingConfig,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => null,
    onFetchTimeSlots: () => null,
    config: getDefaultConfiguration(),
    routeConfiguration: getRouteConfiguration(),
  };

  test('ListingPageCoverPhoto has hero section', () => {
    render(<ListingPageCoverPhotoComponent {...props} />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();

    const orderTitle = screen.queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
    expect(orderTitle).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ListingPage.reviewsTitle' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })
    ).toBeInTheDocument();
  });

  test('ListingPageCarousel has no hero section', () => {
    render(<ListingPageCarouselComponent {...props} />);
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument();

    const orderTitle = screen.queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
    expect(orderTitle).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ListingPage.reviewsTitle' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })
    ).toBeInTheDocument();
  });
});

describe('Duck', () => {
  const listingFields = [];
  const config = {
    layout: {
      listingImage: {
        aspectWidth: 400,
        aspectHeight: 400,
        variantPrefix: 'listing-card',
      },
    },
    listing: {
      listingFields,
    },
  };

  test('showListing() success', () => {
    const id = new UUID('00000000-0000-0000-0000-000000000000');
    const dispatch = jest.fn(action => action);
    const response = { status: 200 };
    const show = jest.fn(() => Promise.resolve(response));
    const sdk = { listings: { show }, currentUser: { show } };

    return showListing(id, config)(dispatch, null, sdk).then(data => {
      expect(data).toEqual(response);
      expect(show.mock.calls).toEqual([
        [
          expect.objectContaining({
            id,
            'imageVariant.listing-card': 'w:400;h:400;fit:crop',
            'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
            include: ['author', 'author.profileImage', 'images', 'currentStock'],
          }),
        ],
      ]);
      expect(dispatch.mock.calls).toEqual([
        [showListingRequest(id)],
        [expect.anything()], // fetchCurrentUser() call
        [addMarketplaceEntities(data, { listingFields })],
      ]);
    });
  });

  test('showListing() error', () => {
    const id = new UUID('00000000-0000-0000-0000-000000000000');
    const dispatch = jest.fn(action => action);
    const error = new Error('fail');
    const show = jest.fn(() => Promise.reject(error));
    const sdk = { listings: { show } };

    // Calling sdk.listings.show is expected to fail now

    return showListing(id, config)(dispatch, null, sdk).then(data => {
      expect(show.mock.calls).toEqual([
        [
          expect.objectContaining({
            id,
            'imageVariant.listing-card': 'w:400;h:400;fit:crop',
            'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
            include: ['author', 'author.profileImage', 'images', 'currentStock'],
          }),
        ],
      ]);
      expect(dispatch.mock.calls).toEqual([
        [showListingRequest(id)],
        [expect.anything()], // fetchCurrentUser() call
        [showListingError(storableError(error))],
      ]);
    });
  });
});

describe('ActionBarMaybe', () => {
  test('shows users own listing status', () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PUBLISHED,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );

    expect(screen.getByText('ListingPage.ownListing')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  test('shows users own pending listing status', () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PENDING_APPROVAL,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.ownListingPendingApproval')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  test('shows users own closed listing status', () => {
    const listing = createListing('listing-closed', {
      state: LISTING_STATE_CLOSED,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.ownClosedListing')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  test('shows closed listing status', () => {
    const listing = createListing('listing-closed', {
      state: LISTING_STATE_CLOSED,
    });
    render(
      <ActionBarMaybe
        isOwnListing={false}
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.closedListing')).toBeInTheDocument();
  });

  test("is missing if listing is not closed or user's own", () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PUBLISHED,
    });
    const actionBar = render(
      <ActionBarMaybe
        isOwnListing={false}
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(actionBar.asFragment().firstChild).toBeNull();
  });
});
