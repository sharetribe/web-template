const { transactionLineItems } = require('../api-util/lineItems');
const sharetribeSdk = require('sharetribe-flex-sdk');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

const { Money } = sharetribeSdk.types;

const listingPromise = (sdk, id) => sdk.listings.show({ id });
const transactionPromise = (sdk, id) => sdk.transactions.show({ id });

const getFullOrderData = (orderData, bodyParams, currency) => {
  const { quoteInSubunits, transitionIntent } = orderData || {};
  const isIntentionToMakeOffer = transitionIntent === 'make-offer' && quoteInSubunits > 0;
  return isIntentionToMakeOffer
    ? {
        ...orderData,
        ...bodyParams.params,
        quote: new Money(quoteInSubunits, currency),
      }
    : { ...orderData, ...bodyParams.params };
};

const getMetadata = (orderData, transition, actor, existingMetadata) => {
  const { quoteInSubunits, transitionIntent } = orderData || {};
  const isIntentionToMakeOffer = transitionIntent === 'make-offer' && quoteInSubunits > 0;
  return isIntentionToMakeOffer
    ? {
        metadata: {
          ...existingMetadata,
          offers: [
            ...(existingMetadata.offers || []),
            {
              quoteInSubunits,
              by: actor,
              transition,
            },
          ],
        },
      }
    : existingMetadata
    ? { metadata: existingMetadata }
    : {};
};

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  let lineItems = null;
  let metadataMaybe = {};

  Promise.all([
    listingPromise(sdk, bodyParams?.params?.listingId),
    transactionPromise(sdk, orderData?.transactionId),
    fetchCommission(sdk),
  ])
    .then(responses => {
      const [showListingResponse, showTransactionResponse, fetchAssetsResponse] = responses;
      const listing = showListingResponse.data.data;
      const transaction = showTransactionResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const existingMetadata = transaction?.attributes?.metadata;
      // NOTE: for now, the actor is always "provider".
      const hasActor = ['provider', 'customer'].includes(orderData.actor);
      const actor = hasActor ? orderData.actor : null;
      const currency = listing.attributes.price.currency;
      const fullOrderData = getFullOrderData(orderData, bodyParams, currency);

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      lineItems = transactionLineItems(
        listing,
        fullOrderData,
        providerCommission,
        customerCommission
      );

      metadataMaybe = getMetadata(orderData, bodyParams.transition, actor, existingMetadata);

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
      const { listingId, ...restParams } = bodyParams?.params || {};

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...restParams,
          lineItems,
          ...metadataMaybe,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.transitionSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.transition(body, queryParams);
    })
    .then(apiResponse => {
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
    })
    .catch(e => {
      handleError(res, e);
    });
};
