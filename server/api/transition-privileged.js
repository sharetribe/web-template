const axios = require('axios');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

console.log('🚦 transition-privileged endpoint is wired up');

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;
  
  // Debug log for full request body
  console.log('🔍 Full request body:', {
    isSpeculative,
    orderData,
    bodyParams,
    queryParams,
    params: bodyParams?.params,
    rawBody: req.body,
    headers: req.headers
  });

  const sdk = getSdk(req, res);
  let lineItems = null;

  // Debug log for listingId and transaction details
  console.log('📋 Request parameters check:', {
    listingId: bodyParams?.params?.listingId,
    hasListingId: !!bodyParams?.params?.listingId,
    transition: bodyParams?.transition,
    params: bodyParams?.params,
    transactionId: bodyParams?.params?.transactionId,
    hasTransactionId: !!bodyParams?.params?.transactionId
  });

  // Verify we have the required parameters before making the API call
  if (!bodyParams?.params?.listingId) {
    console.error('❌ Missing required listingId parameter');
    return res.status(400).json({
      errors: [{
        status: 400,
        code: 'validation-missing-key',
        title: 'Missing required listingId parameter'
      }]
    });
  }

  const listingPromise = () => {
    console.log('📡 Making listing API call with params:', {
      listingId: bodyParams.params.listingId,
      url: '/v1/api/listings/show'
    });
    return sdk.listings.show({ id: bodyParams.params.listingId });
  };

  Promise.all([listingPromise(), fetchCommission(sdk)])
    .then(([showListingResponse, fetchAssetsResponse]) => {
      console.log('✅ Listing API response:', {
        status: showListingResponse?.status,
        hasData: !!showListingResponse?.data?.data,
        listingId: showListingResponse?.data?.data?.id
      });

      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      lineItems = transactionLineItems(
        listing,
        { ...orderData, ...bodyParams.params },
        providerCommission,
        customerCommission
      );

      // Debug log for lineItems
      console.log('💰 Generated lineItems:', {
        hasLineItems: !!lineItems,
        lineItemsCount: lineItems?.length,
        lineItems,
        orderData,
        params: bodyParams?.params,
        listingId: listing?.id
      });

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
        },
      };

      (async (trustedSdk) => {
        const transition = bodyParams?.transition;
        if (transition === 'transition/accept') {
          console.log('🚀 transition/accept block triggered', {
            providerName: bodyParams?.params?.providerName,
            customerName: bodyParams?.params?.customerName,
            hasProviderAddress: !!(bodyParams?.params?.providerStreet && bodyParams?.params?.providerCity),
            hasCustomerAddress: !!(bodyParams?.params?.customerStreet && bodyParams?.params?.customerCity)
          });
          const lenderAddress = { name: bodyParams?.params?.providerName || 'Lender', street1: bodyParams?.params?.providerStreet, city: bodyParams?.params?.providerCity, state: bodyParams?.params?.providerState, zip: bodyParams?.params?.providerZip, country: 'US', email: bodyParams?.params?.providerEmail, phone: bodyParams?.params?.providerPhone };
          const borrowerAddress = { name: bodyParams?.params?.customerName || 'Borrower', street1: bodyParams?.params?.customerStreet, city: bodyParams?.params?.customerCity, state: bodyParams?.params?.customerState, zip: bodyParams?.params?.customerZip, country: 'US', email: bodyParams?.params?.customerEmail, phone: bodyParams?.params?.customerPhone };
          if (lenderAddress.street1 && borrowerAddress.street1) {
            try {
              const shipmentRes = await axios.post('https://api.goshippo.com/shipments/', { address_from: lenderAddress, address_to: borrowerAddress, parcels: [ { length: '15', width: '12', height: '2', distance_unit: 'in', weight: '2', mass_unit: 'lb' } ], extra: { qr_code_requested: true }, async: false }, { headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`, 'Content-Type': 'application/json' } });
              const upsRate = shipmentRes.data.rates.find((r) => r.provider === 'UPS');
              if (upsRate) {
                const labelRes = await axios.post('https://api.goshippo.com/transactions', { rate: upsRate.object_id, label_file_type: 'PNG', async: false }, { headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`, 'Content-Type': 'application/json' } });
                console.log('✅ Shippo QR Code:', labelRes.data.qr_code_url);
                console.log('📦 Label URL:', labelRes.data.label_url);
                console.log('🚚 Tracking URL:', labelRes.data.tracking_url_provider);
              }
            } catch (err) { console.error('❌ Shippo label creation failed:', err.message); }
          } else { console.warn('⚠️ Missing address info — skipping Shippo label creation.'); }
        }
        if (isSpeculative) { return trustedSdk.transactions.transitionSpeculative(body, queryParams); } else { return trustedSdk.transactions.transition(body, queryParams); }
      })(trustedSdk)
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
