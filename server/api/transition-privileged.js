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

// --- Shippo label creation logic extracted to a function ---
async function createShippingLabels(bodyParams) {
  // Extract addresses from bodyParams
  const lenderAddress = {
    name: bodyParams?.params?.providerName || 'Lender',
    street1: bodyParams?.params?.providerStreet,
    city: bodyParams?.params?.providerCity,
    state: bodyParams?.params?.providerState,
    zip: bodyParams?.params?.providerZip,
    country: 'US',
    email: bodyParams?.params?.providerEmail,
    phone: bodyParams?.params?.providerPhone,
  };
  const borrowerAddress = {
    name: bodyParams?.params?.customerName || 'Borrower',
    street1: bodyParams?.params?.customerStreet,
    city: bodyParams?.params?.customerCity,
    state: bodyParams?.params?.customerState,
    zip: bodyParams?.params?.customerZip,
    country: 'US',
    email: bodyParams?.params?.customerEmail,
    phone: bodyParams?.params?.customerPhone,
  };
  // Log addresses before Shippo logic
  console.log('🏷️ Addresses received:', { lenderAddress, borrowerAddress });
  if (lenderAddress.street1 && borrowerAddress.street1) {
    try {
      const shipmentRes = await axios.post('https://api.goshippo.com/shipments/', { address_from: lenderAddress, address_to: borrowerAddress, parcels: [ { length: '15', width: '12', height: '2', distance_unit: 'in', weight: '2', mass_unit: 'lb' } ], extra: { qr_code_requested: true }, async: false }, { headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`, 'Content-Type': 'application/json' } });
      const upsRate = shipmentRes.data.rates.find((r) => r.provider === 'UPS');
      if (upsRate) {
        const labelRes = await axios.post('https://api.goshippo.com/transactions', { rate: upsRate.object_id, label_file_type: 'PNG', async: false }, { headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`, 'Content-Type': 'application/json' } });
        console.log('✅ Shippo QR Code:', labelRes.data.qr_code_url);
        console.log('📦 Shippo Label URL:', labelRes.data.label_url);
        console.log('🚚 Shippo Tracking URL:', labelRes.data.tracking_url_provider);
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
            console.log('📦 Shippo Return Label URL:', returnLabelRes.data.label_url);
            console.log('🚚 Shippo Return Tracking URL:', returnLabelRes.data.tracking_url_provider);
          }
        } catch (err) {
          console.error('❌ Shippo return label creation failed:', err.message);
          // Continue with transition even if return label fails
        }
      }
    } catch (err) { 
      console.error('❌ Shippo label creation failed:', err.message);
      // Continue with transition even if shipping label fails
    }
  } else { 
    console.warn('⚠️ Missing address info — skipping Shippo label creation.');
    // Continue with transition even if address info is missing
  }
}

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
  const transactionId = bodyParams?.params?.transactionId?.uuid || bodyParams?.params?.transactionId;
  console.log('🟠 About to call sdk.listings.show with listingId:', listingId);

  // Debug log for listingId and transaction details
  console.log('📋 Request parameters check:', {
    listingId: listingId,
    hasListingId: !!listingId,
    transition: bodyParams?.transition,
    params: bodyParams?.params,
    transactionId: transactionId,
    hasTransactionId: !!transactionId
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
        if (orderData) {
          lineItems = transactionLineItems(
            listing,
            { ...orderData, ...bodyParams.params },
            providerCommission,
            customerCommission
          );
        } else {
          console.warn("⚠️ No orderData provided for non-accept transition. This may cause issues.");
        }
      } else {
        console.log("ℹ️ Skipping lineItems generation — transition/accept will calculate from booking.");
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

      // Always include protectedData in params if present
      let params = { ...restParams };
      if (orderData && orderData.protectedData) {
        params.protectedData = orderData.protectedData;
      }
      // Always include lineItems if present
      if (lineItems) {
        params.lineItems = lineItems;
      }

      // Set id for transition/request-payment and transition/accept
      let id = null;
      if (bodyParams.transition === 'transition/request-payment' || bodyParams.transition === 'transition/confirm-payment') {
        id = transactionId;
      } else if (bodyParams.transition === 'transition/accept') {
        id = transactionId;
      } else {
        id = listingId;
      }

      // Defensive log for id
      console.log('🟢 Using id for Flex API call:', id);

      const body = {
        id,
        transition: bodyParams.transition,
        params,
      };

      // Log the final body before transition
      console.log("🚀 Final body sent to Flex API:", JSON.stringify(body, null, 2));

      // Shippo integration: check for env var
      if (!process.env.SHIPPO_API_TOKEN) {
        console.error('❌ SHIPPO_API_TOKEN is missing! Shippo integration will not work.');
      }

      // Shippo address extraction (fallback to protectedData)
      let protectedData = params.protectedData || {};
      let lenderAddress = {
        name: protectedData.providerName || 'Lender',
        street1: protectedData.providerStreet || '',
        city: protectedData.providerCity || '',
        state: protectedData.providerState || '',
        zip: protectedData.providerZip || '',
        country: 'US',
        email: protectedData.providerEmail || '',
        phone: protectedData.providerPhone || '',
      };
      let borrowerAddress = {
        name: protectedData.customerName || 'Borrower',
        street1: protectedData.customerStreet || '',
        city: protectedData.customerCity || '',
        state: protectedData.customerState || '',
        zip: protectedData.customerZip || '',
        country: 'US',
        email: protectedData.customerEmail || '',
        phone: protectedData.customerPhone || '',
      };
      // Log addresses before Shippo logic
      console.log('🏷️ Addresses received:', { lenderAddress, borrowerAddress });

      // Shippo label creation (with fallback and logging)
      if (lenderAddress.street1 && borrowerAddress.street1 && process.env.SHIPPO_API_TOKEN) {
        try {
          await createShippingLabels(bodyParams);
        } catch (err) {
          console.error('❌ Shippo label creation failed:', err.message);
        }
      } else {
        if (!process.env.SHIPPO_API_TOKEN) {
          console.warn('⚠️ SHIPPO_API_TOKEN missing, skipping Shippo label creation.');
        } else {
          console.warn('⚠️ Missing address info — skipping Shippo label creation.');
        }
      }

      // Perform the actual transition
      try {
        const response = isSpeculative
          ? await getTrustedSdk(req).transactions.transitionSpeculative(body, queryParams)
          : await getTrustedSdk(req).transactions.transition(body, queryParams);
        console.log("✅ Transition successful:", {
          status: response?.status,
          hasData: !!response?.data?.data,
          transition: bodyParams?.transition,
          transactionId: response?.data?.data?.id?.uuid
        });
        return response;
      } catch (err) {
        console.error("❌ Transition failed:", err.message, err);
        return res.status(500).json({ 
          error: "Transaction transition failed",
          details: err.message
        });
      }
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
      console.error("❌ Flex API error:", e.response?.data || e);
      handleError(res, e);
      return;
    });
};