import React from 'react';
import { createListing } from '../../util/test-data';
import { LISTING_STATE_CLOSED } from '../../util/types';
import OrderPanel from './OrderPanel';
import css from './OrderPanelExample.module.css';

export const Default = {
  component: OrderPanel,
  props: {
    className: css.example,
    listing: createListing('listing_1'),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: () => null,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => null,
  },
  group: 'payment',
};

export const WithClosedListing = {
  component: OrderPanel,
  props: {
    className: css.example,
    listing: createListing('listing_1', { state: LISTING_STATE_CLOSED }),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: () => null,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => null,
  },
  group: 'payment',
};
