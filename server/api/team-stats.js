/**
 * Team Admin dashboard metrics. The caller must be authenticated as a Team account; the team is
 * derived from the authenticated user (so an admin can only see their own team's stats).
 *
 * Public metrics (# members, # items listed) are computed via the Integration API, which can read
 * across users/listings the browser Marketplace API cannot. Private metrics (items sold, revenue)
 * are placeholders until transaction aggregation is added.
 *
 * Response: { teamName, teamCode, memberCount, listedCount, soldCount, totalRevenue,
 *             integrationConfigured }
 */
const { getSdk, handleError } = require('../api-util/sdk');
const { getIntegrationSdk, integrationSdkConfigured } = require('../api-util/integrationSdk');

const TEAM_USER_TYPE = 'teamname';
const INDIVIDUAL_USER_TYPE = 'individual';

const totalItems = response => response?.data?.meta?.totalItems ?? 0;

module.exports = (req, res) => {
  const sdk = getSdk(req, res);

  return sdk.currentUser
    .show()
    .then(meResp => {
      const me = meResp.data.data;
      const profile = me.attributes.profile || {};
      const publicData = profile.publicData || {};

      if (publicData.userType !== TEAM_USER_TYPE) {
        res.status(403).json({ error: 'Team dashboard is only available to team accounts.' });
        return null;
      }

      const teamCode = publicData.teamCode || null;
      const teamName = publicData.teamnamecustom || profile.displayName || null;
      const base = { teamName, teamCode, soldCount: 0, totalRevenue: 0 };

      if (!teamCode || !integrationSdkConfigured()) {
        return res.status(200).json({
          ...base,
          memberCount: null,
          listedCount: null,
          integrationConfigured: integrationSdkConfigured(),
        });
      }

      const isdk = getIntegrationSdk();
      return Promise.all([
        isdk.users.query({ pub_teamCodes: teamCode, pub_userType: INDIVIDUAL_USER_TYPE, perPage: 1 }),
        isdk.listings.query({ pub_teamCodes: teamCode, states: ['published'], perPage: 1 }),
      ]).then(([members, listings]) => {
        res.status(200).json({
          ...base,
          memberCount: totalItems(members),
          listedCount: totalItems(listings),
          integrationConfigured: true,
        });
      });
    })
    .catch(e => handleError(res, e));
};
