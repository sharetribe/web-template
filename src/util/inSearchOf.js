/**
 * "In search of" listings are posts where a buyer describes an item they want.
 * They use their own listing type (created in Console). These helpers keep them apart from
 * regular "selling" listings in search.
 */

// Listing type ids (Console) that are treated as "In search of" listings
export const IN_SEARCH_OF_LISTING_TYPES = ['in-search-of-clothing', 'in-search-of', 'iso', 'wanted'];

/**
 * Check if a listing type id is an "In search of" type.
 *
 * @param {string} listingType listing type id
 * @returns {boolean}
 */
export const isInSearchOfListingType = listingType =>
  IN_SEARCH_OF_LISTING_TYPES.includes(listingType);

/**
 * Find the configured "In search of" listing type.
 *
 * @param {Array<Object>} listingTypes config.listing.listingTypes
 * @returns {Object|undefined} listing type config
 */
export const getInSearchOfListingType = (listingTypes = []) =>
  listingTypes.find(lt => isInSearchOfListingType(lt.listingType));

/**
 * Listing type ids that are regular "selling" types.
 *
 * @param {Array<Object>} listingTypes config.listing.listingTypes
 * @returns {Array<string>}
 */
export const getSellingListingTypeIds = (listingTypes = []) =>
  listingTypes.map(lt => lt.listingType).filter(id => !isInSearchOfListingType(id));
