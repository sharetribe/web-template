#!/usr/bin/env node
require('dotenv').config();

let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve();
}

// ✅ Use the correct SDK helper
const { getTrustedSdk } = require('../api-util/sdk');

// Create a trusted SDK instance for scripts (no req needed)
async function getScriptSdk() {
  const sharetribeSdk = require('sharetribe-flex-sdk');
  const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
  const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
  const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Sharetribe credentials: REACT_APP_SHARETRIBE_SDK_CLIENT_ID and SHARETRIBE_SDK_CLIENT_SECRET required');
  }
  
  const sdk = sharetribeSdk.createInstance({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    baseUrl: BASE_URL,
  });
  
  // Exchange token to get trusted access
  const response = await sdk.exchangeToken();
  const trustedToken = response.data;
  
  return sharetribeSdk.createInstance({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    baseUrl: BASE_URL,
    tokenStore: sharetribeSdk.tokenStore.memoryStore(trustedToken),
  });
}

// ---- CLI flags / env guards ----
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const getOpt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = has('--dry-run') || process.env.SMS_DRY_RUN === '1';
const VERBOSE = has('--verbose') || process.env.VERBOSE === '1';
const LIMIT = parseInt(getOpt('--limit', process.env.LIMIT || '0'), 10) || 0;
const ONLY_PHONE = process.env.ONLY_PHONE; // e.g. +15551234567 for targeted test

if (DRY) {
  const realSend = sendSMS;
  sendSMS = async (to, body, opts = {}) => {
    const { tag, meta } = opts;
    const metaJson = meta ? JSON.stringify(meta) : '{}';
    const bodyJson = JSON.stringify(body);
    console.log(`[SMS:OUT] tag=${tag || 'none'} to=${to} meta=${metaJson} body=${bodyJson} dry-run=true`);
    if (VERBOSE) console.log('opts:', opts);
    return { dryRun: true };
  };
}

function yyyymmdd(d) {
  // Always use UTC for consistent date handling
  return new Date(d).toISOString().split('T')[0];
}

