import {
  AV_HERO2_SECTION_ID_PREFIX,
  AV_HERO3_SECTION_ID_PREFIX,
  AV_VIDEO_SECTION_ID_PREFIX,
  AV_RECOMMENDEDS_SECTION_ID,
  AV_SELECTIONS_SECTION_ID_PREFIX,
  AV_TAG_LISTINGS_SECTION_ID_PREFIX,
  AV_SELECTED_CATS_SECTION_ID_PREFIX,
  AV_SELECTED_USERS_SECTION_ID_PREFIX,
  AV_INSTA_GRID_SECTION_ID_PREFIX,
} from './constants';

export const getListingIdsFromSection = section =>
  section?.blocks?.map(block => block?.blockName).filter(Boolean) || [];

export const isHero2SectionId = sectionId =>
  (sectionId || '').indexOf(AV_HERO2_SECTION_ID_PREFIX) === 0;

export const isHero3SectionId = sectionId =>
  (sectionId || '').indexOf(AV_HERO3_SECTION_ID_PREFIX) === 0;

export const isVideoSectionId = sectionId =>
  (sectionId || '').indexOf(AV_VIDEO_SECTION_ID_PREFIX) === 0;

export const isSelectionsSectionId = sectionId =>
  (sectionId || '').indexOf(AV_SELECTIONS_SECTION_ID_PREFIX) === 0;

export const isTagListingsSectionId = sectionId =>
  (sectionId || '').indexOf(AV_TAG_LISTINGS_SECTION_ID_PREFIX) === 0;

export const isSelectedCatsSectionId = sectionId =>
  (sectionId || '').indexOf(AV_SELECTED_CATS_SECTION_ID_PREFIX) === 0;

export const isSelectedUsersSectionId = sectionId =>
  (sectionId || '').indexOf(AV_SELECTED_USERS_SECTION_ID_PREFIX) === 0;

export const isInstaGridSectionId = sectionId =>
  (sectionId || '').indexOf(AV_INSTA_GRID_SECTION_ID_PREFIX) === 0;

export const getRecommendedListingIds = pageData => {
  const section = pageData?.sections?.find(s => s?.sectionId === AV_RECOMMENDEDS_SECTION_ID);
  return getListingIdsFromSection(section);
};

export const getSelectionsSections = pageData => {
  const sections = pageData?.sections || [];
  return sections.reduce((collected, section) => {
    const sectionId = section?.sectionId || '';
    if (isSelectionsSectionId(sectionId)) {
      return { ...collected, [sectionId]: getListingIdsFromSection(section) };
    }
    return collected;
  }, {});
};

/**
 * Returns a map of { [sectionId]: firstBlockName } for all av-tag-listings-* sections.
 * The firstBlockName encodes the filter value:
 *   - "tag:hot-list"  → filter by pub_tags = hot-list
 *   - "cat:blazers"   → filter by pub_categoryLevel1 = blazers
 *   - "hot-list"      → defaults to pub_tags = hot-list
 */
export const getTagListingsSections = pageData => {
  const sections = pageData?.sections || [];
  return sections.reduce((collected, section) => {
    const sectionId = section?.sectionId || '';
    if (isTagListingsSectionId(sectionId)) {
      const firstBlockName = section?.blocks?.[0]?.blockName || null;
      return firstBlockName ? { ...collected, [sectionId]: firstBlockName } : collected;
    }
    return collected;
  }, {});
};

/**
 * Returns a map of { [sectionId]: [userId, ...] } for all av-selected-users-* sections.
 * Each block's blockName is a user UUID.
 */
export const getSelectedUsersSections = pageData => {
  const sections = pageData?.sections || [];
  return sections.reduce((collected, section) => {
    const sectionId = section?.sectionId || '';
    if (isSelectedUsersSectionId(sectionId)) {
      return { ...collected, [sectionId]: getListingIdsFromSection(section) };
    }
    return collected;
  }, {});
};

export const hasCustomSections = pageData => {
  const sections = pageData?.sections || [];
  return sections.some(s => {
    const sectionId = s?.sectionId || '';
    return (
      sectionId === AV_RECOMMENDEDS_SECTION_ID ||
      isHero2SectionId(sectionId) ||
      isHero3SectionId(sectionId) ||
      isVideoSectionId(sectionId) ||
      isSelectionsSectionId(sectionId) ||
      isTagListingsSectionId(sectionId) ||
      isSelectedCatsSectionId(sectionId) ||
      isSelectedUsersSectionId(sectionId) ||
      isInstaGridSectionId(sectionId)
    );
  });
};
