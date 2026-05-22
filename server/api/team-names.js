/**
 * Resolve a batch of team codes to their (public) team names, via the Integration API.
 * Lets the client show "Seattle Little League" instead of a bare code. Read-only.
 *
 * Request body: { teamCodes: string[] }
 * Response: { names: { [canonicalCode]: teamName } }  (only codes that resolve are included)
 */
const { handleError } = require('../api-util/sdk');
const { getIntegrationSdk, integrationSdkConfigured } = require('../api-util/integrationSdk');

// Mirror normalizeTeamCode in src/util/teams.js.
const normalizeTeamCode = input =>
  String(input == null ? '' : input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

module.exports = (req, res) => {
  const raw = Array.isArray((req.body || {}).teamCodes) ? req.body.teamCodes : [];
  const codes = [...new Set(raw.map(normalizeTeamCode).filter(Boolean))];

  if (codes.length === 0 || !integrationSdkConfigured()) {
    return res.status(200).json({ names: {} });
  }

  const sdk = getIntegrationSdk();
  // enum extended-data filtering treats a comma-separated value as OR, so one query covers all codes.
  return sdk.users
    .query({ pub_teamCode: codes.join(','), pub_userType: 'teamname', perPage: 100 })
    .then(response => {
      const names = {};
      (response.data.data || []).forEach(user => {
        const profile = user.attributes.profile || {};
        const code = profile.publicData?.teamCode;
        if (code) {
          names[code] = profile.publicData?.teamnamecustom || profile.displayName || null;
        }
      });
      res.status(200).json({ names });
    })
    .catch(e => handleError(res, e));
};
