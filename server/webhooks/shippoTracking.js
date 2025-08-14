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

const router = express.Router();

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

// Main webhook handler
router.post('/shippo', async (req, res) => {
  console.log('🚀 Shippo webhook received!');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const payload = req.body;
    
    // Validate payload structure
    if (!payload || !payload.data) {
      console.warn('⚠️ Invalid payload structure - missing data field');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }
    
    const { data } = payload;
    
    // Extract tracking information
    const trackingNumber = data.tracking_number;
    const carrier = data.carrier;
    const trackingStatus = data.tracking_status?.status;
    const metadata = data.metadata || {};
    
    console.log(`📦 Tracking Number: ${trackingNumber}`);
    console.log(`🚚 Carrier: ${carrier}`);
    console.log(`📊 Status: ${trackingStatus}`);
    console.log(`🏷️ Metadata:`, metadata);
    
    // Check if status is DELIVERED (case-insensitive)
    if (!trackingStatus || trackingStatus.toUpperCase() !== 'DELIVERED') {
      console.log(`ℹ️ Status '${trackingStatus}' is not DELIVERED - ignoring webhook`);
      return res.status(200).json({ message: 'Status not DELIVERED - ignored' });
    }
    
    console.log('✅ Status is DELIVERED - processing webhook');
    
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
    
    // Check if SMS already sent (idempotency)
    const protectedData = transaction.attributes.protectedData || {};
    if (protectedData.deliveredSmsSent === true) {
      console.log('ℹ️ SMS already sent for this delivery - skipping (idempotent)');
      return res.status(200).json({ message: 'SMS already sent - idempotent' });
    }
    
    // Get borrower phone number
    const borrowerPhone = getBorrowerPhone(transaction);
    if (!borrowerPhone) {
      console.warn('⚠️ No borrower phone number found - cannot send SMS');
      return res.status(400).json({ error: 'No borrower phone number found' });
    }
    
    console.log(`📱 Borrower phone: ${borrowerPhone}`);
    
    // Send delivery SMS
    const message = "Your Sherbrt borrow was delivered! Don't forget to take pics and tag @shoponsherbrt while you're slaying in your borrowed fit! 📸✨";
    
    console.log(`📤 Sending delivery SMS to ${borrowerPhone}: ${message}`);
    
    try {
      await sendSMS(borrowerPhone, message);
      console.log(`✅ SMS sent successfully to ${borrowerPhone}`);
      
      // Mark SMS as sent in transaction protectedData
      try {
        const sdk = await getTrustedSdk();
        const updatedProtectedData = {
          ...protectedData,
          deliveredSmsSent: true,
          deliveredSmsSentAt: new Date().toISOString(),
          deliveredSmsPhone: borrowerPhone
        };
        
        await sdk.transactions.update({
          id: transaction.id,
          protectedData: updatedProtectedData
        });
        
        console.log('💾 Updated transaction protectedData: deliveredSmsSent = true');
        
      } catch (updateError) {
        console.error('❌ Failed to update transaction protectedData:', updateError.message);
        // Don't fail the webhook if we can't update the flag
      }
      
    } catch (smsError) {
      console.error(`❌ Failed to send SMS to ${borrowerPhone}:`, smsError.message);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    
    console.log('🎉 Webhook processed successfully!');
    res.status(200).json({ 
      success: true, 
      message: 'Delivery SMS sent successfully',
      transactionId: transaction.id,
      matchStrategy,
      borrowerPhone
    });
    
  } catch (error) {
    console.error('❌ Fatal error in Shippo webhook:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

