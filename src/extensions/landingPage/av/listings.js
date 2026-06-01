import { createSelector } from '@reduxjs/toolkit';
import { types as sdkTypes, createImageVariantConfig } from '../../../util/sdkLoader';
import { addMarketplaceEntities } from '../../../ducks/marketplaceData.duck';
import { denormalisedEntities } from '../../../util/data';
import * as log from '../../../util/log';
import { setTagListingIds } from '../../../ducks/avExtension.duck';

import {
  getRecommendedListingIds,
  getSelectionsSections,
  getTagListingsSections,
  getSelectedUsersSections,
  hasCustomSections,
} from './sections';

const { UUID } = sdkTypes;

const MAX_LISTING_IDS_PER_SECTION = 24;
const MAX_TOTAL_LISTING_ID_QUERY = 100;
const MAX_FILTER_SECTIONS = 8;
const MAX_FILTER_LISTINGS_PER_SECTION = 24;
const MAX_SELECTED_USERS = 24;
const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_CACHE_MAX_ENTRIES = 200;

const publicUserResponseCache = new Map();

// AV-specific listing fields fetched for landing page sections.
// Keep in sync with publicData fields defined in configListing.js.
const AV_LISTING_PUBLIC_DATA_FIELDS = [
  'publicData.listingType',
  'publicData.transactionProcessAlias',
  'publicData.unitType',
  'publicData.brand',
  'publicData.all_sizes',
  'publicData.originalPrice',
];

const createListingsBaseQueryParams = (config = {}) => {
  const listingImage = config?.layout?.listingImage || {};
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return {
    include: ['author', 'author.profileImage', 'images'],
    'fields.listing': ['title', 'price', 'deleted', 'state', ...AV_LISTING_PUBLIC_DATA_FIELDS],
    'fields.user': [
      'profile.displayName',
      'profile.abbreviatedName',
      'profile.image',
      // AV: needed by StoreTypeTags overlay on AVListingCard
      'profile.publicData.userType',
      'profile.publicData.tipoTienda',
    ],
    'fields.image': [
      'variants.square-xsmall2x',
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    ...createImageVariantConfig('square-xsmall2x', 60, aspectRatio),
    'limit.images': 1,
  };
};

const createListingsQueryParams = (config = {}, listingIds = []) => {
  const ids = [...new Set(listingIds)];
  return { ids, ...createListingsBaseQueryParams(config) };
};

const capIds = (ids = [], limit) => ids.filter(Boolean).slice(0, limit);

const capSectionIds = sections =>
  Object.entries(sections || {}).reduce(
    (collected, [sectionId, ids]) => ({
      ...collected,
      [sectionId]: capIds(ids, MAX_LISTING_IDS_PER_SECTION),
    }),
    {}
  );

const firstUniqueIds = (ids = [], limit) => [...new Set(ids.filter(Boolean))].slice(0, limit);

const filterKeyFromParams = filterParams =>
  JSON.stringify(Object.entries(filterParams || {}).sort());

const safeLoadCall = (promise, code, data = {}) =>
  promise.catch(e => {
    log.error(e, code, data);
    return null;
  });

const queryListingsByIds = (listingIds, config) => (dispatch, getState, sdk) => {
  if (!listingIds || listingIds.length === 0) {
    return Promise.resolve();
  }

  const params = createListingsQueryParams(config, listingIds);
  return sdk.listings.query(params).then(response => {
    const sanitizeConfig = { listingFields: config?.listing?.listingFields };
    dispatch(addMarketplaceEntities(response, sanitizeConfig));
    return response;
  });
};

/**
 * Parse a blockName into SDK filter params.
 *   "tag:hot-list"  → { pub_tags: 'hot-list' }
 *   "cat:blazers"   → { pub_categoryLevel1: 'blazers' }
 *   "hot-list"      → { pub_tags: 'hot-list' }  (default: tag)
 */
export const parseFilterFromBlockName = blockName => {
  if (!blockName) return null;
  if (blockName.startsWith('tag:')) return { pub_tags: blockName.slice(4) };
  if (blockName.startsWith('cat:')) return { pub_categoryLevel1: blockName.slice(4) };
  return { pub_tags: blockName };
};

const queryListingsByFilter = (filterParams, config) => (dispatch, getState, sdk) => {
  if (!filterParams) return Promise.resolve(null);

  const params = {
    ...createListingsBaseQueryParams(config),
    ...filterParams,
    perPage: MAX_FILTER_LISTINGS_PER_SECTION,
  };

  return sdk.listings.query(params).then(response => {
    const sanitizeConfig = { listingFields: config?.listing?.listingFields };
    dispatch(addMarketplaceEntities(response, sanitizeConfig));
    return response;
  });
};

const toUUID = id => {
  if (!id) {
    return null;
  }
  try {
    return new UUID(id);
  } catch (e) {
    return null;
  }
};

const getCachedUserResponse = userId => {
  const cached = publicUserResponseCache.get(userId);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > USER_CACHE_TTL_MS) {
    publicUserResponseCache.delete(userId);
    return null;
  }

  // Refresh recency for simple LRU behavior.
  publicUserResponseCache.delete(userId);
  publicUserResponseCache.set(userId, cached);
  return cached.response;
};

