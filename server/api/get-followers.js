const { getSdk, getTrustedSdk, handleError, serialize, typeHandlers } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { userId } = req.query;
  const sdk = getSdk(req, res);

  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }

  // Check if current user is following this user
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const currentUserPrivateData = currentUser.attributes.profile.privateData || {};
      const following = currentUserPrivateData.following || [];
      const isFollowing = following.includes(userId);

      res.status(200).json({
        isFollowing,
        userId,
        // We'll let the frontend manage follower counts since we can't query all users
        followerCount: null,
      });
    })
    .catch(() => {
      // If no current user (not logged in), just return basic info
      res.status(200).json({
        followerCount: null,
        isFollowing: false,
        userId,
      });
    })
    .catch(e => {
      handleError(res, e);
    });
}; 