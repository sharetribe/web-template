require('dotenv').config();

const { integrationSdk } = require('../../common/sdk.js');
const { denormalisedResponseEntities } = require('../../common/data/data');

const PER_PAGE = 100;

const fetchAllListings = async (integrationSdk, page = 1) => {
  const res = await integrationSdk.listings.query({
    perPage: PER_PAGE,
    page,
    minStock: 1,
    pub_listingType: 'sell,sell-service',
    pub_transactionProcessAlias: 'default-purchase/release-1',
    pub_categoryLevel1: 'location,location-find,location-machine,atm-location',
    'fields.listing': [
      // 'publicData.listingType',
      // 'publicData.categoryLevel1',
      // 'publicData.transactionProcessAlias',
    ],
  });
  const listings = denormalisedResponseEntities(res);

  const { meta } = res.data;
  console.log(`Finish fetch listings page ${page} of ${meta.totalPages}`);

  if (meta.totalPages <= page) {
    return listings;
  }

  return listings.concat(await fetchAllListings(integrationSdk, page + 1));
};

const main = async () => {
  try {
    const listings = await fetchAllListings(integrationSdk);
    const totalListings = listings.length;

    console.log('Total listings:', totalListings);

    await Promise.all(
      listings.map(async (listing, index) => {
        const id = listing.id;

        await integrationSdk.listings.update({
          id,
          publicData: {
            transactionProcessAlias: 'sell-purchase/release-1',
          },
        });

        console.log(`[${index + 1}/${totalListings}] Update successful for listing:`, id.uuid);
      })
    );
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

main();
