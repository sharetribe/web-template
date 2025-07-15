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

const getMetadata = (orderData, transition, actor) => {
  const { quoteInSubunits, transitionIntent } = orderData || {};
  const isIntentionToMakeOffer = transitionIntent === 'make-offer' && quoteInSubunits > 0;
  return isIntentionToMakeOffer
    ? {
        metadata: {
          offers: [
            {
              quoteInSubunits,
              by: actor,
              transition,
            },
          ],
        },
      }
    : {};
};

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  let lineItems = null;
  let metadataMaybe = {};

  Promise.all([listingPromise(sdk, bodyParams?.params?.listingId), fetchCommission(sdk)])
    .then(([showListingResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

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
      metadataMaybe = getMetadata(orderData, bodyParams.transition, actor);

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      const { params } = bodyParams;

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
          lineItems,
          ...metadataMaybe,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.initiateSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.initiate(body, queryParams);
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
