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
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { ProfilePageComponent } from './ProfilePage';

const { screen } = testingLibrary;

const attributes = {
  profile: {
    bio: 'I am a great cook!',
    publicData: {
      canCook: true,
      cuisine: 'italian',
      dietaryPreferences: ['vegan', 'gluten-free'],
      kitchenDescription: 'This is a kitchen description!',
      numberOfCookbooks: 10,
    },
  },
};

describe('ProfilePage', () => {
  const l1 = createListing('l1');
  const r1 = createReview(
    'review-id',
    {
      createdAt: new Date(Date.UTC(2024, 2, 19, 11, 34)),
      content: 'Awesome!',
    },
    { author: createUser('reviewerA') }
  );

  const props = {
    currentUser: createCurrentUser('userId', attributes),
    user: createUser('userId', attributes),
    scrollingDisabled: false,
    listings: [l1],
    reviews: [r1],
    intl: fakeIntl,
    userShowError: null,
    queryListingsError: null,
    queryReviewsError: null,
    viewport: fakeViewport,
  };

  it('Check that user name and bio is shown correctly', () => {
    render(<ProfilePageComponent {...props} />);
    expect(screen.getByText('ProfilePage.desktopHeading')).toBeInTheDocument();
    expect(screen.getByText('I am a great cook!')).toBeInTheDocument();
  });

  it('Check that custom user information is shown correctly', () => {
    const { getByRole } = render(<ProfilePageComponent {...props} />);

    expect(screen.getByText('ProfilePage.customFieldsHeading')).toBeInTheDocument();

    // Show custom fields correctly
    expect(getByRole('heading', { name: 'ProfilePage.detailsTitle' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Dietary preferences' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Description of your kitchen' })).toBeInTheDocument();

    expect(screen.getByText('Favorite cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Can you cook?')).toBeInTheDocument();
    expect(screen.getByText('ProfilePage.detailYes')).toBeInTheDocument();
    expect(screen.getByText('How many cookbooks do you have')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('This is a kitchen description!')).toBeInTheDocument();
  });

  it('Check that listing information is shown correctly', () => {
    render(<ProfilePageComponent {...props} />);

    expect(screen.getByText('ProfilePage.listingsTitle')).toBeInTheDocument();
    expect(screen.getByText('l1 title')).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('Check that review information is shown correctly', () => {
    const { getByRole } = render(<ProfilePageComponent {...props} />);

    expect(
      getByRole('heading', { name: 'ProfilePage.reviewsFromMyCustomersTitle' })
    ).toBeInTheDocument();

    expect(screen.getByText('Awesome!')).toBeInTheDocument();
    expect(screen.getByText('reviewerA display name')).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getAllByTitle('3/5')).toHaveLength(2);
  });
});
