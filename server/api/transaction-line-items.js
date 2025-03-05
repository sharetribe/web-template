const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems } = require('../api-util/lineItemHelpers');
const { extractOverridingProviderCommissionPercent, extractOverridingCustomerCommissionPercent } = require('./util/commission-override');

module.exports = (req, res) => {
  const { isOwnListing, listingId, orderData } = req.body;

  const sdk = getSdk(req, res);

  const userDataPromise = () => sdk.authInfo().then(authInfo => {
    if (authInfo && authInfo.isAnonymous === false) {
      return sdk.currentUser.show({});
    }
    return Promise.resolve("Unauthenticated");
  });

  const listingPromise = () =>
    isOwnListing ? sdk.ownListings.show({ id: listingId }) : sdk.listings.show({ id: listingId, include: 'author' });

  Promise.all([listingPromise(), userDataPromise(), fetchCommission(sdk)])
    .then(async ([showListingResponse, userDataResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      const lineItems = await transactionLineItems(
        listing,
        orderData,
        extractOverridingProviderCommissionPercent(showListingResponse, providerCommission),
        extractOverridingCustomerCommissionPercent(userDataResponse, customerCommission)
      );

      // Because we are using returned lineItems directly in this template we need to use the helper function
      // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
      const validLineItems = constructValidLineItems(lineItems);

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: validLineItems }))
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
