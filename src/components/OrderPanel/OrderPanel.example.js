import React from 'react';
import { LISTING_STATE_CLOSED } from '../../util/types';
import { createListing, createUser } from '../../util/testData';
import OrderPanel from './OrderPanel';
import css from './OrderPanelExample.module.css';

const noop = () => null;

const validListingTypes = [
  {
    listingType: 'rent-bicycles-daily',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'day',
    },
  },
];

export const Default = {
  component: OrderPanel,
  props: {
    className: css.example,
    marketplaceCurrency: 'USD',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
    listing: createListing('listing_1', {
      availabilityPlan: { timezone: 'Etc/UTC' },
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
      },
    }),
    validListingTypes,
    author: createUser('AuthorX'),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: noop,
    onFetchTimeSlots: noop,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => console.log('onFetchTransactionLineItems'),
  },
  group: 'payment',
};

export const WithClosedListing = {
  component: OrderPanel,
  props: {
    className: css.example,
    marketplaceCurrency: 'USD',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
    listing: createListing('listing_1', {
      availabilityPlan: { timezone: 'Etc/UTC' },
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
      },
      state: LISTING_STATE_CLOSED,
    }),
    validListingTypes,
    author: createUser('AuthorX'),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: noop,
    onFetchTimeSlots: noop,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => console.log('onFetchTransactionLineItems'),
  },
  group: 'payment',
};
