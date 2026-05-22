/**
 * Resolve a NextRep team code to a team, using the Integration API.
 *
 * The browser Marketplace API can't look up *another* user, so verifying that a join code
 * belongs to a real team must happen here. Read-only: queries team-account users by their
 * `pub_teamCode`.
 *
 * Request body: { teamCode: string }
 * Response: { verified: boolean, found: boolean|null, teamName: string|null }
 *   - verified=false means the server couldn't check (Integration creds missing); the client
 *     then stores the code unverified rather than blocking the user.
 */
const { handleError } = require('../api-util/sdk');
const { getIntegrationSdk, integrationSdkConfigured } = require('../api-util/integrationSdk');

// Must mirror normalizeTeamCode in src/util/teams.js.
const normalizeTeamCode = input =>
  String(input == null ? '' : input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const teamNameFromUser = user => {
  const profile = user?.attributes?.profile || {};
  return profile.publicData?.teamnamecustom || profile.displayName || null;
};

module.exports = (req, res) => {
  const code = normalizeTeamCode((req.body || {}).teamCode);

  if (!code) {
    return res.status(400).json({ error: 'Missing teamCode' });
  }

  // Graceful degradation: without creds we can't verify, so let the client proceed unverified.
  if (!integrationSdkConfigured()) {
    return res.status(200).json({ verified: false, found: null, teamName: null });
  }

  const sdk = getIntegrationSdk();
  return sdk.users
    .query({ pub_teamCode: code, pub_userType: 'teamname', perPage: 1 })
    .then(response => {
      const users = response.data.data || [];
      const found = users.length > 0;
      res.status(200).json({
        verified: true,
        found,
        teamName: found ? teamNameFromUser(users[0]) : null,
      });
    })
    .catch(e => handleError(res, e));
};
