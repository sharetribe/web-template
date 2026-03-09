/**
 * Price Tracker API Endpoint
 * 
 * This endpoint fetches historical transaction data (sold items) from Sharetribe
 * and returns price information for items matching the given filters.
 * Now includes trend data for the last month.
 */

const { getTrustedSdk, handleError } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { keyword = '', category = '', page = 1, perPage = 20, sortBy = 'date', sortOrder = 'desc' } = req.query;

  getTrustedSdk(req)
    .then(async sdk => {
      // 1. Fetch transactions for the list
      const queryParams = {
        states: ['state/completed', 'state/delivered'],
        perPage: Math.min(parseInt(perPage, 10) || 20, 100), // Cap at 100 items per page
        page: Math.max(parseInt(page, 10) || 1, 1),
        include: ['listing'],
        'fields.transaction': ['lastTransitionedAt', 'lineItems'],
        'fields.listing': ['title', 'publicData'],
      };

      // 2. Fetch trend data for the last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const trendQueryParams = {
        states: ['state/completed', 'state/delivered'],
        last_transitioned_at_start: oneMonthAgo.toISOString(),
        per_page: 100, // Get up to 100 recent sales for the trend
      };

      const [listResponse, trendResponse] = await Promise.all([
        sdk.transactions.query(queryParams),
        sdk.transactions.query(trendQueryParams)
      ]);

      const transactions = listResponse.data.data || [];
      const listings = listResponse.data.included || [];
      const meta = listResponse.data.meta || {};

      // Process transactions to extract price information
      const priceData = transactions
        .map(transaction => {
          const listingRef = transaction.relationships?.listing?.data;
          const listing = listings.find(l => l.id.uuid === listingRef?.id.uuid);
          const lineItems = transaction.attributes?.lineItems || [];
          
          // Find the main line item (usually the first one that's not a commission)
          const mainLineItem = lineItems.find(item => !item.code.includes('commission')) || lineItems[0];
          
          if (!mainLineItem || !listing) {
            return null;
          }

          const listingTitle = listing.attributes?.title || 'Unknown Item';
          const listingCategory = listing.attributes?.publicData?.category || '';
          const price = mainLineItem.lineTotal?.amount || 0;
          const currency = mainLineItem.lineTotal?.currency || 'USD';
          const soldDate = transaction.attributes?.lastTransitionedAt || transaction.attributes?.createdAt;

          return {
            id: transaction.id.uuid,
            listingId: listing.id.uuid,
            title: listingTitle,
            category: listingCategory,
            price: price / 100, // Convert from cents to dollars
            currency,
            soldDate,
            transactionId: transaction.id.uuid,
          };
        })
        .filter(item => item !== null);

      // Filter by keyword if provided
      let filteredData = priceData;
      if (keyword.trim()) {
        const lowerKeyword = keyword.toLowerCase();
        filteredData = priceData.filter(
          item =>
            item.title.toLowerCase().includes(lowerKeyword) ||
            item.category.toLowerCase().includes(lowerKeyword)
        );
      }

      // Filter by category if provided
      if (category.trim()) {
        filteredData = filteredData.filter(item => item.category === category);
      }

      // Sort the results
      filteredData.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'price') {
          comparison = a.price - b.price;
        } else {
          // Default to date sorting
          comparison = new Date(a.soldDate) - new Date(b.soldDate);
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Process trend data: group by date and calculate average price
      const trendTransactions = trendResponse.data.data || [];
      const trendMap = {};
      trendTransactions.forEach(tx => {
        const dateStr = new Date(tx.attributes.lastTransitionedAt).toISOString().split('T')[0];
        const lineItems = tx.attributes.lineItems || [];
        const mainLineItem = lineItems.find(item => !item.code.includes('commission')) || lineItems[0];
        const price = mainLineItem ? mainLineItem.lineTotal.amount / 100 : 0;

        if (!trendMap[dateStr]) {
          trendMap[dateStr] = { total: 0, count: 0 };
        }
        trendMap[dateStr].total += price;
        trendMap[dateStr].count += 1;
      });

      const trends = Object.keys(trendMap).map(date => ({
        date,
        price: Math.round((trendMap[date].total / trendMap[date].count) * 100) / 100,
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Return the processed data with metadata
      res
        .status(200)
        .set('Content-Type', 'application/json')
        .json({
          data: filteredData,
          trends: trends,
          meta: {
            totalItems: filteredData.length,
            page: parseInt(page, 10) || 1,
            perPage: parseInt(perPage, 10) || 20,
            totalPages: Math.ceil(filteredData.length / (parseInt(perPage, 10) || 20)),
            originalMeta: meta,
          },
        })
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
