/**
 * Shared helpers for EditListingPage (listing image entities during edit/create flows).
 * Image ids may be SDK UUID instances, uuid strings, or temporary client ids.
 */

/**
 * Normalize an image id value to a comparable string.
 *
 * @param {string|Object} [idValue] - UUID instance, uuid string, or temp id
 * @returns {string|undefined}
 */
export const listingImageIdString = idValue =>
  typeof idValue === 'string' ? idValue : idValue?.uuid;

/**
 * Return identifier strings for an image entity (covers id/imageId across lifecycle).
 *
 * @param {Object} [image] - Listing image entity from API or upload state
 * @returns {string[]}
 */
export const listingImageIdentifierStrings = image =>
  [image?.id, image?.imageId].map(listingImageIdString).filter(Boolean);

/**
 * Return the API image id for an image entity (imageId preferred over id).
 *
 * @param {Object} [image] - Listing image entity from API or upload state
 * @returns {string|Object|undefined}
 */
export const listingImageApiId = image => image?.imageId || image?.id;

/**
 * Map images to API ids, preserving order and removing duplicates by uuid string.
 *
 * @param {Object[]|null|undefined} images - Listing image entities
 * @returns {Array|null}
 */
export const uniqueListingImageApiIds = images => {
  if (!images) {
    return null;
  }
  const seen = new Set();
  return images.reduce((ids, img) => {
    const apiId = listingImageApiId(img);
    const idString = listingImageIdString(apiId);
    if (idString && !seen.has(idString)) {
      seen.add(idString);
      ids.push(apiId);
    }
    return ids;
  }, []);
};
