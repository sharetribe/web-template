import {
  AV_HERO_SECTION_ID,
  AV_HERO_SECTION_TYPE,
  AV_HERO2_SECTION_TYPE,
  AV_HERO3_SECTION_TYPE,
  AV_VIDEO_SECTION_TYPE,
  AV_RECOMMENDEDS_SECTION_ID,
  AV_RECOMMENDEDS_SECTION_TYPE,
  AV_SELECTIONS_SECTION_TYPE,
  AV_TAG_LISTINGS_SECTION_TYPE,
  AV_SELECTED_CATS_SECTION_TYPE,
  AV_SELECTED_USERS_SECTION_TYPE,
  AV_INSTA_GRID_SECTION_TYPE,
} from './constants';
import {
  isHero2SectionId,
  isHero3SectionId,
  isVideoSectionId,
  isSelectionsSectionId,
  isTagListingsSectionId,
  isSelectedCatsSectionId,
  isSelectedUsersSectionId,
  isInstaGridSectionId,
} from './sections';

const formatMessage = (intl, id, defaultMessage) => {
  if (!intl?.formatMessage) return defaultMessage ?? '';
  // Check the messages map directly so a translation that happens to equal the
  // id is still returned (the previous round-trip heuristic discarded it).
  const has = !!intl.messages?.[id];
  return has ? intl.formatMessage({ id }) : (defaultMessage ?? '');
};

export const transformCustomSections = ({ pageData, intl, extensionData }) => {
  if (!pageData || !extensionData?.hasCustomSections) {
    return pageData;
  }

  const sections = pageData?.sections || [];
  const listings = extensionData?.listings || [];
  const selectionsListings = extensionData?.selectionsListings || {};
  const tagListingsSections = extensionData?.tagListingsSections || {};
  const selectedUsersBySection = extensionData?.selectedUsersBySection || {};

  const customSections = sections.map(section => {
    const sectionId = section?.sectionId || '';

    if (sectionId === AV_HERO_SECTION_ID) {
      return {
        ...section,
        sectionType: AV_HERO_SECTION_TYPE,
        classWrap: 'contentLeft',
        callToAction: {
          fieldType: 'internalButtonLink',
          href: formatMessage(intl, 'AVHero.ctaFirstLink', '/s?pub_tags=hot-list'),
          content: formatMessage(intl, 'AVHero.ctaFirstText', 'Explore now'),
        },
        callToAction2: {
          fieldType: 'internalButtonLink',
          href: formatMessage(intl, 'AVHero.ctaSecondLink', '/s'),
          content: formatMessage(intl, 'AVHero.ctaSecondText', 'Browse all'),
        },
        isLanding: true,
      };
    }

    if (isHero2SectionId(sectionId)) {
      // "av-hero2-shop" → instanceId "shop"; falls back to full sectionId if no suffix
      const instanceId = sectionId.slice('av-hero2-'.length) || sectionId;

      const cta1Text = formatMessage(intl, `AVHero2.${instanceId}.cta1Text`, '').trim();
      const cta2Text = formatMessage(intl, `AVHero2.${instanceId}.cta2Text`, '').trim();
      const cta1Style = formatMessage(intl, `AVHero2.${instanceId}.cta1Style`, 'primary') || 'primary';
      const cta2Style = formatMessage(intl, `AVHero2.${instanceId}.cta2Style`, 'secondary') || 'secondary';
      const mobileBackgroundImageUrl =
        formatMessage(intl, `AVHero2.${instanceId}.mobileBackgroundUrl`, '') || null;

      return {
        ...section,
        sectionType: AV_HERO2_SECTION_TYPE,
        callToAction: cta1Text
          ? {
              fieldType: 'internalButtonLink',
              href: formatMessage(intl, `AVHero2.${instanceId}.cta1Link`, '/s'),
              content: cta1Text,
            }
          : null,
        callToAction2: cta2Text
          ? {
              fieldType: 'internalButtonLink',
              href: formatMessage(intl, `AVHero2.${instanceId}.cta2Link`, '/s'),
              content: cta2Text,
            }
          : null,
        cta1Style,
        cta2Style,
        mobileBackgroundImageUrl,
      };
    }

    if (isHero3SectionId(sectionId)) {
      const instanceId = sectionId.slice('av-hero3-'.length) || sectionId;
      const cta1Style = formatMessage(intl, `AVHero3.${instanceId}.cta1Style`, 'primary') || 'primary';
      const cta2Style = formatMessage(intl, `AVHero3.${instanceId}.cta2Style`, 'primary') || 'primary';
      return { ...section, sectionType: AV_HERO3_SECTION_TYPE, cta1Style, cta2Style };
    }

    if (isVideoSectionId(sectionId)) {
      const instanceId = sectionId.slice('av-video-'.length) || sectionId;
      const videoUrl = formatMessage(intl, `AVVideo.${instanceId}.videoUrl`, '') || null;

      return {
        ...section,
        sectionType: AV_VIDEO_SECTION_TYPE,
        videoUrl,
      };
    }

    if (sectionId === AV_RECOMMENDEDS_SECTION_ID) {
      return {
        ...section,
        sectionType: AV_RECOMMENDEDS_SECTION_TYPE,
        listings,
      };
    }

    if (isSelectionsSectionId(sectionId)) {
      return {
        ...section,
        sectionType: AV_SELECTIONS_SECTION_TYPE,
        listings: selectionsListings[sectionId] || [],
      };
    }

    if (isTagListingsSectionId(sectionId)) {
      return {
        ...section,
        sectionType: AV_TAG_LISTINGS_SECTION_TYPE,
        listings: tagListingsSections[sectionId] || [],
      };
    }

    if (isSelectedCatsSectionId(sectionId)) {
      // blocks are already in section.blocks from the CMS — just set the type
      return {
        ...section,
        sectionType: AV_SELECTED_CATS_SECTION_TYPE,
      };
    }

    if (isSelectedUsersSectionId(sectionId)) {
      return {
        ...section,
        sectionType: AV_SELECTED_USERS_SECTION_TYPE,
        users: selectedUsersBySection[sectionId] || [],
      };
    }

    if (isInstaGridSectionId(sectionId)) {
      return {
        ...section,
        sectionType: AV_INSTA_GRID_SECTION_TYPE,
      };
    }

    return section;
  });

  return {
    ...pageData,
    sections: customSections,
  };
};
