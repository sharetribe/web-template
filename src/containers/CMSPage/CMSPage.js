import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { avHeroSecionId, avPriceSelectorSecionId } from './CMSPage.duck';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// To load Marketplace texts.
import { useIntl } from '../../util/reactIntl';

// Import custom sections.
import SectionHeroCustom from '../PageBuilder/SectionBuilder/SectionHeroCustom';
import SectionPriceSelector from '../PageBuilder/SectionBuilder/SectionPriceSelector';

// Define custom section types. (Based on what default section type?)
const avHeroSectionType = 'hero';
const avPriceSelectorSectionType = 'price-columns';

export const CMSPageComponent = props => {
  const intl = useIntl();
  const { params, pageAssetsData, inProgress, error } = props;
  const pageId = params.pageId || props.pageId;

  if (!inProgress && error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  // We will customize the page date since we use custom sections...
  // ... first we get the data setup in the console for this asset_name (landing-page)
  const pageData = pageAssetsData?.[pageId]?.data;
  // ... then get the custom hero section index in the page sections
  const avHeroSectionIdx = pageData?.sections?.findIndex(
    s => s.sectionId === avHeroSecionId
  );
  const avPriceSelectorSectionIdx = pageData?.sections?.findIndex(
    s => s.sectionId === avPriceSelectorSecionId
  );
  // ... and use the idx to get the data setup in the console for the base section (a hero section)
  const heroSection = pageData?.sections[avHeroSectionIdx];
  const priceSelectorSection = pageData?.sections[avPriceSelectorSectionIdx];
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
  const avPriceSelectorSection = {
    ...priceSelectorSection,
    sectionId: avPriceSelectorSecionId,
    sectionType: avPriceSelectorSectionType,
    classWrap: '',
    plans: {
      set1: [
        {
          title: intl.formatMessage({ id: 'PricingToggle.set1.title1', defaultMessage: 'Hello' }),
          description: intl.formatMessage({ id: 'PricingToggle.set1.description1', defaultMessage: 'Hello' }),
          price: intl.formatMessage({ id: 'PricingToggle.set1.price1', defaultMessage: 'Hello' }),
          priceText: intl.formatMessage({ id: 'PricingToggle.set1.priceText1', defaultMessage: 'Hello' }),
          cta: {
            link: intl.formatMessage({ id: 'PricingToggle.set1.cta1Link', defaultMessage: 'Hello' }),
            text: intl.formatMessage({ id: 'PricingToggle.set1.cta1Text', defaultMessage: 'Hello' }),
          },
          features: intl.formatMessage({ id: 'PricingToggle.set1.features1', defaultMessage: 'Hello' }),
        },
        {
          title: intl.formatMessage({ id: 'PricingToggle.set1.title2', defaultMessage: 'Hello' }),
          description: intl.formatMessage({ id: 'PricingToggle.set1.description2', defaultMessage: 'Hello' }),
          price: intl.formatMessage({ id: 'PricingToggle.set1.price2', defaultMessage: 'Hello' }),
          priceText: intl.formatMessage({ id: 'PricingToggle.set1.priceText2', defaultMessage: 'Hello' }),
          cta: {
            link: intl.formatMessage({ id: 'PricingToggle.set1.cta2Link', defaultMessage: 'Hello' }),
            text: intl.formatMessage({ id: 'PricingToggle.set1.cta2Text', defaultMessage: 'Hello' }),
          },
          features: intl.formatMessage({ id: 'PricingToggle.set1.features2', defaultMessage: 'Hello' }),
        },
      ],
      set2: [
        {
          title: intl.formatMessage({ id: 'PricingToggle.set2.title1', defaultMessage: 'Hello' }),
          description: intl.formatMessage({ id: 'PricingToggle.set2.description1', defaultMessage: 'Hello' }),
          price: intl.formatMessage({ id: 'PricingToggle.set2.price1', defaultMessage: 'Hello' }),
          priceText: intl.formatMessage({ id: 'PricingToggle.set2.priceText1', defaultMessage: 'Hello' }),
          cta: {
            link: intl.formatMessage({ id: 'PricingToggle.set2.cta1Link', defaultMessage: 'Hello' }),
            text: intl.formatMessage({ id: 'PricingToggle.set2.cta1Text', defaultMessage: 'Hello' }),
          },
          features: intl.formatMessage({ id: 'PricingToggle.set2.features1', defaultMessage: 'Hello' }),
        },
        {
          title: intl.formatMessage({ id: 'PricingToggle.set2.title2', defaultMessage: 'Hello' }),
          description: intl.formatMessage({ id: 'PricingToggle.set2.description2', defaultMessage: 'Hello' }),
          price: intl.formatMessage({ id: 'PricingToggle.set2.price2', defaultMessage: 'Hello' }),
          priceText: intl.formatMessage({ id: 'PricingToggle.set2.priceText2', defaultMessage: 'Hello' }),
          cta: {
            link: intl.formatMessage({ id: 'PricingToggle.set2.cta2Link', defaultMessage: 'Hello' }),
            text: intl.formatMessage({ id: 'PricingToggle.set2.cta2Text', defaultMessage: 'Hello' }),
          },
          features: intl.formatMessage({ id: 'PricingToggle.set2.features2', defaultMessage: 'Hello' }),
        },
      ],
    },
    toggles: {
      cta1: intl.formatMessage({ id: 'PricingToggle.toggleSet1', defaultMessage: ' ' }),
      cta2: intl.formatMessage({ id: 'PricingToggle.toggleSet2', defaultMessage: ' ' })
    },
  };

  // ... finally, replace the section's default component with the custom one
  const customSections = pageData
    ? [
        ...pageData?.sections?.map((s, idx) => {
          if (idx === avHeroSectionIdx) {
            return avHeroSection;
          }
          if (idx === avPriceSelectorSectionIdx) {
            return avPriceSelectorSection;
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
      options={{
        sectionComponents: {
          [avHeroSectionType]: { component: SectionHeroCustom },
          [avPriceSelectorSectionType]: { component: SectionPriceSelector },
        },
      }}
      inProgress={inProgress}
      schemaType="Article"
    />
  );
};

CMSPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
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
const CMSPage = compose(
  withRouter,
  connect(mapStateToProps)
)(CMSPageComponent);

export default CMSPage;
