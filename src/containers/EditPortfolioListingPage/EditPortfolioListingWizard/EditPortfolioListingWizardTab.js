import React from 'react';
import { useDispatch } from 'react-redux';

import { createResourceLocatorString } from '../../../util/routes';
import { EditPortfolioListingDetailsPanel } from './EditPortfolioListingDetailsPanel/EditPortfolioListingDetailsPanel';
import css from './EditPortfolioListingWizardTab.module.css';
import { EditPortfolioListingItemsPanel } from './EditPortfolioListingItemsPanel/EditPortfolioListingItemsPanel';
import { EditPortfolioListingVideosPanel } from './EditPortfolioListingVideosPanel/EditPortfolioListingVideosPanel';
import { PAGE_MODE_EDIT } from '../../BatchEditListingPage/constants';
import { updateListingMedia } from '../EditPortfolioListingPage.duck';

export const DETAILS = 'details';
export const IMAGES = 'images';
export const VIDEOS = 'videos';

export const EditPortfolioListingWizardTab = props => {
  const { tab, params, history, routeConfiguration, config, isLoading } = props;
  const dispatch = useDispatch();

  const onCompleteDetailsTab = listing => {
    const nextTab = { ...params, id: listing.id.uuid, tab: IMAGES, mode: PAGE_MODE_EDIT };
    const to = createResourceLocatorString(
      'EditPortfolioListingPage',
      routeConfiguration,
      nextTab,
      {}
    );
    history.push(to);
  };

  const onSaveImagesAndNavigateToVideos = async listing => {
    await dispatch(updateListingMedia(listing, config));
    const nextTab = {
      ...params,
      id: listing.id.uuid || listing.id,
      tab: VIDEOS,
      mode: PAGE_MODE_EDIT,
    };
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
        pub_listingId: listing.id.uuid || listing.id,
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
    case IMAGES: {
      return (
        <EditPortfolioListingItemsPanel
          className={css.panel}
          config={config}
          onUpdateListing={onUpdateListing}
          onNavigateToVideos={onSaveImagesAndNavigateToVideos}
          isLoading={isLoading}
          mediaType={IMAGES}
        />
      );
    }
    case VIDEOS: {
      return (
        <EditPortfolioListingVideosPanel
          className={css.panel}
          config={config}
          onUpdateListing={onUpdateListing}
          isLoading={isLoading}
        />
      );
    }
    default:
      return null;
  }
};
