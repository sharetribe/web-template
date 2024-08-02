/**
 * [TODO:]
 *  - In case it's required, the studio BE should be the one upgrading the Circle information.
 *  - The marketplace will ONLY call the Studio
 */

function studioBrandUserInit(brandStudioId) {
  if (!brandStudioId) {
    /**
     * [TODO:]
     *    - Add Brand, BrandUser and new User
     */
    const newBrandStudioId = 'newBrandStudioId';
    const communityId = 'communityId'
    const studioId = 'studioId'
    return {
      brandStudioId: newBrandStudioId,
      communityId,
      studioId,
    }
  }
  /**
   * [TODO:]
   *    - Add BrandUser and new User to the existing Brand
   */
  const communityId = 'communityId'
  const studioId = 'studioId'
  return {
    communityId,
    studioId,
  }
}

module.exports = {
  studioBrandUserInit
};
