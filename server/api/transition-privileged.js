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

  // Log protectedData received from frontend
  if (bodyParams?.params?.protectedData) {
    console.log('🛬 [BACKEND] Received protectedData:', bodyParams.params.protectedData);
  }

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
      // Defensive check for bodyParams and .transition
      if (bodyParams && (bodyParams.transition === 'transition/request-payment' || bodyParams.transition === 'transition/confirm-payment')) {
        id = transactionId;
      } else if (bodyParams && bodyParams.transition === 'transition/accept') {
        id = transactionId;
        // --- [AI EDIT] Fetch protectedData from transaction and overwrite address fields ---
        // Fix: Always extract the UUID string for the transaction
        const transactionIdUUID =
          (bodyParams?.params?.transactionId?.uuid) ||
          (transactionId?.uuid) ||
          (typeof transactionId === 'string' ? transactionId : null);
        if (bodyParams?.transition === 'transition/accept' && transactionIdUUID) {
          try {
            const transaction = await sdk.transactions.show({
              id: transactionIdUUID,
              include: ['booking'],
            });
            const protectedData = transaction?.data?.data?.attributes?.protectedData || {};
            const {
              providerName,
              providerStreet,
              providerCity,
              providerState,
              providerZip,
              providerEmail,
              providerPhone,
              customerName,
              customerStreet,
              customerCity,
              customerState,
              customerZip,
              customerEmail,
              customerPhone,
            } = protectedData;
            bodyParams.params = {
              ...bodyParams.params,
              providerName,
              providerStreet,
              providerCity,
              providerState,
              providerZip,
              providerEmail,
              providerPhone,
              customerName,
              customerStreet,
              customerCity,
              customerState,
              customerZip,
              customerEmail,
              customerPhone,
            };
            console.log('🔄 Overwrote bodyParams.params with protectedData from transaction:', bodyParams.params);
          } catch (err) {
            console.error('❌ Failed to fetch or apply protectedData from transaction:', err.message);
          }
        }
      } else {
        id = listingId;
      }

      // Defensive log for id
      console.log('🟢 Using id for Flex API call:', id);

      const body = {
        id,
        transition: bodyParams?.transition,
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

      // Validate required provider and customer address fields before making the SDK call
      const {
        providerStreet, providerCity, providerState, providerZip, providerEmail, providerPhone,
        customerStreet, customerCity, customerState, customerZip, customerEmail, customerPhone
      } = bodyParams.params || {};

      if (!providerStreet || !providerCity || !providerState || !providerZip || !providerEmail || !providerPhone) {
        console.error('❌ Missing required provider address info');
        if (!res.headersSent) {
          return res.status(400).json({ error: 'Missing provider address info' });
        }
      }
      if (!customerStreet || !customerCity || !customerState || !customerZip || !customerEmail || !customerPhone) {
        console.error('❌ Missing required customer address info');
        if (!res.headersSent) {
          return res.status(400).json({ error: 'Missing customer address info' });
        }
      }

      // Perform the actual transition
      let transitionName;
      try {
        // If this is transition/accept, log the transaction state before attempting
        if (bodyParams && bodyParams.transition === 'transition/accept') {
          try {
            const transactionShow = await sdk.transactions.show({ id: id });
            console.log('🔎 Transaction state before accept:', transactionShow.data.data.attributes.state);
            console.log('🔎 Last transition:', transactionShow.data.data.attributes.lastTransition);
            // Log protectedData from transaction entity
            console.log('🔎 [BACKEND] Transaction protectedData:', transactionShow.data.data.attributes.protectedData);
            // If params.protectedData is missing or empty, fallback to transaction's protectedData
            if (!params.protectedData || Object.values(params.protectedData).every(v => v === '' || v === undefined)) {
              params.protectedData = transactionShow.data.data.attributes.protectedData || {};
              console.log('🔁 [BACKEND] Fallback: Using transaction protectedData for accept:', params.protectedData);
            }
          } catch (showErr) {
            console.error('❌ Failed to fetch transaction before accept:', showErr.message);
          }
        }
        const response = isSpeculative
          ? await getTrustedSdk(req).transactions.transitionSpeculative(body, queryParams)
          : await getTrustedSdk(req).transactions.transition(body, queryParams);
        // After booking (request-payment), log the transaction's protectedData
        if (bodyParams && bodyParams.transition === 'transition/request-payment' && response && response.data && response.data.data && response.data.data.attributes) {
          console.log('🧾 Booking complete. Transaction protectedData:', response.data.data.attributes.protectedData);
        }
        // Defensive: Only access .transition if response and response.data are defined
        if (
          response &&
          response.data &&
          response.data.data &&
          response.data.data.attributes &&
          typeof response.data.data.attributes.transition !== 'undefined'
        ) {
          transitionName = response.data.data.attributes.transition;
        }
        return res.status(200).json({ transition: transitionName });
      } catch (err) {
        console.error('❌ Transition failed:', err);
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Transition failed' });
        }
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
      const errorData = e.response?.data;
      console.error("❌ Flex API error:", errorData || e);
      if (res.headersSent) return; // ✅ Prevent second response
      return res.status(500).json({ 
        error: "Flex API error",
        details: errorData || e.message
      });
    });
};

// Add a top-level handler for unhandled promise rejections to help diagnose Render 'failed service' issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process if desired:
  // process.exit(1);
});