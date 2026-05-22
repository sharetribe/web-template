/**
 * Pure aggregation of a user's own transactions for the Individual dashboard.
 *
 * Fed from the Marketplace SDK: `transactions.query({ only: 'sale' })` (the user is the provider)
 * and `transactions.query({ only: 'order' })` (the user is the customer). Kept pure so the math is
 * unit-testable without live transaction data.
 *
 * A transaction counts once it has a captured `payinTotal` (avoids hard-coding transition names).
 * Amounts are in minor units (cents).
 */

const isPaid = tx => tx?.attributes?.payinTotal?.amount != null;

/**
 * @param {Array} sales transactions where the user is the provider (only: 'sale')
 * @param {Array} orders transactions where the user is the customer (only: 'order')
 * @returns {Object} { soldCount, purchasedCount, totalRevenue, currency }
 */
export const summarizeOwnTransactions = (sales = [], orders = []) => {
  let soldCount = 0;
  let totalRevenue = 0;
  let currency = null;

  (sales || []).forEach(tx => {
    if (!isPaid(tx)) {
      return;
    }
    soldCount += 1;
    const payout = tx.attributes?.payoutTotal;
    if (payout?.amount != null) {
      totalRevenue += payout.amount;
      currency = currency || payout.currency || null;
    }
  });

  const purchasedCount = (orders || []).filter(isPaid).length;

  return { soldCount, purchasedCount, totalRevenue, currency };
};
