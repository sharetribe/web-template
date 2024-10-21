const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

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

    const { providerCommission, customerCommission } =
      commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

    const lineItems = await transactionLineItems(
      listing,
      { ...orderData, ...bodyParams.params },
      providerCommission,
      customerCommission
    );

    // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
    const { listingId, ...restParams } = bodyParams?.params || {};

    // Add lineItems to the body params
    const body = {
      ...bodyParams,
      params: {
        ...restParams,
        lineItems,
      },
    };

    const apiResponse = isSpeculative
      ? await trustedSdk.transactions.transitionSpeculative(body, queryParams)
      : await trustedSdk.transactions.transition(body, queryParams);

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
