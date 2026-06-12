import {
  AV_HERO2_SECTION_TYPE,
  AV_HERO3_SECTION_TYPE,
  AV_VIDEO_SECTION_TYPE,
  AV_RECOMMENDEDS_SECTION_TYPE,
  AV_SELECTIONS_SECTION_TYPE,
  AV_TAG_LISTINGS_SECTION_TYPE,
  AV_SELECTED_CATS_SECTION_TYPE,
  AV_SELECTED_USERS_SECTION_TYPE,
  AV_INSTA_GRID_SECTION_TYPE,
} from './constants';
import { loadCustomSectionListings, selectCustomSectionListings } from './listings';
import { transformCustomSections } from './transform';

let cachedSectionComponents;

const getSectionComponents = () => {
  if (cachedSectionComponents) {
    return cachedSectionComponents;
  }

  const SectionHeroCustom2 = require('../../../containers/PageBuilder/SectionBuilder/SectionHeroCustom2')
    .default;
  const SectionHeroCustom3 = require('../../../containers/PageBuilder/SectionBuilder/SectionHeroCustom3')
    .default;
  const SectionVideoSection = require('../../../containers/PageBuilder/SectionBuilder/SectionVideoSection')
    .default;
  const SectionRecommendedListings = require('../../../containers/PageBuilder/SectionBuilder/SectionRecommendedListings')
    .default;
  const SectionSelectedListings = require('../../../containers/PageBuilder/SectionBuilder/SectionSelectedListings')
    .default;
  const SectionTagCatListings = require('../../../containers/PageBuilder/SectionBuilder/SectionTagCatListings')
    .default;
  const SectionSelectedCat = require('../../../containers/PageBuilder/SectionBuilder/SectionSelectedCat')
    .default;
  const SectionSelectedUser = require('../../../containers/PageBuilder/SectionBuilder/SectionSelectedUser')
    .default;
  const SectionInstaGrid = require('../../../containers/PageBuilder/SectionBuilder/SectionInstaGrid')
    .default;

  cachedSectionComponents = {
    [AV_HERO2_SECTION_TYPE]: { component: SectionHeroCustom2 },
    [AV_HERO3_SECTION_TYPE]: { component: SectionHeroCustom3 },
    [AV_VIDEO_SECTION_TYPE]: { component: SectionVideoSection },
    [AV_RECOMMENDEDS_SECTION_TYPE]: { component: SectionRecommendedListings },
    [AV_SELECTIONS_SECTION_TYPE]: { component: SectionSelectedListings },
    [AV_TAG_LISTINGS_SECTION_TYPE]: { component: SectionTagCatListings },
    [AV_SELECTED_CATS_SECTION_TYPE]: { component: SectionSelectedCat },
    [AV_SELECTED_USERS_SECTION_TYPE]: { component: SectionSelectedUser },
    [AV_INSTA_GRID_SECTION_TYPE]: { component: SectionInstaGrid },
  };

  return cachedSectionComponents;
};

export const loadDataExtension = ({ assetResp, dispatch, config }) => {
  const pageData = assetResp?.landingPage?.data;
  return loadCustomSectionListings({ pageData, dispatch, config });
};

export const selectExtensionProps = ({ state, pageData }) => {
  return selectCustomSectionListings({ state, pageData });
};

export const getPageBuilderOptions = ({ extensionData }) => {
  if (!extensionData?.hasCustomSections) {
    return undefined;
  }

  return {
    sectionComponents: getSectionComponents(),
  };
};

export const transformPageData = ({ pageData, intl, extensionData }) => {
  return transformCustomSections({ pageData, intl, extensionData });
};

export const avLandingPageExtension = {
  loadDataExtension,
  selectExtensionProps,
  getPageBuilderOptions,
  transformPageData,
};

export default avLandingPageExtension;
