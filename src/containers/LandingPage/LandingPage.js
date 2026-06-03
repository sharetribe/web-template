import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';
import { useConfiguration } from '../../context/configurationContext';
import { useIntl } from '../../util/reactIntl';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';
import {
  getPageBuilderOptions,
  selectExtensionProps,
  transformPageData,
} from '../../extensions/landingPage';
import { fetchFeaturedListings } from '../../ducks/featuredListings.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { getFeaturedListingsProps } from '../../util/data';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error, extensionData } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const pageData = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  const customPageData = transformPageData({ pageData, intl, config, extensionData });
  const pageBuilderOptions = getPageBuilderOptions({ intl, config, extensionData });

  return (
    <PageBuilder
      pageAssetsData={customPageData}
      options={pageBuilderOptions}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
      featuredListings={getFeaturedListingsProps(camelize(ASSET_NAME), props)}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
  extensionData: object,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  const pageData = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  const extensionData = selectExtensionProps({ state, pageData });
  const featuredListingData = state.featuredListings || {};
  const getListingEntitiesById = listingIds => getListingsById(state, listingIds);

  return {
    pageAssetsData,
    inProgress,
    error,
    extensionData,
    featuredListingData,
    getListingEntitiesById,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchFeaturedListings: (sectionId, parentPage, listingImageConfig, allSections) =>
    dispatch(fetchFeaturedListings({ sectionId, parentPage, listingImageConfig, allSections })),
});

const LandingPage = compose(connect(mapStateToProps, mapDispatchToProps))(LandingPageComponent);

export default LandingPage;