const setCachedUserResponse = (userId, response) => {
  publicUserResponseCache.set(userId, { response, cachedAt: Date.now() });

  if (publicUserResponseCache.size > USER_CACHE_MAX_ENTRIES) {
    const oldestKey = publicUserResponseCache.keys().next().value;
    publicUserResponseCache.delete(oldestKey);
  }
};

const queryUserById = userId => (dispatch, getState, sdk) => {
  const cachedResponse = getCachedUserResponse(userId);
  if (cachedResponse) {
    dispatch(addMarketplaceEntities(cachedResponse));
    return Promise.resolve(cachedResponse);
  }

  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      setCachedUserResponse(userId, response);
      dispatch(addMarketplaceEntities(response));
      return response;
    });
};

export const loadCustomSectionListings = ({ pageData, dispatch, config }) => {
  if (!hasCustomSections(pageData)) {
    return Promise.resolve();
  }

  const recommendedListingIds = capIds(
    getRecommendedListingIds(pageData),
    MAX_LISTING_IDS_PER_SECTION
  );
  const selectionsSections = capSectionIds(getSelectionsSections(pageData));
  const tagListingsSectionsMap = getTagListingsSections(pageData);
  const selectedUsersSections = getSelectedUsersSections(pageData);
  const calls = [];

  const explicitListingIds = firstUniqueIds(
    [recommendedListingIds, ...Object.values(selectionsSections)].flat(),
    MAX_TOTAL_LISTING_ID_QUERY
  );
  if (explicitListingIds.length > 0) {
    calls.push(
      safeLoadCall(
        dispatch(queryListingsByIds(explicitListingIds, config)),
        'av-landing-listings-failed',
        {
          sectionType: 'explicit-listing-ids',
          listingCount: explicitListingIds.length,
        }
      )
    );
  }

  // For each tag/category filter section, query listings and store the returned IDs
  const tagListingIdsAccumulator = {};
  const filterSectionsByKey = {};
  Object.entries(tagListingsSectionsMap)
    .slice(0, MAX_FILTER_SECTIONS)
    .forEach(([sectionId, blockName]) => {
      const filterParams = parseFilterFromBlockName(blockName);
      if (filterParams) {
        const filterKey = filterKeyFromParams(filterParams);
        const sectionIds = filterSectionsByKey[filterKey]?.sectionIds || [];
        filterSectionsByKey[filterKey] = { filterParams, sectionIds: [...sectionIds, sectionId] };
        tagListingIdsAccumulator[sectionId] = [];
      }
    });

  Object.values(filterSectionsByKey).forEach(({ filterParams, sectionIds }) => {
    calls.push(
      safeLoadCall(
        dispatch(queryListingsByFilter(filterParams, config)).then(response => {
          const ids = (response?.data?.data || []).map(l => l?.id?.uuid).filter(Boolean);
          sectionIds.forEach(sectionId => {
            tagListingIdsAccumulator[sectionId] = ids;
          });
        }),
        'av-landing-filter-listings-failed',
        { sectionIds, filterParams }
      )
    );
  });

  // Fetch each unique user ID across all selected-users sections.
  // Note: Sharetribe's public Marketplace API doesn't accept an id-array filter on
  // sdk.users.query, so true batching isn't available — we deduplicate via Set
  // and let Promise.all dispatch the fan-out in parallel below.
  const allUserIds = firstUniqueIds(
    Object.values(selectedUsersSections).flat(),
    MAX_SELECTED_USERS
  );
  allUserIds.forEach(userId => {
    calls.push(safeLoadCall(dispatch(queryUserById(userId)), 'av-landing-user-failed', { userId }));
  });

  return Promise.all(calls).then(() => {
    if (Object.keys(tagListingIdsAccumulator).length > 0) {
      dispatch(setTagListingIds(tagListingIdsAccumulator));
    }
  });
};

