import { summarizeOwnTransactions } from './transactionMetrics';

const tx = ({ payin, payout, currency = 'USD' }) => ({
  attributes: {
    payinTotal: payin == null ? null : { amount: payin, currency },
    payoutTotal: payout == null ? null : { amount: payout, currency },
  },
});

describe('summarizeOwnTransactions', () => {
  it('returns zeros for no transactions', () => {
    expect(summarizeOwnTransactions([], [])).toEqual({
      soldCount: 0,
      purchasedCount: 0,
      totalRevenue: 0,
      currency: null,
    });
  });

  it('counts paid sales + revenue and paid orders, ignoring unpaid', () => {
    const sales = [
      tx({ payin: 12000, payout: 10800 }),
      tx({ payin: 5000, payout: 4500 }),
      tx({ payin: null, payout: null }), // unpaid -> ignored
    ];
    const orders = [tx({ payin: 2500, payout: 2200 }), tx({ payin: null })];

    expect(summarizeOwnTransactions(sales, orders)).toEqual({
      soldCount: 2,
      purchasedCount: 1,
      totalRevenue: 15300,
      currency: 'USD',
    });
  });

  it('handles missing arguments', () => {
    expect(summarizeOwnTransactions()).toEqual({
      soldCount: 0,
      purchasedCount: 0,
      totalRevenue: 0,
      currency: null,
    });
  });
});
