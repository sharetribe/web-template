import React from 'react';
import { createListing, createUser } from '../../util/testData';
import { LISTING_STATE_CLOSED } from '../../util/types';
import OrderPanel from './OrderPanel';
import css from './OrderPanelExample.module.css';

const noop = () => null;

export const Default = {
  component: OrderPanel,
  props: {
    className: css.example,
    marketplaceCurrency: 'USD',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
    listing: createListing('listing_1', { availabilityPlan: { timezone: 'Etc/UTC' } }),
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
      state: LISTING_STATE_CLOSED,
    }),
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
