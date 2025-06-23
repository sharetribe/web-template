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
  const newEntities = updatedEntities({ ...state.entities }, apiResponse, sanitizeConfig);
  // Log the new entities after merge
  console.log('🟢 [marketplaceData.duck.js] Entities after merge:', newEntities);
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
  const { entities } = state.marketplaceData || { entities: {} };
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
  const { entities } = state.marketplaceData || { entities: {} };
  const throwIfNotFound = false;
  return denormalisedEntities(entities, entityRefs, throwIfNotFound);
};

// ================ Action creators ================ //

export const addMarketplaceEntities = (sdkResponse, sanitizeConfig) => ({
  type: ADD_MARKETPLACE_ENTITIES,
  payload: { sdkResponse, sanitizeConfig },
});
