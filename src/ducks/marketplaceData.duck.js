import { updatedEntities, denormalisedEntities } from '../util/data';

// ================ Action types ================ //

export const ADD_MARKETPLACE_ENTITIES = 'app/marketplaceData/ADD_MARKETPLACE_ENTITIES';

// ================ Reducer ================ //

const initialState = {
  // Database of all the fetched entities.
  entities: {},
};

const merge = (state, payload) => {
  const { sdkResponse, sanitizeConfig } = payload;
  const apiResponse = sdkResponse?.data || {};
  // Log the incoming sdkResponse and sanitizeConfig for debugging
  console.log('🟢 [marketplaceData.duck.js] Merging entities. sdkResponse:', sdkResponse, 'sanitizeConfig:', sanitizeConfig);
  console.log('🟢 [marketplaceData.duck.js] API response structure:', {
    hasData: !!apiResponse.data,
    hasIncluded: !!apiResponse.included,
    dataType: apiResponse.data?.type,
    dataId: apiResponse.data?.id?.uuid,
    hasAttributes: !!apiResponse.data?.attributes,
    hasAvailabilityPlan: !!apiResponse.data?.attributes?.availabilityPlan
  });
  if (apiResponse.data?.attributes?.availabilityPlan) {
    console.log('🟢 [marketplaceData.duck.js] Availability plan in API response:', JSON.stringify(apiResponse.data.attributes.availabilityPlan, null, 2));
  }
  const newEntities = updatedEntities({ ...state.entities }, apiResponse, sanitizeConfig);
  // Log the new entities after merge
  console.log('🟢 [marketplaceData.duck.js] Entities after merge:', newEntities);
  console.log('🟢 [marketplaceData.duck.js] OwnListing entities after merge:', newEntities.ownListing);
  if (newEntities.ownListing) {
    const listingIds = Object.keys(newEntities.ownListing);
    console.log('🟢 [marketplaceData.duck.js] OwnListing IDs after merge:', listingIds);
    listingIds.forEach(id => {
      const listing = newEntities.ownListing[id];
      console.log(`🟢 [marketplaceData.duck.js] Listing ${id} availabilityPlan:`, listing?.attributes?.availabilityPlan);
    });
  }
  return {
    ...state,
    entities: newEntities,
  };
};

export default function marketplaceDataReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case ADD_MARKETPLACE_ENTITIES:
      // Log when reducer receives ADD_MARKETPLACE_ENTITIES
      console.log('🟢 [marketplaceData.duck.js] Reducer received ADD_MARKETPLACE_ENTITIES:', payload);
      return merge(state, payload);

    default:
      return state;
  }
}

// ================ Selectors ================ //

/**
 * Get the denormalised listing entities with the given IDs
 *
 * @param {Object} state the full Redux store
 * @param {Array<UUID>} listingIds listing IDs to select from the store
 */
export const getListingsById = (state, listingIds) => {
  // Add safety check for when state.marketplaceData is undefined
  if (!state.marketplaceData) {
    console.warn('⚠️ state.marketplaceData is undefined in getListingsById');
    return [];
  }
  
  const { entities } = state.marketplaceData;
  const resources = listingIds.map(id => ({
    id,
    type: 'listing',
  }));
  const throwIfNotFound = false;
  return denormalisedEntities(entities, resources, throwIfNotFound);
};

/**
 * Get the denormalised entities from the given entity references.
 *
 * @param {Object} state the full Redux store
 *
 * @param {Array<{ id, type }} entityRefs References to entities that
 * we want to query from the data. Currently we expect that all the
 * entities have the same type.
 *
 * @return {Array<Object>} denormalised entities
 */
export const getMarketplaceEntities = (state, entityRefs) => {
  // Add safety check for when state.marketplaceData is undefined
  if (!state.marketplaceData) {
    console.warn('⚠️ state.marketplaceData is undefined in getMarketplaceEntities');
    return [];
  }
  
  const { entities } = state.marketplaceData;
  const throwIfNotFound = false;
  return denormalisedEntities(entities, entityRefs, throwIfNotFound);
};

// ================ Action creators ================ //

export const addMarketplaceEntities = (sdkResponse, sanitizeConfig) => ({
  type: ADD_MARKETPLACE_ENTITIES,
  payload: { sdkResponse, sanitizeConfig },
});
