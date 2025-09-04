const axios = require('axios');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');
const { maskPhone } = require('../api-util/phone');

// ---- helpers (add once, top-level) ----
const safePick = (obj, keys = []) =>
  Object.fromEntries(keys.map(k => [k, obj && typeof obj === 'object' ? obj[k] : undefined]));

const maskUrl = (u) => {
  try {
    if (!u) return '';
    const url = new URL(u);
    // keep origin + first 3 path signatures
    const parts = url.pathname.split('/').filter(Boolean).slice(0, 3);
    return `${url.origin}/${parts.join('/')}${parts.length ? '/...' : ''}`;
  } catch {
    return String(u || '').split('?')[0];
  }
};

const logTx = (prefix, tx) => {
  const fields = safePick(tx, [
    'object_id',
    'status',
    'tracking_number',
    'tracking_url_provider',
    'label_url',
    'qr_code_url',
  ]);
  fields.label_url = maskUrl(fields.label_url);
  fields.qr_code_url = maskUrl(fields.qr_code_url);
  console.log(prefix, fields);
};
// ---------------------------------------

// Conditional import of sendSMS to prevent module loading errors
let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve(); // No-op function
}

// QR delivery reliability: in-memory cache for transaction QR data
const qrCache = new Map(); // key: transactionId, value: { qrCodeUrl, labelUrl, expiresAt, savedAt }

// Evict entries older than 24h on an interval
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
  let evicted = 0;
  
  for (const [key, value] of qrCache.entries()) {
    if (value.savedAt < cutoff) {
      qrCache.delete(key);
      evicted++;
    }
  }
  
  if (evicted > 0) {
    console.log(`🧹 [QR_CACHE] Evicted ${evicted} expired entries`);
  }
}, 60 * 60 * 1000); // Run every hour

