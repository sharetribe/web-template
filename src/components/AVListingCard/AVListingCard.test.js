import React from 'react';
import '@testing-library/jest-dom';

import { createListing } from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import AVListingCard from './AVListingCard';

const { screen } = testingLibrary;

const config = {
  ...getHostedConfiguration(),
  listingFields: {
    listingFields: [
      {
        key: 'all_sizes',
        scope: 'public',
        schemaType: 'multi-enum',
        enumOptions: [
          { option: 's', label: 'Small' },
          { option: 'm', label: 'Medium' },
        ],
      },
    ],
  },
};

const renderCard = publicData => {
  const listing = createListing('av-listing-card-test', {
    publicData: {
      listingType: 'product-selling',
      transactionProcessAlias: 'default-purchase/release-1',
      unitType: 'item',
      ...publicData,
    },
  });

  return render(<AVListingCard listing={listing} showAuthorInfo={false} />, {
    config,
    messages: {
      'AVListingCard.sizeLabel': 'Size:',
      'ListingCard.price': '{priceValue}{pricePerUnit}',
      'ListingCard.perUnit': ' per {unitType}',
    },
  });
};

describe('AVListingCard', () => {
  it('displays mapped all_sizes labels in stored order', () => {
    renderCard({ all_sizes: ['m', 's'] });

    expect(screen.getByText('Size:')).toBeInTheDocument();
    expect(screen.getByText('Medium, Small')).toBeInTheDocument();
  });

  it('hides size row when all_sizes is empty', () => {
    renderCard({ all_sizes: [] });

    expect(screen.queryByText('Size:')).not.toBeInTheDocument();
  });

  it('hides size row when all_sizes is missing', () => {
    renderCard({});

    expect(screen.queryByText('Size:')).not.toBeInTheDocument();
  });
});
