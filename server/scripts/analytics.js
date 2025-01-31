const { integrationSdkInit } = require('../api-util/scriptManager');

const SCRIPT_NAME = 'analytics';

async function script() {
  console.log(`Loading event script: ${SCRIPT_NAME}`);
  try {
    const integrationSdk = integrationSdkInit();
    // We query the marketplace resource. The `show` function returns a
    // Promise that resolves with a response object.
    integrationSdk.marketplace.show().then(res => {
      const marketplace = res.data.data;
      console.log(`Name: ${marketplace.attributes.name}`);
    });

    // Let's query minimal data of different resources just to see the
    // response metadata.
    const minimalOptions = {
      'fields.user': 'none',
      'fields.listing': 'none',
      'fields.transaction': 'none',
      perPage: 1,
    };
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth());

    const totalItems = response => {
      return response.data.meta.totalItems;
    };
    const logResults = ([
      marketplace,
      users,
      listings,
      transactions,
      draftListings,
      pendingListings,
      publishedListings,
      closedListings,
      newUsers,
      newListings,
      newTransactions,
    ]) => {
      const { name } = marketplace.data.data.attributes;
      console.log(`================ ${name} analytics ================`);
      console.log('');
      console.log(`Listings: ${totalItems(listings)}`);
      console.log(` - ${totalItems(draftListings)} draft(s)`);
      console.log(` - ${totalItems(pendingListings)} pending approval`);
      console.log(` - ${totalItems(publishedListings)} published`);
      console.log(` - ${totalItems(closedListings)} closed`);
      console.log('');
      console.log(`Users: ${totalItems(users)}`);
      console.log(`Transactions: ${totalItems(transactions)}`);
      console.log('');
      console.log(`This month, starting from ${currentMonthStart.toDateString()}:`);
      console.log(` - ${totalItems(newUsers)} new user(s)`);
      console.log(` - ${totalItems(newListings)} new listing(s)`);
      console.log(` - ${totalItems(newTransactions)} new transaction(s)`);
    };

    const results = await Promise.all([
      integrationSdk.marketplace.show(),
      // All users, listings, and transactions
      integrationSdk.users.query(minimalOptions),
      integrationSdk.listings.query(minimalOptions),
      integrationSdk.transactions.query(minimalOptions),
      // Listings in different states
      integrationSdk.listings.query({
        states: ['draft'],
        ...minimalOptions,
      }),
      integrationSdk.listings.query({
        states: ['pendingApproval'],
        ...minimalOptions,
      }),
      integrationSdk.listings.query({
        states: ['published'],
        ...minimalOptions,
      }),
      integrationSdk.listings.query({
        states: ['closed'],
        ...minimalOptions,
      }),
      // New users, listings, and transactions this month
      integrationSdk.users.query({
        createdAtStart: currentMonthStart,
        ...minimalOptions,
      }),
      integrationSdk.listings.query({
        createdAtStart: currentMonthStart,
        ...minimalOptions,
      }),
      integrationSdk.transactions.query({
        createdAtStart: currentMonthStart,
        ...minimalOptions,
      }),
    ]);
    logResults(results);
  } catch (err) {
    console.error(`SCRIPT ERROR | ${SCRIPT_NAME}: `, err);
  }
}

module.exports = script;