// Entities-aware pickers used inside the memoized selector below.
const pickListingsByIdFromEntities = (entities, ids) => {
  const refs = (ids || [])
    .map(toUUID)
    .filter(Boolean)
    .map(id => ({ id, type: 'listing' }));
  if (!refs.length) return [];
  return denormalisedEntities(entities, refs, false);
};

const pickUsersByIdFromEntities = (entities, ids) => {
  const refs = (ids || [])
    .map(toUUID)
    .filter(Boolean)
    .map(id => ({ id, type: 'user' }));
  if (!refs.length) return [];
  return denormalisedEntities(entities, refs, false).filter(Boolean);
};

// Memoized via reselect (re-exported by @reduxjs/toolkit). Recomputes only
// when entities, tagListingIds, or pageData change by reference.
const customSectionListingsSelector = createSelector(
  [
    state => state.marketplaceData?.entities,
    state => state.avLandingExtension?.tagListingIds,
    (_state, pageData) => pageData,
  ],
  (entities, tagListingIdsBySection, pageData) => {
    if (!hasCustomSections(pageData)) {
      return { hasCustomSections: false };
    }

    const recommendedListingIds = capIds(
      getRecommendedListingIds(pageData),
      MAX_LISTING_IDS_PER_SECTION
    );
    const selectionsSections = capSectionIds(getSelectionsSections(pageData));
    const selectedUsersSections = Object.entries(getSelectedUsersSections(pageData)).reduce(
      (collected, [sectionId, ids]) => ({
        ...collected,
        [sectionId]: capIds(ids, MAX_SELECTED_USERS),
      }),
      {}
    );

    const listings = pickListingsByIdFromEntities(entities, recommendedListingIds);
    const selectionsListings = Object.entries(selectionsSections).reduce(
      (collected, [sectionId, ids]) => ({
        ...collected,
        [sectionId]: pickListingsByIdFromEntities(entities, ids),
      }),
      {}
    );
    const tagListingsSections = Object.entries(tagListingIdsBySection || {}).reduce(
      (collected, [sectionId, ids]) => ({
        ...collected,
        [sectionId]: pickListingsByIdFromEntities(entities, ids),
      }),
      {}
    );
    const selectedUsersBySection = Object.entries(selectedUsersSections).reduce(
      (collected, [sectionId, ids]) => ({
        ...collected,
        [sectionId]: pickUsersByIdFromEntities(entities, ids),
      }),
      {}
    );

    return {
      hasCustomSections: true,
      listings,
      selectionsListings,
      tagListingsSections,
      selectedUsersBySection,
    };
  }
);

export const selectCustomSectionListings = ({ state, pageData }) =>
  customSectionListingsSelector(state, pageData);
