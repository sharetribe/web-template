#!/usr/bin/env node

const express = require('express');
const { getTrustedSdk } = require('../api-util/sdk');

// Conditional import of sendSMS to prevent module loading errors
let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve(); // No-op function
}

// Shippo signature verification
function verifyShippoSignature(req, webhookSecret) {
  const shippoSignature = req.headers['x-shippo-signature'];
  if (!shippoSignature) {
    console.log('⚠️ No X-Shippo-Signature header found');
    return false;
  }
  
  if (!webhookSecret) {
    console.log('⚠️ No SHIPPO_WEBHOOK_SECRET configured');
    return false;
  }
  
  // Use the raw body for signature verification
  const rawBody = req.rawBody;
  
  // Shippo uses HMAC SHA256
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  
  const isValid = crypto.timingSafeEqual(
    Buffer.from(shippoSignature),
    Buffer.from(signature)
  );
  
  if (process.env.VERBOSE === '1') {
    console.log(`🔐 Shippo signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
    console.log(`🔐 Expected: ${signature}`);
    console.log(`🔐 Received: ${shippoSignature}`);
  }
  
  return isValid;
}

const router = express.Router();

// Middleware to capture raw body for signature verification
router.use('/shippo', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Store raw body for signature verification
  req.rawBody = req.body;
  // Parse JSON for processing
  try {
    req.body = JSON.parse(req.body.toString());
  } catch (error) {
    console.error('❌ Failed to parse JSON body:', error.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Helper function to normalize phone number to E.164 format
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's already in E.164 format (starts with +), return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it's 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // For any other format, try to make it work
  if (digits.length >= 10) {
    return `+${digits}`;
  }
  
  console.warn(`📱 Could not normalize phone number: ${phone}`);
  return null;
}

// Helper function to find transaction by tracking number
async function findTransactionByTrackingNumber(sdk, trackingNumber) {
  console.log(`🔍 Searching for transaction with tracking number: ${trackingNumber}`);
  
  try {
    // Query last 100 transactions to find matching tracking number
    const query = {
      limit: 100,
      include: ['customer', 'listing']
    };
    
    const response = await sdk.transactions.query(query);
    const transactions = response.data.data;
    
    console.log(`📊 Searched ${transactions.length} transactions for tracking number`);
    
    // Look for transaction with matching tracking number
    for (const transaction of transactions) {
      const protectedData = transaction.attributes.protectedData || {};
      
      if (protectedData.outboundTrackingNumber === trackingNumber || 
          protectedData.returnTrackingNumber === trackingNumber) {
        console.log(`✅ Found transaction ${transaction.id} with tracking number ${trackingNumber}`);
        return transaction;
      }
    }
    
    console.warn(`⚠️ No transaction found with tracking number: ${trackingNumber}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error searching for transaction with tracking number:`, error.message);
    return null;
  }
}

// Helper function to get borrower phone number
function getBorrowerPhone(transaction) {
  console.log('📱 Extracting borrower phone number...');
  
  try {
    // Method 1: transaction.customer.profile.protectedData.phone
    if (transaction.relationships?.customer?.data?.attributes?.profile?.protectedData?.phone) {
      const phone = transaction.relationships.customer.data.attributes.profile.protectedData.phone;
      console.log(`📱 Found phone in customer profile: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    // Method 2: transaction.protectedData.customerPhone
    if (transaction.attributes?.protectedData?.customerPhone) {
      const phone = transaction.attributes.protectedData.customerPhone;
      console.log(`📱 Found phone in transaction protectedData: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    // Method 3: transaction.attributes.metadata.customerPhone
    if (transaction.attributes?.metadata?.customerPhone) {
      const phone = transaction.attributes.metadata.customerPhone;
      console.log(`📱 Found phone in transaction metadata: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    console.warn('⚠️ No borrower phone number found in any location');
    return null;
    
  } catch (error) {
    console.error('❌ Error extracting borrower phone:', error.message);
    return null;
  }
}

// Helper function to get lender phone number
function getLenderPhone(transaction) {
  console.log('📱 Extracting lender phone number...');
  
  try {
    // Method 1: transaction.provider.profile.protectedData.phone
    if (transaction.relationships?.provider?.data?.attributes?.profile?.protectedData?.phone) {
      const phone = transaction.relationships.provider.data.attributes.profile.protectedData.phone;
      console.log(`📱 Found lender phone in provider profile: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    // Method 2: transaction.protectedData.providerPhone
    if (transaction.attributes?.protectedData?.providerPhone) {
      const phone = transaction.attributes.protectedData.providerPhone;
      console.log(`📱 Found lender phone in transaction protectedData: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    // Method 3: transaction.attributes.metadata.providerPhone
    if (transaction.attributes?.metadata?.providerPhone) {
      const phone = transaction.attributes.metadata.providerPhone;
      console.log(`📱 Found lender phone in transaction metadata: ${phone}`);
      return normalizePhoneNumber(phone);
    }
    
    console.warn('⚠️ No lender phone number found in any expected location');
    return null;
  } catch (error) {
    console.error('❌ Error extracting lender phone:', error.message);
    return null;
  }
}

  // Main webhook handler
  router.post('/shippo', async (req, res) => {
    console.log('🚀 Shippo webhook received!');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // Verify Shippo signature
    const webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET;
    if (webhookSecret && !verifyShippoSignature(req, webhookSecret)) {
      console.log('🚫 Invalid Shippo signature - rejecting request');
      return res.status(403).json({ error: 'Invalid signature' });
    }
    
    try {
      const payload = req.body;
      
      // Validate payload structure
      if (!payload || !payload.data) {
        console.warn('⚠️ Invalid payload structure - missing data field');
        return res.status(400).json({ error: 'Invalid payload structure' });
      }
      
      const { data, event } = payload;
      
      // Extract tracking information
      const trackingNumber = data.tracking_number;
      const carrier = data.carrier;
      const trackingStatus = data.tracking_status?.status;
      const metadata = data.metadata || {};
      
      console.log(`📦 Tracking Number: ${trackingNumber}`);
      console.log(`🚚 Carrier: ${carrier}`);
      console.log(`📊 Status: ${trackingStatus}`);
      console.log(`🏷️ Metadata:`, metadata);
      
      // Gate by Shippo mode - ignore events whose event.mode doesn't match our SHIPPO_MODE
      const expectedMode = process.env.SHIPPO_MODE; // 'test' or 'live'
      if (expectedMode && event?.mode && event.mode.toLowerCase() !== expectedMode.toLowerCase()) {
        console.warn('[SHIPPO][WEBHOOK] Mode mismatch', { eventMode: event.mode, expectedMode });
        return res.status(200).json({ ok: true }); // ignore silently
      }
      
      console.log(`✅ Shippo mode check passed: event.mode=${event?.mode || 'none'}, expected=${expectedMode || 'any'}`);
      
      // Check if status is DELIVERED or TRANSIT (first scan)
      const upperStatus = trackingStatus?.toUpperCase();
      if (!upperStatus || (upperStatus !== 'DELIVERED' && upperStatus !== 'TRANSIT')) {
        console.log(`ℹ️ Status '${trackingStatus}' is not DELIVERED or TRANSIT - ignoring webhook`);
        return res.status(200).json({ message: 'Status not DELIVERED or TRANSIT - ignored' });
      }
      
      const isDelivery = upperStatus === 'DELIVERED';
      const isFirstScan = upperStatus === 'TRANSIT';
      
      console.log(`✅ Status is ${upperStatus} - processing ${isDelivery ? 'delivery' : 'first scan'} webhook`);
    
    // Find transaction
    let transaction = null;
    let matchStrategy = 'unknown';
    
    // Method 1: Try to find by metadata.transactionId (preferred)
    if (metadata.transactionId) {
      console.log(`🔍 Looking up transaction by metadata.transactionId: ${metadata.transactionId}`);
      try {
        const sdk = await getTrustedSdk();
        const response = await sdk.transactions.show({ id: metadata.transactionId });
        transaction = response.data.data;
        matchStrategy = 'metadata.transactionId';
        console.log(`✅ Found transaction by metadata.transactionId: ${transaction.id}`);
      } catch (error) {
        console.warn(`⚠️ Failed to find transaction by metadata.transactionId: ${error.message}`);
      }
    }
    
    // Method 2: Fallback to searching by tracking number
    if (!transaction && trackingNumber) {
      console.log(`🔍 Falling back to search by tracking number: ${trackingNumber}`);
      try {
        const sdk = await getTrustedSdk();
        transaction = await findTransactionByTrackingNumber(sdk, trackingNumber);
        matchStrategy = 'tracking_number_search';
      } catch (error) {
        console.error(`❌ Error in tracking number search: ${error.message}`);
      }
    }
    
    if (!transaction) {
      console.error('❌ Could not find transaction for this tracking update');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    console.log(`✅ Transaction found via ${matchStrategy}: ${transaction.id}`);
    
    // Check if this is a return tracking number
    const protectedData = transaction.attributes.protectedData || {};
    const returnData = protectedData.return || {};
    const isReturnTracking = trackingNumber === protectedData.returnTrackingNumber ||
                            trackingNumber === returnData.label?.trackingNumber;
    
    console.log(`🔍 Tracking type: ${isReturnTracking ? 'RETURN' : 'OUTBOUND'}`);
    
    // Handle return tracking - send SMS to lender
    if (isReturnTracking && isFirstScan) {
      console.log('📬 Processing return first scan - sending SMS to lender');
      
      // Check if return first scan SMS already sent
      if (returnData.firstScanAt) {
        console.log('ℹ️ Return first scan SMS already sent - skipping (idempotent)');
        return res.status(200).json({ message: 'Return first scan SMS already sent - idempotent' });
      }
      
      // Get lender phone
      const lenderPhone = getLenderPhone(transaction);
      if (!lenderPhone) {
        console.warn('⚠️ No lender phone number found - cannot send return SMS');
        return res.status(400).json({ error: 'No lender phone number found' });
      }
      
      // Get listing title
      const listingTitle = transaction.attributes.listing?.title || 'your item';
      const trackingUrl = protectedData.returnTrackingUrl || `https://track.shippo.com/${trackingNumber}`;
      
      const message = `📬 Return in transit: "${listingTitle}". Track here: ${trackingUrl}`;
      
      try {
        await sendSMS(lenderPhone, message, {
          role: 'lender',
          transactionId: transaction.id,
          transition: 'webhook/shippo-return-first-scan',
          tag: 'return_first_scan_to_lender',
          meta: { 
            listingId: transaction.attributes.listing?.id?.uuid || transaction.attributes.listing?.id,
            trackingNumber: trackingNumber
          }
        });
        
        // Update transaction with return first scan timestamp
        try {
          const sdk = await getTrustedSdk();
          await sdk.transactions.update({
            id: transaction.id,
            attributes: {
              protectedData: {
                ...protectedData,
                return: {
                  ...returnData,
                  firstScanAt: new Date().toISOString()
                }
              }
            }
          });
          console.log(`💾 Updated transaction with return first scan timestamp`);
        } catch (updateError) {
          console.error(`❌ Failed to update transaction:`, updateError.message);
        }
        
        console.log(`✅ Return first scan SMS sent to lender ${lenderPhone}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Return first scan SMS sent to lender',
          transactionId: transaction.id,
          lenderPhone: lenderPhone
        });
        
      } catch (smsError) {
        console.error(`❌ Failed to send return first scan SMS to lender:`, smsError.message);
        return res.status(500).json({ error: 'Failed to send return first scan SMS to lender' });
      }
    }
    
    // Check if SMS already sent (idempotency) based on event type for outbound
    if (!isReturnTracking) {
      if (isDelivery && protectedData.shippingNotification?.delivered?.sent === true) {
        console.log('ℹ️ Delivery SMS already sent - skipping (idempotent)');
        return res.status(200).json({ message: 'Delivery SMS already sent - idempotent' });
      }
      
      if (isFirstScan && protectedData.shippingNotification?.firstScan?.sent === true) {
        console.log('ℹ️ First scan SMS already sent - skipping (idempotent)');
        return res.status(200).json({ message: 'First scan SMS already sent - idempotent' });
      }
      
      // Get borrower phone number
      const borrowerPhone = getBorrowerPhone(transaction);
      if (!borrowerPhone) {
        console.warn('⚠️ No borrower phone number found - cannot send SMS');
        return res.status(400).json({ error: 'No borrower phone number found' });
      }
      
      console.log(`📱 Borrower phone: ${borrowerPhone}`);
      
      let message, smsType, protectedDataUpdate;
      
      if (isDelivery) {
        // Send delivery SMS
        message = "Your Sherbrt borrow was delivered! Don't forget to take pics and tag @shoponsherbrt while you're slaying in your borrowed fit! 📸✨";
        smsType = 'delivery';
        protectedDataUpdate = {
          ...protectedData,
          lastTrackingStatus: {
            status: trackingStatus,
            substatus: substatus,
            timestamp: new Date().toISOString(),
            event: 'delivered'
          },
          shippingNotification: {
            ...protectedData.shippingNotification,
            delivered: { sent: true, sentAt: new Date().toISOString() }
          }
        };
      } else if (isFirstScan) {
        // Send first scan SMS
        const trackingUrl = protectedData.outboundTrackingUrl;
        if (!trackingUrl) {
          console.warn('⚠️ No tracking URL found for first scan notification');
          return res.status(400).json({ error: 'No tracking URL found for first scan notification' });
        }
        
        message = `🚚 Your Sherbrt item is on the way!\nTrack it here: ${trackingUrl}`;
        smsType = 'first scan';
        protectedDataUpdate = {
          ...protectedData,
          lastTrackingStatus: {
            status: trackingStatus,
            substatus: substatus,
            timestamp: new Date().toISOString(),
            event: 'first_scan'
          },
          shippingNotification: {
            ...protectedData.shippingNotification,
            firstScan: { sent: true, sentAt: new Date().toISOString() }
          }
        };
      }
      
      console.log(`📤 Sending ${smsType} SMS to ${borrowerPhone}: ${message}`);
      
      try {
        await sendSMS(borrowerPhone, message, { 
          role: 'customer',
          transactionId: transaction.id,
          transition: `webhook/shippo-${smsType.replace(' ', '-')}`,
          tag: isDelivery ? 'delivery_to_borrower' : 'first_scan_to_borrower',
          meta: { listingId: transaction.attributes.listing?.id?.uuid || transaction.attributes.listing?.id }
        });
        console.log(`✅ ${smsType} SMS sent successfully to ${borrowerPhone}`);
        
        // Mark SMS as sent in transaction protectedData
        try {
          const sdk = await getTrustedSdk();
          
          if (isFirstScan) {
            // Use privileged transition for first scan updates
            await sdk.transactions.transition({
              id: transaction.id,
              transition: 'transition/store-shipping-urls',
              params: { protectedData: protectedDataUpdate }
            });
          } else {
            // Use privileged transition for delivery updates (consistent approach)
            await sdk.transactions.transition({
              id: transaction.id,
              transition: 'transition/store-shipping-urls',
              params: { protectedData: protectedDataUpdate }
            });
          }
          
          console.log(`💾 Updated transaction protectedData: ${smsType} SMS sent = true`);
          
        } catch (updateError) {
          console.error(`❌ Failed to update transaction protectedData for ${smsType}:`, updateError.message);
          // Don't fail the webhook if we can't update the flag
        }
        
      } catch (smsError) {
        console.error(`❌ Failed to send ${smsType} SMS to ${borrowerPhone}:`, smsError.message);
        return res.status(500).json({ error: `Failed to send ${smsType} SMS` });
      }
      
      console.log(`🎉 ${smsType} webhook processed successfully!`);
      res.status(200).json({ 
        success: true, 
        message: `${smsType} SMS sent successfully`,
        transactionId: transaction.id,
        matchStrategy,
        borrowerPhone,
        smsType
      });
      
    } // End of if (!isReturnTracking)
    
  } catch (error) {
    console.error('❌ Fatal error in Shippo webhook:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

