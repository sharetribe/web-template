import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import { ASSET_NAME, avHeroSecionId } from './LandingPage.duck';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// To load Marketplace texts.
import { useIntl } from '../../util/reactIntl';

// Import custom sections.
import SectionHeroCustom from '../PageBuilder/SectionBuilder/SectionHeroCustom';

// Define custom section types. (Based on what default section type?)
const avHeroSectionType = 'hero';

export const LandingPageComponent = props => {
  const intl = useIntl();
  const { pageAssetsData, inProgress, error } = props;

  // We will customize the page date since we use custom sections...
  // ... first we get the data setup in the console for this asset_name (landing-page)
  const pageData = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  // ... then get the custom hero section index in the page sections
  const avHeroSectionIdx = pageData?.sections.findIndex(
    s => s.sectionId === avHeroSecionId
  );
  // ... and use the idx to get the data setup in the console for the base section (a hero section)
  const heroSection = pageData?.sections[avHeroSectionIdx];
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
  // ... finally, replace the section's default component with the custom one
  const customSections = pageData
    ? [
        // customCurrentUserSection,
        ...pageData?.sections?.map((s, idx) => {
          if (idx === avHeroSectionIdx) {
            return avHeroSection;
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

  return (
    <PageBuilder
      pageAssetsData={customPageData}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
      options={{
        sectionComponents: {
          [avHeroSectionType]: { component: SectionHeroCustom },
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
  return { pageAssetsData, inProgress, error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
