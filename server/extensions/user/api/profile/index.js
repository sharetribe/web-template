const { handleError } = require('../../../common/sdk');
const { getSdk } = require('../../../common/sdk');
const { finalizeTransitResponse } = require('../../../common/response');
const { updateUserListings } = require('../../common');

const updateProfile = async (req, res) => {
  try {
    const { data, queryParams } = req.body;
    const sdk = getSdk(req, res);
    const userResponse = await sdk.currentUser.show();
    const response = await sdk.currentUser.updateProfile(data, queryParams);

    await updateUserListings(response, userResponse);
    return finalizeTransitResponse(res)({ data: response.data });
  } catch (error) {
    console.error('Update user profile failed', error);
    handleError(res, error);
  }
};

module.exports = updateProfile;
