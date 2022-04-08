import React from 'react';
import { createListing } from '../../util/test-data';
import { LISTING_STATE_CLOSED } from '../../util/types';
import OrderPanel from './OrderPanel';
import css from './OrderPanelExample.module.css';

const noop = () => null;

export const Default = {
  component: OrderPanel,
  props: {
    className: css.example,
    listing: createListing('listing_1', { availabilityPlan: { timezone: 'Etc/UTC' } }),
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
    listing: createListing('listing_1', {
      availabilityPlan: { timezone: 'Etc/UTC' },
      state: LISTING_STATE_CLOSED,
    }),
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
