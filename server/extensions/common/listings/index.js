const { denormalisedResponseEntities } = require('../data/data');
const { integrationSdk } = require('../sdk');

const queryAllListings = async (params = {}, page = 1) => {
  const { createdAtEnd, perPage = 100 } = params;
  console.log('Querying listings page:', page);

  const queryResult = await integrationSdk.listings.query({
    ...params,
    ...(createdAtEnd ? { createdAtEnd } : { page: 1 }),
  });
  const listings = denormalisedResponseEntities(queryResult);

  if (listings.length < perPage) {
    return listings;
  }
  const { createdAt } = listings[listings.length - 1].attributes;
  const nextListings = await queryAllListings(
    {
      ...params,
      createdAtEnd: createdAt,
    },
    page + 1
  );

  return listings.concat(nextListings);
};

module.exports = { queryAllListings };
