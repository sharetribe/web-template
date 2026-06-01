import React from 'react';
import '@testing-library/jest-dom';

import { createListing, createUser } from '../../util/testData';
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
  it('displays mapped all_sizes labels in stored order without a label', () => {
    renderCard({ all_sizes: ['m', 's'] });

    expect(screen.queryByText('Size:')).not.toBeInTheDocument();
    expect(screen.getByText('Medium, Small')).toBeInTheDocument();
  });

  it('hides size row when all_sizes is empty', () => {
    renderCard({ all_sizes: [] });

    expect(screen.queryByText('Medium, Small')).not.toBeInTheDocument();
  });

  it('hides size row when all_sizes is missing', () => {
    renderCard({});

    expect(screen.queryByText('Medium, Small')).not.toBeInTheDocument();
  });

  it('shows the original price struck through when higher than the price', () => {
    renderCard({ originalPrice: { amount: 8000, currency: 'USD' } });

    // Current price is $55.00 (5500); original is $80.00.
    expect(screen.getByText('$80.00').tagName).toBe('S');
  });

  it('hides the original price when not higher than the price', () => {
    renderCard({ originalPrice: { amount: 5000, currency: 'USD' } });

    expect(screen.queryByText('$50.00')).not.toBeInTheDocument();
  });

  it('shows store-type tags for vendedor-tienda authors', () => {
    const listing = createListing(
      'av-store-card',
      {
        publicData: {
          listingType: 'product-selling',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
        },
      },
      {
        author: createUser('store-1', {
          profile: {
            displayName: 'Store One',
            abbreviatedName: 'SO',
            publicData: { userType: 'vendedor-tienda', tipoTienda: ['trending', 'holiday'] },
          },
        }),
      }
    );

    render(<AVListingCard listing={listing} showAuthorInfo={false} />, {
      config,
      messages: {
        'ListingCard.price': '{priceValue}{pricePerUnit}',
        'ListingCard.perUnit': ' per {unitType}',
      },
    });

    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
  });
});
