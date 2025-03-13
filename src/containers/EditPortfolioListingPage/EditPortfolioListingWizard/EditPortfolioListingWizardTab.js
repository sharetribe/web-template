import React from 'react';
import { useDispatch } from 'react-redux';

import { createResourceLocatorString } from '../../../util/routes';
import { EditPortfolioListingDetailsPanel } from './EditPortfolioListingDetailsPanel/EditPortfolioListingDetailsPanel';
import css from './EditPortfolioListingWizardTab.module.css';
import { EditPortfolioListingItemsPanel } from './EditPortfolioListingItemsPanel/EditPortfolioListingItemsPanel';
import { PAGE_MODE_EDIT } from '../../BatchEditListingPage/constants';
import { updateListingMedia } from '../EditPortfolioListingPage.duck';

export const DETAILS = 'details';
export const ITEMS = 'items';

export const EditPortfolioListingWizardTab = props => {
  const { tab, params, history, routeConfiguration, config, isLoading } = props;
  const dispatch = useDispatch();

  const onCompleteDetailsTab = listing => {
    const nextTab = { ...params, id: listing.id.uuid, tab: ITEMS, mode: PAGE_MODE_EDIT };
    const to = createResourceLocatorString(
      'EditPortfolioListingPage',
      routeConfiguration,
      nextTab,
      {}
    );
    history.push(to);
  };

  const onUpdateListing = async listing => {
    await dispatch(updateListingMedia(listing, config));
    const to = createResourceLocatorString(
      'ManageListingsPage',
      routeConfiguration,
      {},
      {
        pub_listingId: listing.id.uuid,
        pub_listingType: 'portfolio-showcase',
      }
    );
    history.push(to);
  };

  switch (tab) {
    case DETAILS: {
      return (
        <EditPortfolioListingDetailsPanel
          className={css.panel}
          onSubmit={onCompleteDetailsTab}
          config={config}
          isLoading={isLoading}
        />
      );
    }
    case ITEMS: {
      return (
        <EditPortfolioListingItemsPanel
          className={css.panel}
          config={config}
          onUpdateListing={onUpdateListing}
          isLoading={isLoading}
        ></EditPortfolioListingItemsPanel>
      );
    }
    default:
      return null;
  }
};
