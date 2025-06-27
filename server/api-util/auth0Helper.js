const { ManagementClient } = require('auth0');

let client;

function getClient() {
  if (!client) {
    const opts = {
      // We need to use the Auth0 Domain, not the custom one.. More info:
      // https://github.com/auth0/node-auth0/issues/292
      domain: process.env.AUTH0_API_DOMAIN,
      clientId: process.env.AUTH0_MARKETPLACE_CLIENT_ID,
      clientSecret: process.env.AUTH0_MARKETPLACE_CLIENT_SECRET,
      scope: 'read:users update:users',
    };
    client = new ManagementClient(opts);
  }
  return client;
}

async function updateAuth0User({
  auth0UserId,
  marketId,
  studioId,
  communityId,
  firstName,
  lastName,
  displayName,
  sellerStatus,
  communityStatus,
  userType,
}) {
  try {
    const auth0 = getClient();
    const params = { id: auth0UserId };
    const appMetadata = {
      marketId,
      ...(studioId ? { studioId } : {}),
      ...(communityId ? { communityId } : {}),
      ...(sellerStatus ? { sellerStatus } : {}),
      ...(communityStatus ? { communityStatus } : {}),
      userType,
    };
    const userMetadata = {
      given_name: firstName,
      family_name: lastName,
    };
    return await auth0.users.update(params, {
      name: displayName,
      nickname: displayName,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
    });
  } catch (error) {
    console.error(
      `[updateAuth0User] NOT BLOCKING ERROR updating Auth0 user | userId: ${marketId} | Error:`,
      error
    );
  }
}

module.exports = {
  updateAuth0User,
};
