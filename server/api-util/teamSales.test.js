const { summarizeTeamSales } = require('./teamSales');

const uuid = id => ({ uuid: id });

// Minimal transaction resource shaped like the Integration API response.
const tx = ({ id, listingId, providerId, payin, payout, currency = 'USD' }) => ({
  id: uuid(id),
  type: 'transaction',
  attributes: {
    payinTotal: payin == null ? null : { amount: payin, currency },
    payoutTotal: payout == null ? null : { amount: payout, currency },
  },
  relationships: {
    listing: { data: { id: uuid(listingId), type: 'listing' } },
    provider: { data: { id: uuid(providerId), type: 'user' } },
  },
});

const listing = (id, teamCodes) => ({
  id: uuid(id),
  type: 'listing',
  attributes: { publicData: { teamCodes } },
});

const TEAM = 'team-1';
const CODE = 'NRDEMOAB2';

describe('summarizeTeamSales', () => {
  it('returns zeros when there are no transactions', () => {
    expect(summarizeTeamSales([], [], { teamCode: CODE, teamUserId: TEAM })).toEqual({
      soldCount: 0,
      totalRevenue: 0,
      currency: null,
    });
  });

  it('counts paid transactions for team- and member-posted gear, but revenue only for team-posted', () => {
    const included = [
      listing('L-team', [CODE]),
      listing('L-member', [CODE]),
      listing('L-other', ['NROTHER9']),
    ];
    const transactions = [
      // team-posted, paid -> sold + revenue
      tx({ id: 't1', listingId: 'L-team', providerId: TEAM, payin: 12000, payout: 10800 }),
      // member-posted, paid -> sold only (provider is a member, not the team)
      tx({ id: 't2', listingId: 'L-member', providerId: 'member-9', payin: 2500, payout: 2200 }),
      // another team-posted sale -> sold + revenue
      tx({ id: 't3', listingId: 'L-team', providerId: TEAM, payin: 5000, payout: 4500 }),
      // unpaid (no payin) -> ignored
      tx({ id: 't4', listingId: 'L-team', providerId: TEAM, payin: null, payout: null }),
      // different team's listing -> ignored
      tx({ id: 't5', listingId: 'L-other', providerId: 'x', payin: 9999, payout: 9000 }),
    ];

    const result = summarizeTeamSales(transactions, included, {
      teamCode: CODE,
      teamUserId: TEAM,
    });

    expect(result.soldCount).toBe(3); // t1, t2, t3
    expect(result.totalRevenue).toBe(15300); // 10800 + 4500 (team-posted payouts)
    expect(result.currency).toBe('USD');
  });

  it('ignores transactions whose listing is not in the included data', () => {
    const transactions = [tx({ id: 't1', listingId: 'missing', providerId: TEAM, payin: 1000, payout: 900 })];
    expect(summarizeTeamSales(transactions, [], { teamCode: CODE, teamUserId: TEAM })).toEqual({
      soldCount: 0,
      totalRevenue: 0,
      currency: null,
    });
  });
});
