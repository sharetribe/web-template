const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems } = require('../api-util/lineItemHelpers');
const { retrieveCommissionAndFlatFee } = require('../extensions/line-items/utils');

module.exports = async (req, res) => {
  const { isOwnListing, listingId, orderData } = req.body;

  const sdk = getSdk(req, res);

  const listingPromise = () =>
    isOwnListing ? sdk.ownListings.show({ id: listingId }) : sdk.listings.show({ id: listingId });

  try {
    const [showListingResponse, fetchAssetsResponse] = await Promise.all([
      listingPromise(),
      fetchCommission(sdk),
    ]);
    const listing = showListingResponse.data.data;
    const commissionAsset = fetchAssetsResponse.data.data[0];

    const {
      providerCommission,
      customerCommission,
      providerFlatFee,
    } = await retrieveCommissionAndFlatFee(listing, commissionAsset);

    const lineItems = await transactionLineItems(
      listing,
      orderData,
      providerCommission,
      customerCommission,
      providerFlatFee,
      {
        isAllowOrderDataCurrency: true,
      }
    );

    // Because we are using returned lineItems directly in this template we need to use the helper function
    // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
    const validLineItems = constructValidLineItems(lineItems);

    res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ data: validLineItems }))
      .end();
  } catch (e) {
    handleError(res, e);
  }
};
