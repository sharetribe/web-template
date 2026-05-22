/**
 * Team Admin dashboard data. The caller must be authenticated as a Team account; the team is
 * derived from the authenticated user (so an admin can only see their own team's data).
 *
 * Returns the team's "virtual warehouse" view via the Integration API (which can read across
 * users/listings the browser Marketplace API cannot): the member roster and the team's gear
 * (team-posted and member-posted). Items sold / revenue are placeholders until transaction
 * aggregation is added.
 *
 * Response: { teamName, teamCode, memberCount, members: [{id,name}], listedCount,
 *             listings: [{id,title,author}], soldCount, totalRevenue, integrationConfigured }
 */
const { getSdk, handleError } = require('../api-util/sdk');
const { getIntegrationSdk, integrationSdkConfigured } = require('../api-util/integrationSdk');

const TEAM_USER_TYPE = 'teamname';
const INDIVIDUAL_USER_TYPE = 'individual';
const PER_PAGE = 100;

const totalItems = response => response?.data?.meta?.totalItems ?? 0;

// Index an `included` array by `type:id` for relationship resolution.
const indexIncluded = included =>
  (included || []).reduce((acc, r) => {
    acc[`${r.type}:${r.id.uuid}`] = r;
    return acc;
  }, {});

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
          members: [],
          listedCount: null,
          listings: [],
          integrationConfigured: integrationSdkConfigured(),
        });
      }

      const isdk = getIntegrationSdk();
      return Promise.all([
        isdk.users.query({
          pub_teamCodes: teamCode,
          pub_userType: INDIVIDUAL_USER_TYPE,
          perPage: PER_PAGE,
        }),
        isdk.listings.query({
          pub_teamCodes: teamCode,
          states: ['published'],
          perPage: PER_PAGE,
          include: ['author'],
          'fields.user': ['profile.displayName'],
        }),
      ]).then(([membersResp, listingsResp]) => {
        const members = (membersResp.data.data || []).map(u => ({
          id: u.id.uuid,
          name: u.attributes.profile.displayName || null,
        }));

        const authorsById = indexIncluded(listingsResp.data.included);
        const listings = (listingsResp.data.data || []).map(l => {
          const authorId = l.relationships?.author?.data?.id?.uuid;
          const author = authorId ? authorsById[`user:${authorId}`] : null;
          return {
            id: l.id.uuid,
            title: l.attributes.title,
            author: author?.attributes?.profile?.displayName || null,
          };
        });

        res.status(200).json({
          ...base,
          memberCount: totalItems(membersResp),
          members,
          listedCount: totalItems(listingsResp),
          listings,
          integrationConfigured: true,
        });
      });
    })
    .catch(e => handleError(res, e));
};
