import React, { useEffect } from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { ASSET_NAME, avHeroSecionId, getRecommendedListingParams, avRecommendedsSectionId } from './LandingPage.duck';

import { getListingsById } from '../../ducks/marketplaceData.duck';
import { searchListings } from '../SearchPage/SearchPage.duck';
import { useConfiguration } from '../../context/configurationContext';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// To load Marketplace texts.
import { useIntl } from '../../util/reactIntl';

// Import custom sections.
import SectionHeroCustom from '../PageBuilder/SectionBuilder/SectionHeroCustom';
import SectionRecommendedListings from '../PageBuilder/SectionBuilder/SectionRecommendedListings';

// Define custom section types. (Based on what default section type?)
const avHeroSectionType = 'hero';
const avRecommendedsSectionType = 'recommendeds'

export const LandingPageComponent = props => {
  const {
    pageAssetsData,
    inProgress,
    error,
    listings,
    recommendedListingIds,
    onFetchRecommendedListings,
  } = props;

  const config = useConfiguration();
  useEffect(() => {
    const params = getRecommendedListingParams(config, recommendedListingIds);
    onFetchRecommendedListings(params, config);
  }, [recommendedListingIds]);

  // Get the data setup in the console for this asset_name (landing-page)
  const pageData = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  const customPageData = createCustomPageData(pageData, listings);

  return (
    <PageBuilder
      pageAssetsData={customPageData}
      options={{
        sectionComponents: {
          [avHeroSectionType]: { component: SectionHeroCustom },
          [avRecommendedsSectionType]: {component: SectionRecommendedListings},
        },
      }}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const createCustomPageData = (pageData, listings) => {
  const intl = useIntl();
  // We will customize the page date since we use custom sections...
  // ... get the custom hero section index in the page sections
  const avHeroSectionIdx = pageData?.sections.findIndex(
    s => s.sectionId === avHeroSecionId
  );
  const avRecommendedsSectionIdx = pageData?.sections.findIndex(
    s => s.sectionId === avRecommendedsSectionId
  );
  // ... and use the idx to get the data setup in the console for the base section (a hero section)
  const heroSection = pageData?.sections[avHeroSectionIdx];
  const recommendedSection = pageData?.sections[avRecommendedsSectionIdx];
  // ... then add the custom data to use on our custom section
  const avHeroSection = {
    ...heroSection,
    sectionId: avHeroSecionId,
    sectionType: avHeroSectionType,
    classWrap: 'contentLeft',
    callToAction: {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'AVHero.ctaFirstLink' }),
      content: intl.formatMessage({ id: 'AVHero.ctaFirstText' }),
    },
    callToAction2: {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'AVHero.ctaSecondLink' }),
      content: intl.formatMessage({ id: 'AVHero.ctaSecondText' }),
    },
  };
  const avRecommendedSection = {
    ...recommendedSection,
    sectionId: avRecommendedsSectionId,
    sectionType: avRecommendedsSectionType,
    listings: listings,
  };
  // ... finally, replace the section's default component with the custom one
  const customSections = pageData
    ? [
        ...pageData?.sections?.map((s, idx) => {
          if (idx === avHeroSectionIdx) {
            return avHeroSection;
          }
          if (idx === avRecommendedsSectionIdx) {
            return avRecommendedSection;
          }
          return s;
          }),
      ]
    : null;
  // ... and replace the data to include the custom data for our custom section.
  const customPageData = pageData
    ? {
        ...pageData,
        sections: customSections,
      }
    : pageData;

  return customPageData;
}

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  const { recommendedListingIds } = state.LandingPage;
  const { currentPageResultIds } = state.SearchPage;
  const listings = getListingsById(state, currentPageResultIds);

  return {
    pageAssetsData,
    inProgress,
    error,
    listings,
    recommendedListingIds,
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchRecommendedListings: (params, config) => {
    dispatch(searchListings(params, config));
  },
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps, mapDispatchToProps))(LandingPageComponent);

export default LandingPage;
