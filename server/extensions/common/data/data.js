const reduce = require('lodash/reduce');

const combinedRelationships = (oldRels, newRels) => {
  if (!oldRels && !newRels) {
    // Special case to avoid adding an empty relationships object when
    // none of the resource objects had any relationships.
    return null;
  }
  return { ...oldRels, ...newRels };
};

const combinedResourceObjects = (oldRes, newRes) => {
  const { id, type } = oldRes;
  if (newRes.id.uuid !== id.uuid || newRes.type !== type) {
    throw new Error(
      'Cannot merge resource objects with different ids or types'
    );
  }
  const attributes = newRes.attributes || oldRes.attributes;
  const attributesOld = oldRes.attributes || {};
  const attributesNew = newRes.attributes || {};
  // Allow (potentially) sparse attributes to update only relevant fields
  const attrs = attributes
    ? { attributes: { ...attributesOld, ...attributesNew } }
    : null;
  const relationships = combinedRelationships(
    oldRes.relationships,
    newRes.relationships
  );
  const rels = relationships ? { relationships } : null;
  return { id, type, ...attrs, ...rels };
};

const updatedEntities = (oldEntities, apiResponse) => {
  const { data, included = [] } = apiResponse;
  const objects = (Array.isArray(data) ? data : [data]).concat(included);

  const newEntities = objects.reduce((entities, curr) => {
    const { id, type } = curr;

    // Some entities (e.g. listing and user) might include extended data,
    // you should check if src/utils/sanitize.js needs to be updated.
    const current = curr;

    entities[type] = entities[type] || {};
    const entity = entities[type][id.uuid];
    entities[type][id.uuid] = entity
      ? combinedResourceObjects({ ...entity }, current)
      : current;

    return entities;
  }, oldEntities);

  return newEntities;
};

const denormalisedEntities = (entities, resources, throwIfNotFound = true) => {
  const denormalised = resources.map(res => {
    const { id, type } = res;
    const entityFound = entities[type] && id && entities[type][id.uuid];
    if (!entityFound) {
      if (throwIfNotFound) {
        throw new Error(
          `Entity with type "${type}" and id "${id ? id.uuid : id}" not found`
        );
      }
      return null;
    }
    const entity = entities[type][id.uuid];
    const { relationships, ...entityData } = entity;

    if (relationships) {
      // Recursively join in all the relationship entities
      return reduce(
        relationships,
        (ent, relRef, relName) => {
          // A relationship reference can be either a single object or
          // an array of objects. We want to keep that form in the final
          // result.
          const hasMultipleRefs = Array.isArray(relRef.data);
          const multipleRefsEmpty = hasMultipleRefs && relRef.data.length === 0;
          if (!relRef.data || multipleRefsEmpty) {
            ent[relName] = hasMultipleRefs ? [] : null;
          } else {
            const refs = hasMultipleRefs ? relRef.data : [relRef.data];

            // If a relationship is not found, an Error should be thrown
            const rels = denormalisedEntities(entities, refs, true);

            ent[relName] = hasMultipleRefs ? rels : rels[0];
          }
          return ent;
        },
        entityData
      );
    }
    return entityData;
  });
  return denormalised.filter(e => !!e);
};

const denormalisedResponseEntities = sdkResponse => {
  const apiResponse = sdkResponse.data;
  const { data } = apiResponse;
  const resources = Array.isArray(data) ? data : [data];

  if (!data || resources.length === 0) {
    return [];
  }

  const entities = updatedEntities({}, apiResponse);
  return denormalisedEntities(entities, resources);
};

/**
 * Converts a normalized Airtable response into an object format.
 *
 * @param {Array} response - The normalized Airtable response from API.
 * @return {Array} The denormalized response.
 */
const denormalisedAirtableSdkResponse = response => {
  return response.map(record => {
    const { id: recordId, fields } = record;
    return { ...fields, recordId };
  });
};

const denormalisedAirtableResponse = response => {
  const records = response.records.map(record => {
    const { id: recordId, fields } = record;
    return { ...fields, recordId };
  });

  return {
    data: records,
    offset: response.offset,
  };
};

const getFirstAssetData = response =>
  response?.data?.data[0]?.attributes?.data || {};

module.exports = {
  denormalisedAirtableResponse,
  denormalisedAirtableSdkResponse,
  denormalisedResponseEntities,
  getFirstAssetData,
};
