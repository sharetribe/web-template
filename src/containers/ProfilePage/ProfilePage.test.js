import React from 'react';
import '@testing-library/jest-dom';

import {
  createCurrentUser,
  createListing,
  createReview,
  createUser,
  fakeIntl,
  fakeViewport,
} from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import ProfilePage from './ProfilePage';

const { screen } = testingLibrary;

const attributes = {
  profile: {
    bio: 'I am a great cook!',
    publicData: {
      canCook: false,
      cuisine: 'italian',
      dietaryPreferences: ['vegan', 'gluten-free'],
      kitchenDescription: 'This is a kitchen description!',
      numberOfCookbooks: 10,
      userType: 'a',
      notShownInProfileAttribute: 'Do not show this in profile',
    },
  },
};

// Passing 'attributes' directly to createCurrentUser and createUser
// overrides the default attributes.profile values with the custom ones.
// This function first creates the default version and then appends extra attributes
// without overriding the defaults.
const createEnhancedUser = (userFn, id) => {
  const user = userFn(id);
  return {
    ...user,
    attributes: {
      ...user.attributes,
      profile: {
        ...user.attributes.profile,
        bio: attributes.profile.bio,
        publicData: attributes.profile.publicData,
      },
    },
  };
};

const getInitialState = () => {
  const currentUser = createEnhancedUser(createCurrentUser, 'userId');
  const user = createEnhancedUser(createUser, 'userId');
  const listing = createListing('l1');
  const review = createReview(
    'review-id',
    {
      createdAt: new Date(Date.UTC(2024, 2, 19, 11, 34)),
      content: 'Awesome!',
    },
    { author: createUser('reviewerA') }
  );
  return {
    ProfilePage: {
      userId: user.id,
      userListingRefs: [{ id: listing.id, type: 'listing' }],
      userShowError: null,
      queryListingsError: null,
      reviews: [review],
      queryReviewsError: null,
    },
    user: {
      currentUser,
      currentUserHasListings: false,
      sendVerificationEmailInProgress: false,
    },
    marketplaceData: {
      entities: {
        user: {
          userId: user,
        },
        listing: {
          l1: { ...listing, relationships: { author: user } },
        },
      },
    },
  };
};

describe('ProfilePage', () => {
  const config = getHostedConfiguration();

  const props = {
    scrollingDisabled: false,
    intl: fakeIntl,
    viewport: fakeViewport,
    params: {},
  };

  it('Check that user name and bio is shown correctly', () => {
    render(<ProfilePage {...props} />, {
      initialState: getInitialState(),
      config,
    });
    expect(screen.getByText('ProfilePage.desktopHeading')).toBeInTheDocument();
    expect(screen.getByText('I am a great cook!')).toBeInTheDocument();
  });

  it('Check that custom user information is shown correctly', () => {
    const { getByRole } = render(<ProfilePage {...props} />, {
      initialState: getInitialState(),
      config,
    });

    // Show custom fields correctly
    expect(getByRole('heading', { name: 'ProfilePage.detailsTitle' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Dietary preferences' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Description of your kitchen' })).toBeInTheDocument();

    expect(screen.getByText('Favorite cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Can you cook?')).toBeInTheDocument();
    expect(screen.getByText('ProfilePage.detailNo')).toBeInTheDocument();
    expect(screen.getByText('How many cookbooks do you have')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('This is a kitchen description!')).toBeInTheDocument();

    // For attributes with displayInProfile: false, do not show the attribute
    expect(screen.queryByText('Not shown in profile')).toBeNull();
  });

  it('Check that listing information is shown correctly', () => {
    render(<ProfilePage {...props} />, {
      initialState: getInitialState(),
      config,
    });

    expect(screen.getByText('ProfilePage.listingsTitle')).toBeInTheDocument();
    expect(screen.getByText('l1 title')).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('Check that review information is shown correctly', () => {
    const { getByRole } = render(<ProfilePage {...props} />, {
      initialState: getInitialState(),
      config,
    });

    expect(
      getByRole('heading', { name: 'ProfilePage.reviewsFromMyCustomersTitle' })
    ).toBeInTheDocument();

    expect(screen.getByText('Awesome!')).toBeInTheDocument();
    expect(screen.getByText('reviewerA display name')).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getAllByTitle('3/5')).toHaveLength(2);
  });
});
