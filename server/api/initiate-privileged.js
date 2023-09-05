const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams,commission } = req.body;

  console.log('comissionValue');
  console.log(commission);
  console.log('req.body');
  console.log(req.body);


  const sdk = getSdk(req, res);
  let lineItems = null;

  sdk.listings
    .show({ id: bodyParams?.params?.listingId })
    .then(listingResponse => {
      const listing = listingResponse.data.data;
      const variantCheck = (bodyParams.params 
        && bodyParams.params.stockReservationVariant 
        && listing.attributes.publicData
        && listing.attributes.publicData.variants);

      if(variantCheck){
        const variantId = bodyParams.params.stockReservationVariant - 1;
        const variantSelected = listing.attributes.publicData.variants[variantId];
        listing.attributes.price.amount = variantSelected.variantPrice;
      }
      
      lineItems = transactionLineItems(listing, { ...orderData, ...bodyParams.params }, commission);

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
