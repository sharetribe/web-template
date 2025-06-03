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

  // Extract uuid from listingId if needed
  const listingId = bodyParams?.params?.listingId?.uuid || bodyParams?.params?.listingId;

  // Debug log for listingId and transaction details
  console.log('📋 Request parameters check:', {
    listingId: listingId,
    hasListingId: !!listingId,
    transition: bodyParams?.transition,
    params: bodyParams?.params,
    transactionId: bodyParams?.params?.transactionId,
    hasTransactionId: !!bodyParams?.params?.transactionId
  });

  // Verify we have the required parameters before making the API call
  if (!listingId) {
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
      listingId: listingId,
      url: '/v1/api/listings/show'
    });
    return sdk.listings.show({ id: listingId });
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

      // Debug log for orderData
      console.log("📦 orderData for lineItems:", orderData);

      // Only calculate lineItems here if not transition/accept
      let transition = bodyParams?.transition;
      if (transition !== 'transition/accept') {
        lineItems = transactionLineItems(
          listing,
          { ...orderData, ...bodyParams.params },
          providerCommission,
          customerCommission
        );
      }

      // Debug log for lineItems
      console.log('💰 Generated lineItems:', {
        hasLineItems: !!lineItems,
        lineItemsCount: lineItems?.length,
        lineItems,
        params: bodyParams?.params,
        listingId: listing?.id
      });

      // Pass all needed variables forward
      return { listing, providerCommission, customerCommission, lineItems };
    })
    .then(async ({ listing, providerCommission, customerCommission, lineItems }) => {
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

      // Await the trusted SDK instance
      const trustedSdk = await getTrustedSdk(req);
      console.log("🛠 trustedSdk keys:", trustedSdk ? Object.keys(trustedSdk) : "undefined");

      const transition = bodyParams?.transition;
      if (transition === 'transition/accept') {
        console.log("🚦 Entered transition/accept block");
        // Debug log for raw transactionId param
        console.log("🔎 Raw transactionId param:", bodyParams?.params?.transactionId);
        const transactionId = bodyParams?.params?.transactionId?.uuid || bodyParams?.params?.transactionId;
        console.log("📦 Using transactionId:", transactionId);
        let bookingStart, bookingEnd;
        try {
          if (!trustedSdk || !trustedSdk.transactions) {
            console.error("❌ trustedSdk or trustedSdk.transactions is undefined!");
            return res.status(500).json({ error: "Internal error: trustedSdk.transactions is undefined." });
          }
          const txRes = await trustedSdk.transactions.show({ id: transactionId });
          console.log("🧾 Full transaction object:", JSON.stringify(txRes.data.data, null, 2));
          console.log("🔍 Transaction attributes:", txRes.data.data.attributes);

          const booking = txRes.data.data.attributes.booking;
          if (!booking) {
            // In Flex, booking may not exist until a later transition (e.g., after accept/confirm-booking)
            console.warn("⚠️ No booking found on transaction. Skipping recalculation.");
            // Proceed with original lineItems (do not recalculate)
            return isSpeculative
              ? trustedSdk.transactions.transitionSpeculative(body, queryParams)
              : trustedSdk.transactions.transition(body, queryParams);
          }
          bookingStart = booking?.start;
          bookingEnd = booking?.end;

          console.log("🕓 bookingStart:", bookingStart);
          console.log("🕓 bookingEnd:", bookingEnd);
        } catch (err) {
          console.error("❌ Failed to fetch transaction for booking dates:", err.message, err);
          console.log("❌ Could not fetch transaction, skipping booking extraction.");
          return res.status(500).json({ error: "Failed to fetch transaction for booking dates." });
        }
        // Only now, after fetching booking dates, calculate lineItems
        console.log("🔬 transactionLineItems input:", {
          listing,
          bookingStart,
          bookingEnd,
          params: bodyParams.params,
          providerCommission,
          customerCommission
        });
        let newLineItems = transactionLineItems(
          listing,
          { bookingStart, bookingEnd, ...bodyParams.params },
          providerCommission,
          customerCommission
        );
        // Extract original lineItems from the transaction as a fallback
        const originalLineItems = txRes.data.data.attributes.lineItems;
        // Null-check and fallback
        if (Array.isArray(newLineItems) && newLineItems.length > 0) {
          body.params.lineItems = newLineItems;
          console.log("✅ Final body.params.lineItems before transition:", body.params.lineItems);
        } else if (Array.isArray(originalLineItems) && originalLineItems.length > 0) {
          body.params.lineItems = originalLineItems;
          console.warn("⚠️ Falling back to original transaction lineItems:", originalLineItems);
        } else {
          console.error("❌ No valid lineItems available. Aborting transition.");
          return res.status(400).json({ error: "No valid lineItems available for transition." });
        }
        console.log('🧾 Incoming transition/accept params:', JSON.stringify(bodyParams?.params, null, 2));
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

              // Create return label (borrower ➜ lender)
              try {
                const returnShipmentRes = await axios.post('https://api.goshippo.com/shipments/', 
                  { 
                    address_from: borrowerAddress, 
                    address_to: lenderAddress, 
                    parcels: [{ length: '15', width: '12', height: '2', distance_unit: 'in', weight: '2', mass_unit: 'lb' }], 
                    extra: { qr_code_requested: true }, 
                    async: false 
                  }, 
                  { 
                    headers: { 
                      Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                const returnUpsRate = returnShipmentRes.data.rates.find((r) => r.provider === 'UPS');
                if (returnUpsRate) {
                  const returnLabelRes = await axios.post('https://api.goshippo.com/transactions', 
                    { 
                      rate: returnUpsRate.object_id, 
                      label_file_type: 'PNG', 
                      async: false 
                    }, 
                    { 
                      headers: { 
                        Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                        'Content-Type': 'application/json' 
                      } 
                    }
                  );
                  console.log('✅ Shippo Return QR Code:', returnLabelRes.data.qr_code_url);
                  console.log('📦 Return Label URL:', returnLabelRes.data.label_url);
                  console.log('🚚 Return Tracking URL:', returnLabelRes.data.tracking_url_provider);
                }
              } catch (err) {
                console.error('❌ Shippo return label creation failed:', err.message);
              }
            }
          } catch (err) { console.error('❌ Shippo label creation failed:', err.message); }
        } else { console.warn('⚠️ Missing address info — skipping Shippo label creation.'); }
      }
      if (isSpeculative) { return trustedSdk.transactions.transitionSpeculative(body, queryParams); } else { return trustedSdk.transactions.transition(body, queryParams); }
    })
    .then(apiResponse => {
      if (!apiResponse) {
        console.error('❌ apiResponse is undefined.');
        return res.status(500).json({ error: 'Internal server error: apiResponse is undefined.' });
      }
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
      return;
    });
};