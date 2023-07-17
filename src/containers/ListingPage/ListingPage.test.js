import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createUser,
  createCurrentUser,
  createListing,
  createOwnListing,
  createReview,
} from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
} from '../../util/testHelpers';

import { storableError } from '../../util/errors';

import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  LISTING_STATE_CLOSED,
} from '../../util/types';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { showListingRequest, showListingError, showListing } from './ListingPage.duck';

import ActionBarMaybe from './ActionBarMaybe';

const { UUID } = sdkTypes;
const { screen, waitFor, within } = testingLibrary;
const noop = () => null;

const listingTypes = [
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  },
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
  },
];

const listingFields = [
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
];

const getConfig = variantType => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingTypes: {
      listingTypes,
    },
    listingFields: {
      listingFields,
    },
    layout: {
      ...hostedConfig.layout,
      listingPage: { variantType },
    },
  };
};

describe('ListingPage variants', () => {
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
  const review = createReview(
    'review-id',
    {
      createdAt: new Date(Date.UTC(2023, 5, 19, 11, 34)),
      rating: 4,
      type: 'ofProvider',
      content: 'It was awesome!',
    },
    { author: createUser('reviewerA'), listing: listing1 }
  );

  // We'll initialize the store with relevant listing data
  const initialState = {
    ListingPage: {
      id: listing1.id,
      showListingError: null,
      reviews: [review],
      fetchReviewsError: null,
      monthlyTimeSlots: {
        // '2022-03': {
        //   timeSlots: [],
        //   fetchTimeSlotsError: null,
        //   fetchTimeSlotsInProgress: null,
        // },
      },
      lineItems: null,
      fetchLineItemsInProgress: false,
      fetchLineItemsError: null,
      sendInquiryInProgress: false,
      sendInquiryError: null,
      inquiryModalOpenForListingId: null,
    },
    marketplaceData: {
      entities: {
        listing: {
          listing1,
        },
        ownListing: {
          listing1: listing1Own,
        },
      },
    },
  };

  const commonProps = {
    params: { id, slug },
    scrollingDisabled: false,
    onManageDisableScrolling: noop,
    callSetInitialValues: noop,
    onFetchTransactionLineItems: noop,
    onSendInquiry: noop,
    onInitializeCardPaymentData: noop,
    onFetchTimeSlots: noop,
  };

  it('has hero section in coverPhoto mode', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('coverPhoto');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const listingRouteConfig = routeConfiguration.find(conf => conf.name === 'ListingPage');
    const ListingPage = listingRouteConfig.component;

    const { getByPlaceholderText, getByRole, queryAllByRole, getByText } = render(
      <ListingPage {...props} />,
      {
        initialState,
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Has main search in Topbar and it's a location search.
      expect(getByPlaceholderText('TopbarSearchForm.placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('location-search')).toBeInTheDocument();

      // Has hero (coverPhoto) section
      expect(screen.getByTestId('hero')).toBeInTheDocument();
      expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();

      // Has order title (rendered for )
      const orderTitle = queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
      expect(orderTitle).toHaveLength(3);

      // Has details section title and selected category info
      expect(getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
      expect(getByText('Category')).toBeInTheDocument();
      expect(getByText('Cat 1')).toBeInTheDocument();

      // Has details location title
      expect(getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();

      // Has details reviews title
      const reviewsTitle = getByRole('heading', { name: 'ListingPage.reviewsTitle' });
      expect(reviewsTitle).toBeInTheDocument();
      const sectionReviews = within(reviewsTitle.parentNode.parentNode);
      expect(sectionReviews.getByText('It was awesome!')).toBeInTheDocument();
      expect(sectionReviews.getByText('reviewerA display name')).toBeInTheDocument();
      expect(sectionReviews.getByText('June 2023')).toBeInTheDocument();
      expect(sectionReviews.getAllByTitle('4/5')).toHaveLength(2);

      // Has details provider/author title
      expect(getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })).toBeInTheDocument();
      // Has link to provider's profile
      expect(getByRole('link', { name: 'UserCard.viewProfileLink' })).toBeInTheDocument();
      // Has button to contact provider
      expect(getByRole('button', { name: 'UserCard.contactUser' })).toBeInTheDocument();
    });
  });

  it('has carousel on carousel mode', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('carousel');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const listingRouteConfig = routeConfiguration.find(conf => conf.name === 'ListingPage');
    const ListingPage = listingRouteConfig.component;

    const { getByPlaceholderText, getByRole, queryAllByRole, getByText } = render(
      <ListingPage {...props} />,
      {
        initialState,
        config,
        routeConfiguration,
      }
    );
    await waitFor(() => {
      // Has main search in Topbar and it's a location search.
      expect(getByPlaceholderText('TopbarSearchForm.placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('location-search')).toBeInTheDocument();

      // Does not have hero (coverPhoto) section on carousel mode
      expect(screen.getByTestId('carousel')).toBeInTheDocument();
      expect(screen.queryByTestId('hero')).not.toBeInTheDocument();

      // Has order title (rendered for )
      const orderTitle = queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
      expect(orderTitle).toHaveLength(3);

      // Has details section title and selected category info
      expect(getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
      expect(getByText('Category')).toBeInTheDocument();
      expect(getByText('Cat 1')).toBeInTheDocument();

      // Has details location title
      expect(getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();

      // Has details reviews title
      const reviewsTitle = getByRole('heading', { name: 'ListingPage.reviewsTitle' });
      expect(reviewsTitle).toBeInTheDocument();
      const sectionReviews = within(reviewsTitle.parentNode.parentNode);
      expect(sectionReviews.getByText('It was awesome!')).toBeInTheDocument();
      expect(sectionReviews.getByText('reviewerA display name')).toBeInTheDocument();
      expect(sectionReviews.getByText('June 2023')).toBeInTheDocument();
      expect(sectionReviews.getAllByTitle('4/5')).toHaveLength(2);

      // Has details provider/author title
      expect(getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })).toBeInTheDocument();
      // Has link to provider's profile
      expect(getByRole('link', { name: 'UserCard.viewProfileLink' })).toBeInTheDocument();
      // Has button to contact provider
      expect(getByRole('button', { name: 'UserCard.contactUser' })).toBeInTheDocument();
    });
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

  it('showListing() success', () => {
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

  it('showListing() error', () => {
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
  it('shows users own listing status', () => {
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

  it('shows users own pending listing status', () => {
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

  it('shows users own closed listing status', () => {
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

  it('shows closed listing status', () => {
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

  it("is missing if listing is published but not user's own", () => {
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
