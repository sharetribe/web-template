const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');
const { retrieveCommissionAndFlatFee } = require('../extensions/line-items/utils');

module.exports = async (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);

  const listingPromise = () => sdk.listings.show({ id: bodyParams?.params?.listingId });

  try {
    const [showListingResponse, fetchAssetsResponse, trustedSdk] = await Promise.all([
      listingPromise(),
      fetchCommission(sdk),
      getTrustedSdk(req),
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
      { ...orderData, ...bodyParams.params },
      providerCommission,
      customerCommission,
      providerFlatFee
    );

    const { params } = bodyParams;

    // Add lineItems to the body params
    const body = {
      ...bodyParams,
      params: {
        ...params,
        lineItems,
      },
    };

    const apiResponse = isSpeculative
      ? await trustedSdk.transactions.initiateSpeculative(body, queryParams)
      : await trustedSdk.transactions.initiate(body, queryParams);

    const { status, statusText, data } = apiResponse;
    res
      .status(status)
      .set('Content-Type', 'application/transit+json')
      .send(
        serialize({
          status,
          statusText,
          data,
        })
      )
      .end();
  } catch (e) {
    handleError(res, e);
  }
};
