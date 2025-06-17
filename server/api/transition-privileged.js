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

// --- Zapier webhook helper function ---
async function sendZapierWebhook(webhookUrl, payload) {
  console.log('🚀 [ZAPIER] sendZapierWebhook function called');
  
  if (!webhookUrl) {
    console.log('⚠️ [ZAPIER] Webhook URL not configured, skipping');
    return;
  }
  
  try {
    console.log('📱 [ZAPIER] Sending webhook to:', webhookUrl);
    console.log('📱 [ZAPIER] Payload:', payload);
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ [ZAPIER] Webhook sent successfully:', response.status);
    return response;
  } catch (error) {
    console.error('❌ [ZAPIER] Webhook failed:', error.message);
    if (error.response) {
      console.error('❌ [ZAPIER] Response status:', error.response.status);
      console.error('❌ [ZAPIER] Response data:', error.response.data);
    }
    return null;
  }
}

// --- Shippo label creation logic extracted to a function ---
async function createShippingLabels(protectedData, transactionId, listing) {
  console.log('🚀 [SHIPPO] Starting label creation for transaction:', transactionId);
  console.log('📋 [SHIPPO] Using protectedData:', protectedData);
  
  // Extract addresses from protectedData
  const providerAddress = {
    name: protectedData.providerName || 'Provider',
    street1: protectedData.providerStreet,
    street2: protectedData.providerStreet2 || '',
    city: protectedData.providerCity,
    state: protectedData.providerState,
    zip: protectedData.providerZip,
    country: 'US',
    email: protectedData.providerEmail,
    phone: protectedData.providerPhone,
  };
  
  const customerAddress = {
    name: protectedData.customerName || 'Customer',
    street1: protectedData.customerStreet,
    street2: protectedData.customerStreet2 || '',
    city: protectedData.customerCity,
    state: protectedData.customerState,
    zip: protectedData.customerZip,
    country: 'US',
    email: protectedData.customerEmail,
    phone: protectedData.customerPhone,
  };
  
  // Log addresses for debugging
  console.log('🏷️ [SHIPPO] Provider address:', providerAddress);
  console.log('🏷️ [SHIPPO] Customer address:', customerAddress);
  
  // Validate that we have complete address information
  const hasCompleteProviderAddress = providerAddress.street1 && providerAddress.city && providerAddress.state && providerAddress.zip;
  const hasCompleteCustomerAddress = customerAddress.street1 && customerAddress.city && customerAddress.state && customerAddress.zip;
  
  if (!hasCompleteProviderAddress) {
    console.warn('⚠️ [SHIPPO] Incomplete provider address — skipping label creation');
    return { success: false, reason: 'incomplete_provider_address' };
  }
  
  if (!hasCompleteCustomerAddress) {
    console.warn('⚠️ [SHIPPO] Incomplete customer address — skipping label creation');
    return { success: false, reason: 'incomplete_customer_address' };
  }
  
  if (!process.env.SHIPPO_API_TOKEN) {
    console.warn('⚠️ [SHIPPO] SHIPPO_API_TOKEN missing — skipping label creation');
    return { success: false, reason: 'missing_api_token' };
  }
  
  try {
    console.log('📦 [SHIPPO] Creating outbound shipment (provider → customer)...');
    
    // Define the required parcel
    const parcel = {
      length: '12',
      width: '10',
      height: '1',
      distance_unit: 'in',
      weight: '0.75',
      mass_unit: 'lb'
    };

    // Outbound shipment payload
    const outboundPayload = {
      address_from: providerAddress,
      address_to: customerAddress,
      parcels: [parcel],
      extra: { qr_code_requested: true },
      async: false
    };
    console.log('📦 [SHIPPO] Outbound shipment payload:', JSON.stringify(outboundPayload, null, 2));

    // Create outbound shipment (provider → customer)
    const shipmentRes = await axios.post(
      'https://api.goshippo.com/shipments/',
      outboundPayload,
      {
        headers: {
          Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Log all available rates for debugging
    console.log('📊 [SHIPPO] Available rates for outbound shipment:', shipmentRes.data.rates?.map(r => ({
      provider: r.provider,
      servicelevel: r.servicelevel,
      rate: r.rate,
      object_id: r.object_id
    })));
    
    // Try UPS first, then fallback to other providers
    let selectedRate = shipmentRes.data.rates.find((r) => r.provider === 'UPS');
    if (!selectedRate) {
      console.warn('⚠️ [SHIPPO] No UPS rate found, trying other providers...');
      // Try USPS as fallback
      selectedRate = shipmentRes.data.rates.find((r) => r.provider === 'USPS');
      if (!selectedRate) {
        // Take the first available rate
        selectedRate = shipmentRes.data.rates[0];
        console.log('📦 [SHIPPO] Using first available rate:', selectedRate?.provider);
      } else {
        console.log('📦 [SHIPPO] Using USPS as fallback');
      }
    }
    
    if (!selectedRate) {
      console.warn('⚠️ [SHIPPO] No shipping rates found for outbound shipment');
      return { success: false, reason: 'no_shipping_rates' };
    }
    
    // Create outbound label
    const labelRes = await axios.post(
      'https://api.goshippo.com/transactions',
      {
        rate: selectedRate.object_id,
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
    
    console.log('✅ [SHIPPO] Outbound label created successfully:');
    console.log('   📦 Label URL:', labelRes.data.label_url);
    console.log('   📱 QR Code URL:', labelRes.data.qr_code_url);
    console.log('   🚚 Tracking URL:', labelRes.data.tracking_url_provider);
    console.log('   🚚 Provider:', selectedRate.provider);
    console.log('   🚚 Service:', selectedRate.servicelevel);
    
    // Return shipment payload
    const returnPayload = {
      address_from: customerAddress,
      address_to: providerAddress,
      parcels: [parcel],
      extra: { qr_code_requested: true },
      async: false
    };
    console.log('📦 [SHIPPO] Return shipment payload:', JSON.stringify(returnPayload, null, 2));

    // Create return shipment (customer → provider)
    const returnShipmentRes = await axios.post(
      'https://api.goshippo.com/shipments/',
      returnPayload,
      {
        headers: {
          Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Log all available rates for return shipment
    console.log('📊 [SHIPPO] Available rates for return shipment:', returnShipmentRes.data.rates?.map(r => ({
      provider: r.provider,
      servicelevel: r.servicelevel,
      rate: r.rate,
      object_id: r.object_id
    })));
    
    // Try UPS first, then fallback to other providers for return
    let returnSelectedRate = returnShipmentRes.data.rates.find((r) => r.provider === 'UPS');
    let returnLabelRes = null;
    
    if (!returnSelectedRate) {
      console.warn('⚠️ [SHIPPO] No UPS rate found for return, trying other providers...');
      // Try USPS as fallback
      returnSelectedRate = returnShipmentRes.data.rates.find((r) => r.provider === 'USPS');
      if (!returnSelectedRate) {
        // Take the first available rate
        returnSelectedRate = returnShipmentRes.data.rates[0];
        console.log('📦 [SHIPPO] Using first available rate for return:', returnSelectedRate?.provider);
      } else {
        console.log('📦 [SHIPPO] Using USPS as fallback for return');
      }
    }
    
    if (returnSelectedRate) {
      returnLabelRes = await axios.post(
        'https://api.goshippo.com/transactions',
        {
          rate: returnSelectedRate.object_id,
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
      
      console.log('✅ [SHIPPO] Return label created successfully:');
      console.log('   📦 Return Label URL:', returnLabelRes.data.label_url);
      console.log('   📱 Return QR Code URL:', returnLabelRes.data.qr_code_url);
      console.log('   🚚 Return Tracking URL:', returnLabelRes.data.tracking_url_provider);
      console.log('   🚚 Return Provider:', returnSelectedRate.provider);
      console.log('   🚚 Return Service:', returnSelectedRate.servicelevel);
    } else {
      console.warn('⚠️ [SHIPPO] No shipping rates found for return shipment');
    }
    
    // Zapier webhook integration
    const zapierWebhookUrl = process.env.ZAPIER_REQUEST_WEBHOOK;
 
    if (zapierWebhookUrl) {
      try {
        await axios.post(zapierWebhookUrl, {
          phone: protectedData.providerPhone,
          name: protectedData.providerName,
          listing: listing.attributes.title,
          qrCodeUrl: labelRes.data.qr_code_url,
          labelUrl: labelRes.data.label_url,
        });
        console.log('✅ [ZAPIER] Webhook sent successfully');
      } catch (zapierError) {
        console.error('❌ [ZAPIER] Webhook failed:', zapierError.message);
      }
    } else {
      console.log('⚠️ [ZAPIER] ZAPIER_REQUEST_WEBHOOK not configured, skipping webhook');
    }
    
    return { success: true, outboundLabel: labelRes.data, returnLabel: returnLabelRes?.data };
    
  } catch (err) {
    console.error('❌ [SHIPPO] Label creation failed:', err.message);
    if (err.response?.data) {
      console.error('❌ [SHIPPO] Shippo API error details:', err.response.data);
    }
    return { success: false, reason: 'api_error', error: err.message };
  }
}

module.exports = async (req, res) => {
  console.log('🚀 transition-privileged endpoint HIT!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
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

  // Properly await the SDK initialization
  const sdk = await getTrustedSdk(req);
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
    console.error('❌ EARLY RETURN: Missing required listingId parameter');
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

  try {
    const [showListingResponse, fetchAssetsResponse] = await Promise.all([listingPromise(), fetchCommission(sdk)]);
    
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

    // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
    const { listingId: _, ...restParams } = bodyParams?.params || {};

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
      // --- [AI EDIT] Fetch protectedData from transaction and robustly merge with incoming params ---
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
          const txProtectedData = transaction?.data?.data?.attributes?.protectedData || {};
          const incomingProtectedData = bodyParams?.params?.protectedData || {};
          
          // Debug logging to understand the data flow
          console.log('🔍 [DEBUG] Transaction protectedData:', txProtectedData);
          console.log('🔍 [DEBUG] Incoming protectedData:', incomingProtectedData);
          console.log('🔍 [DEBUG] Transaction customer relationship:', transaction?.data?.data?.relationships?.customer);
          
          // Helper: prefer non-empty value from params, else from transaction, else ''
          function preferNonEmpty(paramVal, txVal) {
            return (paramVal !== undefined && paramVal !== '') ? paramVal : (txVal !== undefined && txVal !== '') ? txVal : '';
          }
          // Merge protectedData from transaction with incoming protectedData
          const mergedProtectedData = {
            // Customer fields
            customerName: preferNonEmpty(incomingProtectedData.customerName, txProtectedData.customerName),
            customerStreet: preferNonEmpty(incomingProtectedData.customerStreet, txProtectedData.customerStreet),
            customerStreet2: preferNonEmpty(incomingProtectedData.customerStreet2, txProtectedData.customerStreet2),
            customerCity: preferNonEmpty(incomingProtectedData.customerCity, txProtectedData.customerCity),
            customerState: preferNonEmpty(incomingProtectedData.customerState, txProtectedData.customerState),
            customerZip: preferNonEmpty(incomingProtectedData.customerZip, txProtectedData.customerZip),
            customerEmail: preferNonEmpty(incomingProtectedData.customerEmail, txProtectedData.customerEmail),
            customerPhone: preferNonEmpty(incomingProtectedData.customerPhone, txProtectedData.customerPhone),
            // Provider fields
            providerName: preferNonEmpty(incomingProtectedData.providerName, txProtectedData.providerName),
            providerStreet: preferNonEmpty(incomingProtectedData.providerStreet, txProtectedData.providerStreet),
            providerStreet2: preferNonEmpty(incomingProtectedData.providerStreet2, txProtectedData.providerStreet2),
            providerCity: preferNonEmpty(incomingProtectedData.providerCity, txProtectedData.providerCity),
            providerState: preferNonEmpty(incomingProtectedData.providerState, txProtectedData.providerState),
            providerZip: preferNonEmpty(incomingProtectedData.providerZip, txProtectedData.providerZip),
            providerEmail: preferNonEmpty(incomingProtectedData.providerEmail, txProtectedData.providerEmail),
            providerPhone: preferNonEmpty(incomingProtectedData.providerPhone, txProtectedData.providerPhone),
            // ...any other fields
            ...txProtectedData,
            ...incomingProtectedData,
          };

          // Set both params.protectedData and top-level fields from mergedProtectedData
          params.protectedData = mergedProtectedData;
          Object.assign(params, mergedProtectedData); // Overwrite top-level fields with merged values
          // Log the final params before validation
          console.log('🟢 Params before validation:', params);
          // Validation: check all required fields on params, treat empty string as missing
          const requiredFields = [
            'providerStreet', 'providerCity', 'providerState', 'providerZip', 'providerEmail', 'providerPhone',
            'customerStreet', 'customerCity', 'customerState', 'customerZip', 'customerEmail', 'customerPhone'
          ];
          const missing = requiredFields.filter(key => !params[key] || params[key] === '');
          if (missing.length > 0) {
            console.error('❌ EARLY RETURN: Missing required fields:', missing);
            console.log('❌ Customer address fields are empty - this suggests a frontend issue');
            console.log('❌ Available params:', {
              providerStreet: params.providerStreet,
              providerCity: params.providerCity,
              providerState: params.providerState,
              providerZip: params.providerZip,
              providerEmail: params.providerEmail,
              providerPhone: params.providerPhone,
              customerStreet: params.customerStreet,
              customerCity: params.customerCity,
              customerState: params.customerState,
              customerZip: params.customerZip,
              customerEmail: params.customerEmail,
              customerPhone: params.customerPhone
            });
            return res.status(400).json({ error: `Missing required customer address fields: ${missing.join(', ')}. Please ensure customer shipping information is filled out.` });
          }
          // Debug log for final merged provider fields
          console.log('✅ [MERGE FIX] Final merged provider fields:', {
            providerStreet: mergedProtectedData.providerStreet,
            providerCity: mergedProtectedData.providerCity,
            providerState: mergedProtectedData.providerState,
            providerZip: mergedProtectedData.providerZip,
            providerEmail: mergedProtectedData.providerEmail,
            providerPhone: mergedProtectedData.providerPhone
          });
        } catch (err) {
          console.error('❌ Failed to fetch or apply protectedData from transaction:', err.message);
        }
      }
    } else {
      id = listingId;
    }

    // Log bodyParams.params after protectedData is applied
    console.log('📝 [DEBUG] bodyParams.params after protectedData applied:', bodyParams.params);

    // Defensive log for id
    console.log('🟢 Using id for Flex API call:', id);

    // Use the updated bodyParams.params for the Flex API call
    const body = {
      id,
      transition: bodyParams?.transition,
      params: bodyParams.params,
    };

    // Log the final body before transition
    console.log('🚀 [DEBUG] Final body sent to Flex API:', JSON.stringify(body, null, 2));
    console.log('📦 [DEBUG] Full body object:', body);
    if (body.params && body.params.protectedData) {
      console.log('🔒 [DEBUG] protectedData in final body:', body.params.protectedData);
    }

    console.log('🔍 [DEBUG] About to start validation logic...');

    // Add error handling around validation logic
    try {
      console.log('🔍 [DEBUG] Starting validation checks...');
      
      // Validate required provider and customer address fields before making the SDK call
      const requiredProviderFields = [
        'providerStreet', 'providerCity', 'providerState', 'providerZip', 'providerEmail', 'providerPhone'
      ];
      const requiredCustomerFields = [
        'customerEmail', 'customerName'
      ];
      
      console.log('🔍 [DEBUG] Required provider fields:', requiredProviderFields);
      console.log('🔍 [DEBUG] Required customer fields:', requiredCustomerFields);
      console.log('🔍 [DEBUG] Provider field values:', {
        providerStreet: params.providerStreet,
        providerCity: params.providerCity,
        providerState: params.providerState,
        providerZip: params.providerZip,
        providerEmail: params.providerEmail,
        providerPhone: params.providerPhone
      });
      console.log('🔍 [DEBUG] Customer field values:', {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerStreet: params.customerStreet,
        customerCity: params.customerCity,
        customerState: params.customerState,
        customerZip: params.customerZip,
        customerPhone: params.customerPhone
      });
      
      // Check provider fields (required for shipping)
      const missingProviderFields = requiredProviderFields.filter(key => !params[key] || params[key] === '');
      if (missingProviderFields.length > 0) {
        console.error('❌ EARLY RETURN: Missing required provider address fields:', missingProviderFields);
        console.log('❌ Provider params available:', {
          providerStreet: params.providerStreet,
          providerCity: params.providerCity,
          providerState: params.providerState,
          providerZip: params.providerZip,
          providerEmail: params.providerEmail,
          providerPhone: params.providerPhone
        });
        return res.status(400).json({ error: `Missing required provider address fields: ${missingProviderFields.join(', ')}` });
      }
      
      // Check customer fields (only email and name are required)
      const missingCustomerFields = requiredCustomerFields.filter(key => !params[key] || params[key] === '');
      if (missingCustomerFields.length > 0) {
        console.error('❌ EARLY RETURN: Missing required customer fields:', missingCustomerFields);
        console.log('❌ Customer params available:', {
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          customerStreet: params.customerStreet,
          customerCity: params.customerCity,
          customerState: params.customerState,
          customerZip: params.customerZip,
          customerPhone: params.customerPhone
        });
        return res.status(400).json({ error: `Missing required customer fields: ${missingCustomerFields.join(', ')}` });
      }
      
      console.log('✅ Validation completed successfully');
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      console.error('❌ Validation error stack:', validationError.stack);
      return res.status(500).json({ error: 'Validation error', details: validationError.message });
    }

    // Perform the actual transition
    let transitionName;
    try {
      console.log('🎯 About to make SDK transition call:', {
        transition: bodyParams?.transition,
        id: id,
        isSpeculative: isSpeculative
      });
      
      // If this is transition/accept, log the transaction state before attempting
      if (bodyParams && bodyParams.transition === 'transition/accept') {
        try {
          const transactionShow = await sdk.transactions.show({ id: id });
          console.log('🔎 Current state:', transactionShow.data.data.attributes.state);
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
      
      console.log('🚀 Making final SDK transition call...');
      const response = isSpeculative
        ? await sdk.transactions.transitionSpeculative(body, queryParams)
        : await sdk.transactions.transition(body, queryParams);
      
      console.log('✅ SDK transition call SUCCESSFUL:', {
        status: response?.status,
        hasData: !!response?.data,
        transition: response?.data?.data?.attributes?.transition
      });
      
      // After booking (request-payment), log the transaction's protectedData
      if (bodyParams && bodyParams.transition === 'transition/request-payment' && response && response.data && response.data.data && response.data.data.attributes) {
        console.log('🧾 Booking complete. Transaction protectedData:', response.data.data.attributes.protectedData);
        console.log('🔍 [ZAPIER] Entering transition/request-payment webhook flow');
        console.log('🔍 [ZAPIER] Flow conditions:', {
          isSpeculative,
          hasProtectedData: !!params.protectedData,
          hasProviderPhone: !!params.protectedData?.providerPhone,
          hasListing: !!listing,
          listingTitle: listing?.attributes?.title
        });
        
        console.log('🧭 [ZAPIER DEBUG] Checking if Zapier request webhook should fire');
        console.log('📦 params.protectedData:', params.protectedData);
        console.log('📦 ZAPIER_REQUEST_WEBHOOK env var:', process.env.ZAPIER_REQUEST_WEBHOOK);
        
        // 1. Borrower requests to borrow an item - notify provider
        if (!isSpeculative && params.protectedData?.providerPhone && listing) {
          console.log('📤 Attempting to send Zapier webhook for booking request');
          console.log('🌐 Webhook URL:', process.env.ZAPIER_REQUEST_WEBHOOK);
          
          if (!process.env.ZAPIER_REQUEST_WEBHOOK) {
            console.log('⚠️ TODO: ZAPIER_REQUEST_WEBHOOK environment variable is missing. Please check environment setup.');
            return;
          }
          
          const webhookPayload = {
            to: params.protectedData.providerPhone,
            message: `📦 New borrow request for "${listing.attributes.title}". Log in to review.`
          };
          console.log('📦 Webhook payload:', JSON.stringify(webhookPayload, null, 2));
          
          try {
            await sendZapierWebhook(process.env.ZAPIER_REQUEST_WEBHOOK, webhookPayload);
            console.log('✅ Zapier webhook request sent');
          } catch (webhookError) {
            console.error('❌ [ZAPIER] Failed to send request notification - Full error object:', webhookError);
            console.error('❌ [ZAPIER] Error message:', webhookError.message);
            console.error('❌ [ZAPIER] Error stack:', webhookError.stack);
            if (webhookError.response) {
              console.error('❌ [ZAPIER] Response status:', webhookError.response.status);
              console.error('❌ [ZAPIER] Response data:', webhookError.response.data);
            }
          }
        } else {
          console.log('⚠️ [ZAPIER] Skipping webhook call - conditions not met:', {
            isSpeculative,
            hasProviderPhone: !!params.protectedData?.providerPhone,
            hasListing: !!listing
          });
        }
      }
      
      // 2. Lender accepts the request - notify customer
      if (bodyParams && bodyParams.transition === 'transition/accept' && !isSpeculative && params.protectedData?.customerPhone && listing) {
        try {
          await sendZapierWebhook(process.env.ZAPIER_ACCEPT_WEBHOOK, {
            to: params.protectedData.customerPhone,
            message: `✅ Your borrow request for "${listing.attributes.title}" was accepted!`
          });
        } catch (webhookError) {
          console.error('❌ [ZAPIER] Failed to send accept notification:', webhookError.message);
        }
      }
      
      // 3. Lender declines the request - notify customer
      if (bodyParams && bodyParams.transition === 'transition/decline' && !isSpeculative && params.protectedData?.customerPhone && listing) {
        try {
          await sendZapierWebhook(process.env.ZAPIER_DECLINE_WEBHOOK, {
            to: params.protectedData.customerPhone,
            message: `❌ Your borrow request for "${listing.attributes.title}" was declined.`
          });
        } catch (webhookError) {
          console.error('❌ [ZAPIER] Failed to send decline notification:', webhookError.message);
        }
      }
      
      // Shippo label creation - only for transition/accept after successful transition
      if (bodyParams?.transition === 'transition/accept' && !isSpeculative) {
        console.log('🚀 [SHIPPO] Transition successful, triggering Shippo label creation...');
        
        // Use the validated and merged protectedData from params
        const finalProtectedData = params.protectedData || {};
        console.log('📋 [SHIPPO] Final protectedData for label creation:', finalProtectedData);
        
        // Trigger Shippo label creation asynchronously (don't await to avoid blocking response)
        createShippingLabels(finalProtectedData, transactionId, listing)
          .then(result => {
            if (result.success) {
              console.log('✅ [SHIPPO] Label creation completed successfully');
              
              // 4. QR code/shipping label sent - notify provider
              if (finalProtectedData.providerPhone && listing && result.outboundLabel) {
                sendZapierWebhook(process.env.ZAPIER_LABEL_SENT_WEBHOOK, {
                  to: finalProtectedData.providerPhone,
                  message: `📮 Your shipping label for "${listing.attributes.title}" is ready.`,
                  labelUrl: result.outboundLabel.label_url
                }).catch(webhookError => {
                  console.error('❌ [ZAPIER] Failed to send label notification:', webhookError.message);
                });
              }
            } else {
              console.warn('⚠️ [SHIPPO] Label creation failed:', result.reason);
            }
          })
          .catch(err => {
            console.error('❌ [SHIPPO] Unexpected error in label creation:', err.message);
          });
      }
      
      // 6. Borrower notified when item is shipped
      if (bodyParams && bodyParams.transition === 'transition/mark-shipped' && !isSpeculative && params.protectedData?.customerPhone && listing) {
        try {
          // Note: trackingUrl would need to be passed in params or fetched from transaction
          const trackingUrl = params.trackingUrl || '';
          await sendZapierWebhook(process.env.ZAPIER_ITEM_SHIPPED_WEBHOOK, {
            to: params.protectedData.customerPhone,
            message: `📦 Your item "${listing.attributes.title}" is on the way!`,
            trackingUrl: trackingUrl
          });
        } catch (webhookError) {
          console.error('❌ [ZAPIER] Failed to send shipped notification:', webhookError.message);
        }
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
      console.log('✅ Transition completed successfully, returning:', { transition: transitionName });
      return res.status(200).json({ transition: transitionName });
    } catch (err) {
      console.error('❌ SDK transition call FAILED:', {
        error: err,
        errorMessage: err.message,
        errorResponse: err.response?.data,
        errorStatus: err.response?.status,
        errorStatusText: err.response?.statusText,
        fullError: JSON.stringify(err, null, 2)
      });
      return res.status(500).json({ error: 'Transition failed' });
    }
  } catch (e) {
    const errorData = e.response?.data;
    console.error("❌ Flex API error:", errorData || e);
    return res.status(500).json({ 
      error: "Flex API error",
      details: errorData || e.message
    });
  }
};

// Add a top-level handler for unhandled promise rejections to help diagnose Render 'failed service' issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process if desired:
  // process.exit(1);
});