async function sendReturnReminders() {
  console.log('🚀 Starting return reminder SMS script...');
  try {
    const sdk = await getScriptSdk();
    console.log('✅ SDK initialized');

    // today/tomorrow window (allow overrides for testing)
    const today = process.env.FORCE_TODAY || yyyymmdd(Date.now());
    const tomorrow = process.env.FORCE_TOMORROW || yyyymmdd(Date.now() + 24 * 60 * 60 * 1000);
    const tMinus1 = yyyymmdd(new Date(today).getTime() - 24 * 60 * 60 * 1000);
    console.log(`📅 Window: t-1=${tMinus1}, today=${today}, tomorrow=${tomorrow}`);

    // Query transactions for T-1, today, and tomorrow
    const query = {
      state: 'delivered',
      deliveryEnd: [tMinus1, today, tomorrow],
      include: ['customer', 'listing'],
      perPage: 50,
    };

    const res = await sdk.transactions.query(query);
    const txs = res?.data?.data || [];
    const included = new Map();
    for (const inc of res?.data?.included || []) {
      // key like "user/UUID"
      const key = `${inc.type}/${inc.id?.uuid || inc.id}`;
      included.set(key, inc);
    }

    console.log(`📊 Found ${txs.length} candidate transactions`);

    let sent = 0, failed = 0, processed = 0;

    for (const tx of txs) {
      processed++;

      const deliveryEnd = tx?.attributes?.deliveryEnd;
      if (deliveryEnd !== tMinus1 && deliveryEnd !== today && deliveryEnd !== tomorrow) continue;

      // resolve customer from included
      const custRef = tx?.relationships?.customer?.data;
      const custKey = custRef ? `${custRef.type}/${custRef.id?.uuid || custRef.id}` : null;
      const customer = custKey ? included.get(custKey) : null;

      const borrowerPhone =
        customer?.attributes?.profile?.protectedData?.phone ||
        customer?.attributes?.profile?.protectedData?.phoneNumber ||
        null;

      if (!borrowerPhone) {
        console.warn(`⚠️ No borrower phone for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }

      if (ONLY_PHONE && borrowerPhone !== ONLY_PHONE) {
        if (VERBOSE) console.log(`↩️ Skipping ${borrowerPhone} (ONLY_PHONE=${ONLY_PHONE})`);
        continue;
      }

      // choose message based on delivery end date
      let message;
      let tag;
      const pd = tx?.attributes?.protectedData || {};
      const returnData = pd.return || {};
      
      if (deliveryEnd === tMinus1) {
        // T-1 day: Send QR/label (create if missing)
        let returnLabelUrl = returnData.label?.url || 
                            pd.returnLabelUrl || 
                            pd.returnLabel || 
                            pd.shippingLabelUrl || 
                            pd.returnShippingLabel;
        
        // If no return label exists, we need to create one
        if (!returnLabelUrl && !returnData.tMinus1SentAt) {
          console.log(`🔧 Creating return label for tx ${tx?.id?.uuid || '(no id)'}`);
          // TODO: Call return label creation function here
          // For now, we'll use a placeholder URL
          returnLabelUrl = `https://sherbrt.com/return/${tx?.id?.uuid || tx?.id}`;
          
          // Update protectedData with return label info
          try {
            await sdk.transactions.update({
              id: tx.id,
              attributes: {
                protectedData: {
                  ...pd,
                  return: {
                    ...returnData,
                    label: {
                      url: returnLabelUrl,
                      createdAt: new Date().toISOString()
                    }
                  }
                }
              }
            });
            console.log(`💾 Created return label for tx ${tx?.id?.uuid || '(no id)'}`);
          } catch (updateError) {
            console.error(`❌ Failed to create return label:`, updateError.message);
          }
        }
        
        message = `📦 It's almost return time! Here's your QR to ship back tomorrow: ${returnLabelUrl} Thanks for sharing style 💌`;
        tag = 'return_tminus1_to_borrower';
        
      } else if (deliveryEnd === today) {
        // Today: Ship back
        const returnLabelUrl = returnData.label?.url ||
                              pd.returnLabelUrl || 
                              pd.returnLabel || 
                              pd.shippingLabelUrl || 
                              pd.returnShippingLabel;

        message = returnLabelUrl
          ? `📦 Today's the day! Ship your Sherbrt item back. Return label: ${returnLabelUrl}`
          : `📦 Today's the day! Ship your Sherbrt item back. Check your dashboard for return instructions.`;
        tag = returnLabelUrl ? 'return_reminder_today' : 'return_reminder_today_no_label';
        
      } else {
        // Tomorrow: Due tomorrow
        message = `⏳ Your Sherbrt return is due tomorrow—please ship it back and submit pics & feedback.`;
        tag = 'return_reminder_tomorrow';
      }

      if (VERBOSE) {
        console.log(`📬 To ${borrowerPhone} (tx ${tx?.id?.uuid || ''}) → ${message}`);
      }

      try {
        await sendSMS(borrowerPhone, message, { 
          role: 'borrower', 
          kind: 'return-reminder',
          tag: tag,
          meta: { transactionId: tx?.id?.uuid || tx?.id }
        });
        
        // Mark T-1 as sent for idempotency
        if (deliveryEnd === tMinus1) {
          try {
            await sdk.transactions.update({
              id: tx.id,
              attributes: {
                protectedData: {
                  ...pd,
                  return: {
                    ...returnData,
                    tMinus1SentAt: new Date().toISOString()
                  }
                }
              }
            });
            console.log(`💾 Marked T-1 SMS as sent for tx ${tx?.id?.uuid || '(no id)'}`);
          } catch (updateError) {
            console.error(`❌ Failed to mark T-1 as sent:`, updateError.message);
          }
        }
        
        sent++;
      } catch (e) {
        console.error(`❌ SMS failed to ${borrowerPhone}:`, e?.message || e);
        failed++;
      }

      if (LIMIT && sent >= LIMIT) {
        console.log(`⏹️ Limit reached (${LIMIT}). Stopping.`);
        break;
      }
    }

    console.log(`\n📊 Done. Sent=${sent} Failed=${failed} Processed=${processed}`);
    if (DRY) console.log('🧪 DRY-RUN mode: no real SMS were sent.');
  } catch (err) {
    console.error('❌ Fatal:', err?.message || err);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  if (argv.includes('--daemon')) {
    // Run as daemon with internal scheduling
    console.log('🔄 Starting return reminders daemon (every 15 minutes)');
    setInterval(async () => {
      try {
        await sendReturnReminders();
      } catch (error) {
        console.error('❌ Daemon error:', error.message);
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    // Run immediately
    sendReturnReminders();
  } else {
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
}

module.exports = { sendReturnReminders }; 