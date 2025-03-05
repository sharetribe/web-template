const getGoogleAuthToken = user => {
  if (!user?.id) return null;
  return user.attributes?.profile?.privateData?.googleAuthToken;
};

const getUserEmail = user => {
  if (!user?.id) return null;
  return user.attributes?.email;
};

module.exports = {
  getGoogleAuthToken,
  getUserEmail,
};
