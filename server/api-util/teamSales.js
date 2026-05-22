/**
 * Pure aggregation of a team's sales from Integration API transactions.
 *
 * Kept separate from the endpoint so the logic is unit-testable without live transaction data
 * (the dev marketplace has none yet, and the Integration API cannot fabricate a sale).
 *
 * Definitions (per the NextRep spec):
 * - soldCount  : paid transactions whose listing is tagged with the team code (team- AND
 *                member-posted gear) — a public metric.
 * - totalRevenue: payout total of paid transactions where the team account itself is the provider
 *                (team-posted gear only) — a private metric.
 *
 * "Paid" is detected by the presence of a captured `payinTotal`, which avoids hard-coding the
 * exact default-purchase transition names. Amounts are in minor units (cents).
 */

const indexListingsById = included =>
  (included || []).reduce((acc, r) => {
    if (r.type === 'listing') {
      acc[r.id.uuid] = r;
    }
    return acc;
  }, {});

const isPaid = tx => tx?.attributes?.payinTotal?.amount != null;

/**
 * @param {Array} transactions transaction resources (Integration API `data`)
 * @param {Array} included included resources (must contain the related listings)
 * @param {Object} opts
 * @param {String} opts.teamCode canonical team code to match against listing pub_teamCodes
 * @param {String} opts.teamUserId uuid of the team account (to attribute team-posted revenue)
 * @returns {Object} { soldCount, totalRevenue, currency }
 */
const summarizeTeamSales = (transactions, included, { teamCode, teamUserId } = {}) => {
  const listingsById = indexListingsById(included);
  let soldCount = 0;
  let totalRevenue = 0;
  let currency = null;

  (transactions || []).forEach(tx => {
    if (!isPaid(tx)) {
      return;
    }
    const listingId = tx.relationships?.listing?.data?.id?.uuid;
    const listing = listingId ? listingsById[listingId] : null;
    const teamCodes = listing?.attributes?.publicData?.teamCodes || [];
    if (!teamCode || !teamCodes.includes(teamCode)) {
      return;
    }

    // Counts toward the team's sold units (team- or member-posted).
    soldCount += 1;

    // Revenue is attributed to the team only for team-posted gear (team is the provider).
    const providerId = tx.relationships?.provider?.data?.id?.uuid;
    const payout = tx.attributes?.payoutTotal;
    if (providerId && providerId === teamUserId && payout?.amount != null) {
      totalRevenue += payout.amount;
      currency = currency || payout.currency || null;
    }
  });

  return { soldCount, totalRevenue, currency };
};

module.exports = { summarizeTeamSales };
