const { integrationSdkInit } = require('../../api-util/scriptManager');
const { slackSellerValidationWorkflow } = require('../../api-util/slackHelper');
const { USER_TYPES, COMMUNITY_STATUS } = require('../../api-util/metadataHelper');

const QUERY_PARAMS = { expand: true };

const filterEvents = async userId => {
  const integrationSdk = integrationSdkInit();
  const result = await integrationSdk.users.show({ id: userId }, QUERY_PARAMS);
  return result?.data?.data;
};

const retryUserCreatedScript = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await filterEvents(userId);
    const { profile, email } = user.attributes;
    const { displayName } = profile;
    const { userType } = profile.publicData || {};
    const { communityStatus } = profile.metadata || {};
    const isCreativeSeller = userType === USER_TYPES.SELLER;
    if (isCreativeSeller) {
      if (communityStatus === COMMUNITY_STATUS.APPLIED) {
        res.json({
          success: false,
          message: `User '${displayName}' (${email}) is waiting for review on SLACK`,
        });
      } else if (communityStatus === COMMUNITY_STATUS.APPROVED) {
        res.json({
          success: false,
          message: `User '${displayName}' (${email}) was already accepted into the community`,
        });
        return;
      } else {
        const { portfolioURL } = profile.publicData;
        await slackSellerValidationWorkflow(userId, displayName, email, portfolioURL, true);
        res.json({ success: true });
      }
    } else {
      res.json({ success: false, message: `User '${displayName}' (${email}) is not a Seller` });
    }
  } catch (error) {
    console.warn(`[retryUserCreatedScript] - Error:`, error);
    res.json({ success: false });
  }
};

module.exports = {
  retryUserCreatedScript,
};
