export const getGoogleAccessToken = user => {
  if (!user?.id) return null;
  return !!user.attributes?.profile?.privateData?.googleAuthToken?.access_token;
};
