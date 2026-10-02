import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';
import { fetchFeaturedListings } from '../../ducks/featuredListings.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { getFeaturedListingsProps } from '../../util/data';

import LandingHero from './LandingHero/LandingHero';
const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;

  const pageData = pageAssetsData?.[camelize(ASSET_NAME)]?.data;

  // Render LandingHero in place of the first Console hero section (keeping its background image).
  // If the page has no hero section, LandingHero is prepended to the page.
  const sections = pageData?.sections || [];
  const heroIndex = sections.findIndex(s => s.sectionType === 'hero');
  const sectionsWithHero =
    heroIndex >= 0
      ? sections.map((s, i) => (i === heroIndex ? { ...s, sectionType: 'landingHero' } : s))
      : [{ sectionType: 'landingHero', sectionId: 'landing-hero' }, ...sections];
  const pageDataWithHero = pageData ? { ...pageData, sections: sectionsWithHero } : pageData;

  return (
    <PageBuilder
      pageAssetsData={pageDataWithHero}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
      currentPage="LandingPage"
      options={{
        sectionComponents: {
          landingHero: { component: LandingHero },
        },
      }}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  const featuredListingData = state.featuredListings || {};

  const getListingEntitiesById = listingIds => getListingsById(state, listingIds);

  return { pageAssetsData, featuredListingData, getListingEntitiesById, inProgress, error };
};

const mapDispatchToProps = dispatch => ({
  onFetchFeaturedListings: (sectionId, parentPage, listingImageConfig, allSections) =>
    dispatch(fetchFeaturedListings({ sectionId, parentPage, listingImageConfig, allSections })),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(LandingPageComponent);

export default LandingPage;