// Robust persistence with retry logic for Shippo data
async function persistWithRetry(id, data, { retries = 3, delayMs = 250 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 1. Get latest transaction data
      const tx = await data.sdk.transactions.show({ id });
      const currentProtectedData = tx?.data?.data?.attributes?.protectedData || {};
      
      // 2. Merge with new Shippo data
      const mergedProtectedData = {
        ...currentProtectedData,
        shippo: {
          ...currentProtectedData.shippo,
          outbound: {
            ...currentProtectedData.shippo?.outbound,
            ...data.shippoData
          },
          updatedAt: new Date().toISOString()
        }
      };
      
      // 3. Update transaction
      await data.sdk.transactions.update({ 
        id, 
        protectedData: mergedProtectedData 
      });
      
      console.log(`✅ [flex-persist] Successfully persisted Shippo data for transaction ${id}`);
      return true;
      
    } catch (error) {
      const status = error?.response?.status;
      
      if (status === 409 && attempt < retries) {
        console.warn(`[flex-persist] 409 conflict – retrying ${attempt}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      if (attempt === retries) {
        console.error(`❌ [flex-persist] Failed after ${retries} attempts:`, error.message);
        return false;
      }
    }
  }
}

console.log('🚦 transition-privileged endpoint is wired up');

// Helper function to get borrower phone number with fallbacks
const getBorrowerPhone = (params, tx) =>
  params?.protectedData?.customerPhone ??
  tx?.protectedData?.customerPhone ??
  tx?.relationships?.customer?.attributes?.profile?.protectedData?.phone ?? // last resort if we have it
  null;

// --- Shippo label creation logic extracted to a function ---
async function createShippingLabels(protectedData, transactionId, listing, sendSMS, sharetribeSdk, req) {
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
          'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📦 [SHIPPO] Outbound shipment created successfully');
    console.log('📦 [SHIPPO] Shipment ID:', shipmentRes.data.object_id);
    
    // Select a shipping rate from the available rates
    const availableRates = shipmentRes.data.rates || [];
    console.log('📊 [SHIPPO] Available rates:', availableRates.length);
    
    if (availableRates.length === 0) {
      console.error('❌ [SHIPPO] No shipping rates available for outbound shipment');
      return { success: false, reason: 'no_shipping_rates' };
    }
    
    // Rate selection logic: prefer USPS, fallback to first available
    let selectedRate = availableRates.find(rate => rate.provider === 'USPS');
    if (!selectedRate) {
      selectedRate = availableRates[0];
      console.log('⚠️ [SHIPPO] USPS rate not found, using first available:', selectedRate.provider);
    } else {
      console.log('✅ [SHIPPO] Selected USPS rate:', selectedRate.provider, selectedRate.servicelevel);
    }
    
    console.log('📦 [SHIPPO] Selected rate:', {
      provider: selectedRate.provider,
      service: selectedRate.servicelevel || selectedRate.service,
      rate: selectedRate.rate,
      object_id: selectedRate.object_id
    });
    
    // Create the actual label by purchasing the transaction
    console.log('📦 [SHIPPO] Purchasing label for selected rate...');
    const transactionRes = await axios.post(
      'https://api.goshippo.com/transactions/',
      {
        rate: selectedRate.object_id,
        async: false,
        label_file_type: 'PNG',
        qr_code_requested: true,
      },
      {
        headers: {
          'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Always assign before any checks to avoid TDZ
    const shippoTx = transactionRes.data;

    // Check if label purchase was successful
    if (!shippoTx || shippoTx.status !== 'SUCCESS') {
      console.error('❌ [SHIPPO] Label purchase failed:', shippoTx?.messages);
      console.error('❌ [SHIPPO] Transaction status:', shippoTx?.status);
      return { success: false, reason: 'label_purchase_failed', status: shippoTx?.status };
    }

    // One-time debug log after label purchase - safe structured logging of key fields
    if (process.env.SHIPPO_DEBUG === 'true') {
      const logTx = tx => ({
        object_id: tx?.object_id,
        status: tx?.status,
        tracking_number: tx?.tracking_number,
        tracking_url_provider: maskUrl(tx?.tracking_url_provider),
        label_url: maskUrl(tx?.label_url),
        qr_code_url: maskUrl(tx?.qr_code_url),
      });
      console.log('[SHIPPO][TX]', logTx(transactionRes.data));
      console.log('[SHIPPO][RATE]', safePick(selectedRate || {}, ['provider', 'servicelevel', 'object_id']));
    }
    const tx = shippoTx || {};
    const trackingNumber = tx.tracking_number || null;
    const trackingUrl = tx.tracking_url_provider || null;
    const labelUrl = tx.label_url || null;
    const qrUrl = tx.qr_code_url || null;

    const carrier = selectedRate?.provider ?? null;
    const service = selectedRate?.service?.name ?? selectedRate?.servicelevel?.name ?? null;

    const qrPayload = { trackingNumber, trackingUrl, labelUrl, qrUrl, carrier, service };
    
    console.log('[SHIPPO] QR payload built:', {
      hasTrackingNumber: !!trackingNumber,
      hasTrackingUrl: !!trackingUrl,
      hasLabelUrl: !!labelUrl,
      hasQrUrl: !!qrUrl,
      carrier,
      service,
    });

    console.log('📦 [SHIPPO] Label purchased successfully!');
    console.log('📦 [SHIPPO] Label URL:', labelUrl);
    console.log('📦 [SHIPPO] QR Code URL:', qrCodeUrl);
    console.log('📦 [SHIPPO] Tracking URL:', trackingUrl);
    console.log('📦 [SHIPPO] Transaction ID:', transactionRes.data.object_id);
    
    // Parse expiry from QR code URL
    function parseExpiresParam(url) {
      try {
        const u = new URL(url);
        const exp = u.searchParams.get('Expires');
        return exp ? Number(exp) : null;
      } catch {
        return null;
      }
    }
    
    const qrExpiry = parseExpiresParam(qrCodeUrl);
    console.log('📦 [SHIPPO] QR code expiry:', qrExpiry ? new Date(qrExpiry * 1000).toISOString() : 'unknown');

    // after outbound purchase success:
    logTx('[SHIPPO][TX]', transactionRes.data);

    // Build short URL from live host (no hardcoding)
    const txIdStr = String(transactionId);
    const base =
      process.env.ROOT_URL ||
      (req ? `${req.protocol}://${req.get('host')}` : null);

    if (!base) {
      console.warn('[LENDER_SMS] No ROOT_URL and no req — skipping link build');
      return { success: false, reason: 'no_base_url_available' };
    }

    const shortUrl = `${base}/api/qr/${txIdStr}`;

    // Resolve lender phone
    const lenderPhone = protectedData?.providerPhone;

    if (lenderPhone) {
      // unique dedupe key for lender on this transition
      const dedupeKey = `${txIdStr}:transition/accept:lender`;

      // Prefer branded short link if available, else fall back to Shippo URL
      const qrShort = `${base}/api/qr/${txIdStr}`;
      const finalQrUrl = qrCache.has(transactionId) ? qrShort : qrCodeUrl;
      
      await sendSMS(
        lenderPhone,
        `📬 Your Sherbrt shipping label is ready! ${finalQrUrl}`,
        'lender',
        dedupeKey
      );
      console.log('📱 [LENDER_SMS] sent', { to: `***${String(lenderPhone).slice(-4)}`, finalQrUrl });
    } else {
      console.warn('⚠️ [LENDER_SMS] skipped — no lender phone on transaction/profile');
    }

    // Create return shipment (customer → provider) if we have return address
    let returnLabelRes = null;
    let returnQrUrl = null;
    let returnTrackingUrl = null;
    
    try {
      if (protectedData.providerStreet && protectedData.providerCity && protectedData.providerState && protectedData.providerZip) {
        console.log('📦 [SHIPPO] Creating return shipment (customer → provider)...');
        
        const returnPayload = {
          address_from: customerAddress,
          address_to: providerAddress,
          parcels: [parcel],
          extra: { qr_code_requested: true },
          async: false
        };

        const returnShipmentRes = await axios.post(
          'https://api.goshippo.com/shipments/',
          returnPayload,
          {
            headers: {
              'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📦 [SHIPPO] Return shipment created successfully');
        console.log('📦 [SHIPPO] Return Shipment ID:', returnShipmentRes.data.object_id);
        
        // Get return rates and select one
        const returnRates = returnShipmentRes.data.rates || [];
        if (returnRates.length > 0) {
          let returnSelectedRate = returnRates.find(rate => rate.provider === 'USPS');
          if (!returnSelectedRate) {
            returnSelectedRate = returnRates[0];
          }
          
          console.log('📦 [SHIPPO] Selected return rate:', {
            provider: returnSelectedRate.provider,
            service: returnSelectedRate.servicelevel,
            rate: returnSelectedRate.rate,
            object_id: returnSelectedRate.object_id
          });
          
          // Purchase return label
          const returnTransactionRes = await axios.post(
            'https://api.goshippo.com/transactions/',
            {
              rate: returnSelectedRate.object_id,
              async: false,
              label_file_type: 'PNG',
              qr_code_requested: true,
            },
            {
              headers: {
                'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (returnTransactionRes.data.status === 'SUCCESS') {
            // One-time debug log for return label purchase
            if (process.env.SHIPPO_DEBUG === 'true') {
              console.log('[SHIPPO][RETURN_TX]', logTx(returnTransactionRes.data));
              console.log('[SHIPPO][RETURN_RATE]', safePick(returnSelectedRate || {}, ['provider', 'servicelevel', 'object_id']));
            }
            
            returnQrCodeUrl = returnTransactionRes.data.qr_code_url;
            returnTrackingUrl = returnTransactionRes.data.tracking_url_provider || returnTransactionRes.data.tracking_url;
            
            console.log('📦 [SHIPPO] Return label purchased successfully!');
            console.log('📦 [SHIPPO] Return Transaction ID:', returnTransactionRes.data.object_id);
          } else {
            console.warn('⚠️ [SHIPPO] Return label purchase failed:', returnTransactionRes.data.messages);
          }
        }
      }
    } catch (returnLabelError) {
      console.error('❌ [SHIPPO] Non-critical step failed', {
        where: 'return-label-creation',
        name: returnLabelError?.name,
        message: returnLabelError?.message,
        status: returnLabelError?.response?.status,
        data: safePick(returnLabelError?.response?.data || {}, ['error', 'message', 'code']),
      });
      // Do not rethrow — allow the HTTP handler to finish normally.
    }

          // Try to persist URLs and tracking data to Flex transaction via persistWithRetry
      try {
        console.log('💾 [SHIPPO] Attempting to save URLs and tracking data to Flex transaction...');
        
        // Extract tracking data from the transaction response
        const trackingNumber = transactionRes.data.tracking_number;
        let trackingUrl = transactionRes.data.tracking_url_provider || transactionRes.data.tracking_url;
        
        // Construct tracking URL if missing for USPS
        if (!trackingUrl && selectedRate.provider === 'usps' && trackingNumber) {
          trackingUrl = `https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=${trackingNumber}`;
          console.log('📦 [SHIPPO] Constructed USPS tracking URL fallback');
        }
        
        console.log('📦 [SHIPPO] Extracted tracking data:', {
          trackingNumber: trackingNumber ? `${trackingNumber.substring(0, 4)}...` : 'none',
          carrier: selectedRate.provider,
          hasTrackingUrl: !!trackingUrl,
          trackingUrlFallback: !transactionRes.data.tracking_url_provider && !transactionRes.data.tracking_url
        });
        
        // Store in QR cache for immediate availability
        const qrData = {
          qrCodeUrl,
          labelUrl,
          expiresAt: qrExpiry,
          savedAt: Date.now()
        };
        qrCache.set(transactionId, qrData);
        console.log(`💾 [QR_CACHE] Stored QR data for transaction ${transactionId}`);
        
        // Use persistWithRetry for robust Flex persistence
        const persistSuccess = await persistWithRetry(transactionId, {
          sdk: sharetribeSdk,
          shippoData: {
            txId: transactionRes.data.object_id,
            trackingNumber,
            labelUrl,
            qrCodeUrl,
            expiresAt: qrExpiry,
            carrier: selectedRate.provider
          }
        }
      });
        
        if (persistSuccess) {
          console.log('💾 [SHIPPO] URLs and tracking data successfully saved to Flex transaction');
        } else {
          console.warn('⚠️ [SHIPPO] Failed to persist to Flex after retries - data available in cache');
        }
      } catch (persistError) {
        console.error('❌ [SHIPPO] Non-critical step failed', {
          where: 'flex-persist',
          name: persistError?.name,
          message: persistError?.message,
          status: persistError?.response?.status,
          data: safePick(persistError?.response?.data || {}, ['error', 'message', 'code']),
        });
        // Do not rethrow — allow the HTTP handler to finish normally.
      }
    
    // Send borrower SMS notification (lender SMS already sent immediately after outbound label success)
    try {
      // Extract phone numbers from protectedData (more reliable than nested objects)
      const borrowerPhone = protectedData.customerPhone;
      
      // Optional: Send borrower "Label created" message (idempotent)
      if (borrowerPhone && trackingUrl) {
        // Check if we've already sent this notification
        const existingNotification = protectedData.shippingNotification?.labelCreated;
        if (existingNotification?.sent === true) {
          console.log(`📱 Label created SMS already sent to borrower (${maskPhone(borrowerPhone)}) - skipping`);
        } else {
          await sendSMS(
            borrowerPhone,
            `Sherbrt: your item will ship soon. Track at ${trackingUrl}`,
            { 
              role: 'customer',
              transactionId: txId,
              transition: 'transition/accept'
            }
          );
          console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for label created with tracking: ${maskUrl(trackingUrl)}`);
          
          // Mark as sent in protectedData
          try {
            const notificationResult = await txUpdateProtectedData({
              id: txId,
              protectedData: {
                shippingNotification: {
                  labelCreated: { sent: true, sentAt: new Date().toISOString() }
                }
              }
            });
            if (notificationResult && notificationResult.success === false) {
              console.warn('📝 [SHIPPO] Notification state update not available:', notificationResult.reason);
            } else {
              console.log(`💾 Updated shippingNotification.labelCreated for transaction: ${txId}`);
            }
          } catch (updateError) {
            console.warn(`⚠️ Failed to update labelCreated notification state:`, updateError.message);
          }
        }
      } else {
        console.warn('⚠️ Lender phone number not found for shipping label notification');
      }
      
      // Trigger 5: Borrower receives text when item is shipped (include tracking link)
      if (borrowerPhone && trackingUrl) {
        await sendSMS(
          borrowerPhone,
          `🚚 Your Sherbrt item has been shipped! Track it here: ${trackingUrl}`
        );
        console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for item shipped with tracking: ${trackingUrl}`);
      } else if (borrowerPhone) {
        console.warn('⚠️ Borrower phone found but no tracking URL available');
      } else {
        console.warn('⚠️ Borrower phone number not found for shipping notification');
      }
      
    } catch (smsError) {
      console.error('❌ Failed to send borrower SMS notification:', smsError.message);
      // Don't fail the label creation if SMS fails
    }
    
    return { 
      success: true, 
      outboundLabel: {
        label_url: labelUrl,
        qr_code_url: qrUrl,
        tracking_url_provider: trackingUrl
      }, 
      returnLabel: returnQrUrl ? {
        qr_code_url: returnQrUrl,
        tracking_url_provider: returnTrackingUrl
      } : null
    };
    
  } catch (err) {
    const details = {
      name: err?.name,
      message: err?.message,
      status: err?.status || err?.response?.status,
      statusText: err?.statusText || err?.response?.statusText,
      data: err?.response?.data ? safePick(err.response.data, ['error', 'message', 'code']) : undefined,
      labelUrl: err?.label_url ? maskUrl(err.label_url) : undefined,
      qrUrl: err?.qr_code_url ? maskUrl(err.qr_code_url) : undefined,
    };
    console.error('[SHIPPO] Label creation failed', details);

    // IMPORTANT: don't throw here if outbound label succeeded.
    // Continue to send the lender SMS with the outbound QR even if saving/return label fails.
    return { success: false, reason: 'api_error', error: err.message };
  }
}

module.exports = async (req, res) => {
  console.log('🚀 transition-privileged endpoint HIT!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
  // STEP 1: Confirm the endpoint is hit
  console.log('🚦 transition-privileged endpoint is wired up');
  
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;
  
  // STEP 2: Log the transition type
  console.log('🔁 Transition received:', bodyParams?.transition);
  
  // STEP 3: Check that sendSMS is properly imported
  console.log('📱 sendSMS function available:', !!sendSMS);
  console.log('📱 sendSMS function type:', typeof sendSMS);
  
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
    } else if (bodyParams && (bodyParams.transition === 'transition/decline' || bodyParams.transition === 'transition/expire' || bodyParams.transition === 'transition/cancel')) {
      // Use transactionId for transaction-based transitions
      id = transactionId;
      console.log('🔧 Using transactionId for transaction-based transition:', bodyParams.transition);
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
      
      const ACCEPT_TRANSITION = 'transition/accept';
      const transition = bodyParams?.transition;
      
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
      
      // Only require provider shipping details when transition is 'transition/accept'
      if (transition !== ACCEPT_TRANSITION) {
        console.log('✅ Skipping provider address validation for transition:', transition);
      } else {
        console.log('🔍 [DEBUG] Validating provider address fields for transition/accept');
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
          return res.status(400).json({ 
            error: 'Missing required provider address fields',
            fields: missingProviderFields
          });
        }
      }
      
      // Only require customer validation when transition is 'transition/accept'
      if (transition === ACCEPT_TRANSITION) {
        console.log('🔍 [DEBUG] Validating customer fields for transition/accept');
        const requiredCustomerFields = ['customerEmail', 'customerName'];
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
          return res.status(400).json({
            error: 'Missing required customer fields',
            fields: missingCustomerFields
          });
        }
      } else {
        console.log(`✅ Skipping customer field validation for transition: ${transition}`);
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
      
      // Debug transitionName
      console.log('🔍 transitionName after response:', transitionName);
      console.log('🔍 bodyParams.transition:', bodyParams?.transition);
      
      // STEP 4: Add a forced test log
      console.log('🧪 Inside transition-privileged — beginning SMS evaluation');
      
      // Dynamic provider SMS for booking requests - replace hardcoded test SMS
      const effectiveTransition = transitionName || bodyParams?.transition;
      console.log('🔍 Using effective transition for SMS:', effectiveTransition);
      
      if (effectiveTransition === 'transition/accept') {
        console.log('📨 Preparing to send SMS for transition/accept');
        
        // Skip SMS on speculative calls
        if (isSpeculative) {
          console.log('⏭️ Skipping SMS - speculative call');
          return;
        }
        
        try {
          // Use the helper function to get borrower phone with fallbacks
          const borrowerPhone = getBorrowerPhone(params, response?.data?.data);
          
          // Log the selected phone number and role for debugging
          console.log('📱 Selected borrower phone:', maskPhone(borrowerPhone));
          console.log('📱 SMS role: customer');
          console.log('🔍 Transition: transition/accept');
          
          if (borrowerPhone) {
            // Get listing title and provider name for the message
          const listingTitle = listing?.attributes?.title || 'your item';
          const providerName = params?.protectedData?.providerName || 'the lender';
          
          // Build dynamic site base for borrower inbox link
          const siteBase = process.env.ROOT_URL || (req ? `${req.protocol}://${req.get('host')}` : 'https://sherbrt.com');
          const buyerLink = `${siteBase}/inbox/purchases`;
          
          const message = `🎉 Your Sherbrt request was accepted! 🍧
"${listingTitle}" from ${providerName} is confirmed. 
You'll receive tracking info once it ships! ✈️👗 ${buyerLink}`;
          
          // Wrap sendSMS in try/catch with logs
          try {
            await sendSMS(borrowerPhone, message, { role: 'customer' });
            console.log('✅ SMS sent successfully to borrower');
            console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for accepted request`);
          } catch (err) {
            console.error('❌ SMS send error:', err.message);
            console.error('❌ SMS send error stack:', err.stack);
          }
        } else {
          console.warn('⚠️ Borrower phone number not found - cannot send acceptance SMS');
          console.warn('⚠️ Check params.protectedData.customerPhone or transaction data');
        }
      } catch (smsError) {
        console.error('❌ Failed to send SMS notification:', smsError.message);
        console.error('❌ SMS error stack:', smsError.stack);
        // Don't fail the transaction if SMS fails
      }
    }

      if (effectiveTransition === 'transition/decline') {
        console.log('📨 Preparing to send SMS for transition/decline');
        
        // Skip SMS on speculative calls
        if (isSpeculative) {
          console.log('⏭️ Skipping SMS - speculative call');
          return;
        }
        
        try {
          // Use the helper function to get borrower phone with fallbacks
          const borrowerPhone = getBorrowerPhone(params, response?.data?.data);
          
          // Log the selected phone number and role for debugging
          console.log('📱 Selected borrower phone:', maskPhone(borrowerPhone));
          console.log('📱 SMS role: customer');
          console.log('🔍 Transition: transition/decline');
          
          if (borrowerPhone) {
            const message = `😔 Your Sherbrt request was declined. Don't worry — more fabulous looks are waiting to be borrowed!`;
            
            // Wrap sendSMS in try/catch with logs
            try {
              await sendSMS(borrowerPhone, message, { role: 'customer' });
              console.log('✅ SMS sent successfully to borrower');
              console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for declined request`);
            } catch (err) {
              console.error('❌ SMS send error:', err.message);
              console.error('❌ SMS error stack:', err.stack);
            }
          } else {
            console.warn('⚠️ Borrower phone number not found - cannot send decline SMS');
            console.warn('⚠️ Check params.protectedData.customerPhone or transaction data');
          }
        } catch (smsError) {
          console.error('❌ Failed to send SMS notification:', smsError.message);
          console.error('❌ SMS error stack:', smsError.stack);
          // Don't fail the transaction if SMS fails
        }
      }
      
      // Shippo label creation - only for transition/accept after successful transition
      if (bodyParams?.transition === 'transition/accept' && !isSpeculative) {
        console.log('🚀 [SHIPPO] Transition successful, triggering Shippo label creation...');
        
        // Use the validated and merged protectedData from params
        const finalProtectedData = params.protectedData || {};
        console.log('📋 [SHIPPO] Final protectedData for label creation:', finalProtectedData);
        
        // Trigger Shippo label creation asynchronously (don't await to avoid blocking response)
        createShippingLabels(finalProtectedData, transactionId, listing, sendSMS, sdk, req)
          .then(result => {
            if (result.success) {
              console.log('✅ [SHIPPO] Label creation completed successfully');
            } else {
              console.warn('⚠️ [SHIPPO] Label creation failed:', result.reason);
            }
          })
          .catch(err => {
            console.error('❌ [SHIPPO] Unexpected error in label creation:', err.message);
          });
      }
      
      // 🔧 FIXED: Lender notification SMS for booking requests - ensure provider phone only
      if (
        bodyParams?.transition === 'transition/request-payment' &&
        !isSpeculative &&
        response?.data?.data
      ) {
        console.log('📨 [SMS][booking-request] Preparing to send lender notification SMS');

        try {
          const transaction = response?.data?.data;
          
          // Helpers for ID and phone resolution
          const asId = v => (v && v.uuid) ? v.uuid : (typeof v === 'string' ? v : null);
          const getPhone = u =>
            u?.attributes?.profile?.protectedData?.phone ??
            u?.attributes?.profile?.protectedData?.phoneNumber ??
            u?.attributes?.profile?.publicData?.phone ??
            u?.attributes?.profile?.publicData?.phoneNumber ?? null;

          // Resolve provider (lender) and customer (borrower) IDs defensively
          const providerId =
            asId(transaction?.provider?.id) ||
            asId(transaction?.relationships?.provider?.data?.id) ||
            asId(listing?.relationships?.author?.data?.id);

          const customerId =
            asId(transaction?.customer?.id) ||
            asId(transaction?.relationships?.customer?.data?.id);

          if (!providerId) {
            console.warn('[SMS][booking-request] No provider ID found; not sending SMS');
            return;
          }

          // Fetch provider user explicitly (never from currentUser or transaction.protectedData)
          const providerRes = await sdk.users.show({ id: providerId });
          const providerUser = providerRes?.data?.data;
          const providerPhone = getPhone(providerUser);

          // Borrower phone only for safety comparison (not as fallback recipient)
          let borrowerPhone = null;
          if (customerId) {
            const customerRes = await sdk.users.show({ id: customerId });
            borrowerPhone = getPhone(customerRes?.data?.data);
          }

          console.log('[SMS][booking-request]', { 
            txId: transaction?.id?.uuid || transaction?.id, 
            providerId, 
            customerId, 
            providerPhone, 
            borrowerPhone 
          });

          if (!providerPhone) {
            console.warn('[SMS][booking-request] Provider missing phone; not sending', { 
              txId: transaction?.id?.uuid || transaction?.id, 
              providerId 
            });
            return;
          }

          if (borrowerPhone && providerPhone === borrowerPhone) {
            console.error('[SMS][booking-request] Borrower phone detected for lender notice; aborting', { 
              txId: transaction?.id?.uuid || transaction?.id 
            });
            return;
          }

          if (sendSMS) {
            const message = `👗🍧 New Sherbrt booking request! Someone wants to borrow your item "${listing?.attributes?.title || 'your listing'}". Tap your dashboard to respond.`;
            
            await sendSMS(providerPhone, message);
            console.log(`✅ [SMS][booking-request] SMS sent to provider ${providerPhone}`);
          } else {
            console.warn('⚠️ [SMS][booking-request] sendSMS unavailable');
          }
        } catch (err) {
          console.error('❌ [SMS][booking-request] Error in lender notification logic:', err.message);
        }
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

// Export qrCache for use by other modules
module.exports.qrCache = qrCache;