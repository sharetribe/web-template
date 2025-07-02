#!/usr/bin/env node

require('dotenv').config();

// Conditional import of sendSMS to prevent module loading errors
let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve(); // No-op function
}

const { getTrustedSdk } = require('../api-util/sdk');

async function sendReturnReminders() {
  console.log('🚀 Starting return reminder SMS script...');
  
  try {
    // Initialize SDK
    const sdk = await getTrustedSdk();
    console.log('✅ SDK initialized successfully');
    
    // Get today's and tomorrow's dates in ISO format (no time component)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Checking transactions due on ${today} and ${tomorrow}`);
    console.log('📅 Checking for returns due:', { today, tomorrow });
    
    // Query transactions with deliveryEnd dates matching today or tomorrow
    const query = {
      state: 'delivered', // Only check delivered transactions
      deliveryEnd: [today, tomorrow],
      include: ['customer', 'listing']
    };
    
    console.log('🔍 Querying transactions with deliveryEnd:', query.deliveryEnd);
    
    const response = await sdk.transactions.query(query);
    const transactions = response.data.data;
    
    console.log(`📊 Found ${transactions.length} transactions due for return`);
    
    if (transactions.length === 0) {
      console.log('✅ No return reminders needed today');
      return;
    }
    
    let smsSent = 0;
    let smsFailed = 0;
    
    // Process each transaction
    for (const transaction of transactions) {
      try {
        const transactionId = transaction.id;
        const deliveryEnd = transaction.attributes.deliveryEnd;
        const customer = transaction.relationships.customer.data;
        
        console.log(`\n📦 Processing transaction ${transactionId} with deliveryEnd: ${deliveryEnd}`);
        
        // Get customer's phone number
        if (!customer || !customer.attributes || !customer.attributes.profile || !customer.attributes.profile.protectedData) {
          console.warn(`⚠️ Customer or protected data not found for transaction ${transactionId}`);
          continue;
        }
        
        const borrowerPhone = customer.attributes.profile.protectedData.phone;
        if (!borrowerPhone) {
          console.warn(`⚠️ Borrower phone number not found for transaction ${transactionId}`);
          continue;
        }
        
        console.log(`📱 Found borrower phone: ${borrowerPhone}`);
        
        let message = '';
        let isDueToday = false;
        
        // Determine if due today or tomorrow and create appropriate message
        if (deliveryEnd === today) {
          isDueToday = true;
          console.log(`📅 Transaction ${transactionId} is due TODAY (${today})`);
          
          // Get return label URL from transaction protected data
          // Note: The return label URL might not be stored in protectedData.returnLabelUrl
          // Check multiple possible locations for the return label URL
          const returnLabelUrl = transaction.attributes.protectedData?.returnLabelUrl ||
                                transaction.attributes.protectedData?.returnLabel ||
                                transaction.attributes.protectedData?.shippingLabelUrl ||
                                transaction.attributes.protectedData?.returnShippingLabel;
          
          if (returnLabelUrl) {
            message = `📦 Today's the day! Ship your Sherbrt item back to the lender. Here's your return label: ${returnLabelUrl}`;
            console.log(`🔗 Found return label URL: ${returnLabelUrl}`);
          } else {
            message = `📦 Today's the day! Ship your Sherbrt item back to the lender. Check your dashboard for return instructions.`;
            console.warn(`⚠️ No return label URL found for transaction ${transactionId}. Checked fields: returnLabelUrl, returnLabel, shippingLabelUrl, returnShippingLabel`);
            console.log(`🔍 Available protectedData fields:`, Object.keys(transaction.attributes.protectedData || {}));
          }
        } else if (deliveryEnd === tomorrow) {
          console.log(`📅 Transaction ${transactionId} is due TOMORROW (${tomorrow})`);
          message = `⏳ Your Sherbrt return is due tomorrow! Don't forget to ship it back and submit pics & feedback.`;
        } else {
          console.warn(`⚠️ Unexpected deliveryEnd date for transaction ${transactionId}: ${deliveryEnd}`);
          continue;
        }
        
        // Log the SMS trigger details
        console.log(`📬 Sending reminder to ${borrowerPhone}: ${message}`);
        
        // Send SMS
        console.log(`📤 Sending SMS to ${borrowerPhone} for ${isDueToday ? 'today' : 'tomorrow'} return`);
        await sendSMS(borrowerPhone, message);
        
        console.log(`✅ SMS sent successfully to ${borrowerPhone}`);
        smsSent++;
        
      } catch (transactionError) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, transactionError.message);
        smsFailed++;
      }
    }
    
    console.log(`\n📊 Return reminder script completed:`);
    console.log(`   ✅ SMS sent: ${smsSent}`);
    console.log(`   ❌ SMS failed: ${smsFailed}`);
    console.log(`   📦 Total transactions processed: ${transactions.length}`);
    
  } catch (error) {
    console.error('❌ Fatal error in return reminder script:', error.message);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  sendReturnReminders()
    .then(() => {
      console.log('🎉 Return reminder script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Return reminder script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendReturnReminders }; 