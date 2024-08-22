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
    const studioId = '123'
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
  const studioId = '123'
  return {
    communityId,
    studioId,
  }
}

async function studioCreatorInit(userId) {
  const communityId = 'studioCreatorInit_communityId'
  const studioId = 'studioCreatorInit_studioId'
  return {
    communityId,
    studioId,
  }
}

function studioBrandUpdate(brandStudioId, brandName) {
  return true
}

module.exports = {
  studioBrandUserInit,
  studioCreatorInit,
  studioBrandUpdate,
};
