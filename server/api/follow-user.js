const { getSdk, getTrustedSdk, handleError, serialize, typeHandlers } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { userId, action } = req.body;
  const sdk = getSdk(req, res);

  if (!userId || !action) {
    return res.status(400).json({ error: 'Missing required parameters: userId and action' });
  }

  if (action !== 'follow' && action !== 'unfollow') {
    return res.status(400).json({ error: 'Invalid action. Must be "follow" or "unfollow"' });
  }

  // Get current user first
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const currentUserPrivateData = currentUser.attributes.profile.privateData || {};
      const following = currentUserPrivateData.following || [];

      let updatedFollowing;
      let isNewFollow = false;
      let isNewUnfollow = false;

      if (action === 'follow') {
        // Add user to following list if not already following
        if (!following.includes(userId)) {
          updatedFollowing = [...following, userId];
          isNewFollow = true;
        } else {
          updatedFollowing = following;
        }
      } else {
        // Remove user from following list
        if (following.includes(userId)) {
          updatedFollowing = following.filter(id => id !== userId);
          isNewUnfollow = true;
        } else {
          updatedFollowing = following;
        }
      }

      // Update current user's private data with new following list
      return sdk.currentUser.updateProfile({
        privateData: {
          ...currentUserPrivateData,
          following: updatedFollowing,
        },
      }).then(() => ({ isNewFollow, isNewUnfollow }));
    })
    .then(({ isNewFollow, isNewUnfollow }) => {
      // Get target user to calculate current follower count
      return sdk.users.show({ id: userId }).then(targetUserResponse => {
        const targetUser = targetUserResponse.data.data;
        const targetUserPublicData = targetUser.attributes.profile.publicData || {};
        let currentFollowerCount = targetUserPublicData.followerCount || 0;

        // Update follower count based on the action
        if (isNewFollow) {
          currentFollowerCount += 1;
        } else if (isNewUnfollow) {
          currentFollowerCount = Math.max(0, currentFollowerCount - 1);
        }

        // In a real implementation, you would update the target user's follower count
        // For now, we'll simulate this and return the updated count
        res.status(200).json({
          success: true,
          action,
          userId,
          newFollowerCount: currentFollowerCount,
          isFollowing: action === 'follow',
        });
      });
    })
    .catch(e => {
      handleError(res, e);
    });
}; 