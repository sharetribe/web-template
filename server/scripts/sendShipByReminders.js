const { getTrustedSdk } = require('../api-util/sdk');
let { sendSMS } = require('../api-util/sendSMS');
const { maskPhone } = require('../api-util/phone');
const { computeShipByDate, formatShipBy } = require('../lib/shipping');

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

// Parse command line arguments
const argv = process.argv.slice(2);
const has = name => argv.includes(name);
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

function diffDays(date1, date2) {
  const d1 = new Date(date1 + 'T00:00:00.000Z'); // Force UTC
  const d2 = new Date(date2 + 'T00:00:00.000Z'); // Force UTC
  return Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
}

function addDays(date, days) {
  const result = new Date(date + 'T00:00:00.000Z'); // Force UTC
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isSameDay(date1, date2) {
  return yyyymmdd(date1) === yyyymmdd(date2);
}

function isMorningOf(date) {
  const now = new Date();
  const target = new Date(date + 'T00:00:00.000Z'); // Force UTC
  return isSameDay(now, target) && now.getUTCHours() >= 6 && now.getUTCHours() < 12;
}

// Removed local computeShipByDate - now using centralized helper from server/lib/shipping.js

async function sendShipByReminders() {
  console.log('🚀 Starting ship-by reminder SMS script...');
  
  try {
    const sdk = await getScriptSdk();
    console.log('✅ SDK initialized');

    const today = process.env.FORCE_TODAY || yyyymmdd(Date.now());
    const todayDate = new Date(today);
    
    console.log(`📅 Processing reminders for: ${today}`);

    // Load accepted transactions with future ship-by dates and no first scan
    const query = {
      state: 'accepted',
      include: ['listing', 'provider', 'customer'],
      'fields.listing': 'title',
      'fields.provider': 'profile',
      'fields.customer': 'profile',
      per_page: 100
    };

    const response = await sdk.transactions.query(query);
    const transactions = response.data.data;
    const included = response.data.included;

    console.log(`📊 Found ${transactions.length} accepted transactions`);

    let sent = 0, failed = 0, processed = 0;

    for (const tx of transactions) {
      processed++;
      
      const protectedData = tx?.attributes?.protectedData || {};
      const outbound = protectedData.outbound || {};
      
      // Skip if already scanned
      if (outbound.firstScanAt) {
        continue;
      }
      
      // Use centralized ship-by calculation
      const shipByDate = computeShipByDate(tx);
      if (!shipByDate) {
        console.warn(`⚠️ Could not compute ship-by date for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }
      
      const acceptedAt = outbound.acceptedAt ? new Date(outbound.acceptedAt) : null;
      if (!acceptedAt) {
        console.warn(`⚠️ No acceptedAt for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }
      
      // Calculate lead time
      const leadDays = diffDays(shipByDate, acceptedAt);
      
      // Get provider phone
      const providerRef = tx?.relationships?.provider?.data;
      const providerKey = providerRef ? `${providerRef.type}/${providerRef.id?.uuid || providerRef.id}` : null;
      const provider = providerKey ? included.get(providerKey) : null;
      
      const providerPhone = provider?.attributes?.profile?.protectedData?.phone ||
                           provider?.attributes?.profile?.protectedData?.phoneNumber ||
                           null;
      
      if (!providerPhone) {
        console.warn(`⚠️ No provider phone for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }
      
      if (ONLY_PHONE && providerPhone !== ONLY_PHONE) {
        if (VERBOSE) console.log(`↩️ Skipping ${providerPhone} (ONLY_PHONE=${ONLY_PHONE})`);
        continue;
      }
      
      // Get listing title and QR URL
      const listingRef = tx?.relationships?.listing?.data;
      const listingKey = listingRef ? `${listingRef.type}/${listingRef.id?.uuid || listingRef.id}` : null;
      const listing = listingKey ? included.get(listingKey) : null;
      const title = listing?.attributes?.title || 'your item';
      
      const qrUrl = `https://sherbrt.com/ship/${tx?.id?.uuid || tx?.id}`;
      const reminders = outbound.reminders || {};
      
      let message = null;
      let tag = null;
      let reminderKey = null;
      
      if (leadDays > 7) {
        // Long lead branch
        const t48Date = addDays(shipByDate, -2);
        const t24Date = addDays(shipByDate, -1);
        
        if (isSameDay(todayDate, t48Date) && !reminders.t48) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_t48_to_lender';
          reminderKey = 't48';
        } else if (isSameDay(todayDate, t24Date) && !reminders.t24) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_t24_to_lender';
          reminderKey = 't24';
        } else if (isMorningOf(shipByDate) && !reminders.morning) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_morning_to_lender';
          reminderKey = 'morning';
        }
      } else {
        // Short lead branch
        const plus24Date = addDays(acceptedAt, 1);
        const plus48Date = addDays(acceptedAt, 2);
        const t24Date = addDays(shipByDate, -1);
        
        if (isSameDay(todayDate, plus24Date) && !reminders.short24) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_short24_to_lender';
          reminderKey = 'short24';
        } else if (isSameDay(todayDate, plus48Date) && !reminders.short48) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_short48_to_lender';
          reminderKey = 'short48';
        } else if (isSameDay(todayDate, t24Date) && !reminders.t24) {
          const shipByStr = formatShipBy(shipByDate);
          message = `⏰ Reminder: please ship "${title}" by ${shipByStr}. QR: ${qrUrl}`;
          tag = 'shipby_t24_to_lender';
          reminderKey = 't24';
        }
      }
      
      if (message && tag && reminderKey) {
        if (VERBOSE) {
          console.log(`📬 To ${providerPhone} (tx ${tx?.id?.uuid || ''}) → ${message}`);
        }
        
        try {
          await sendSMS(providerPhone, message, {
            role: 'lender',
            tag: tag,
            meta: { 
              txId: tx?.id?.uuid || tx?.id,
              listingId: listing?.id?.uuid || listing?.id
            }
          });
          
          // Mark reminder as sent
          const updatedReminders = { ...reminders, [reminderKey]: new Date().toISOString() };
          
          try {
            await sdk.transactions.update({
              id: tx.id,
              attributes: {
                protectedData: {
                  ...protectedData,
                  outbound: {
                    ...outbound,
                    reminders: updatedReminders
                  }
                }
              }
            });
            console.log(`💾 Updated transaction reminders: ${reminderKey} sent`);
          } catch (updateError) {
            console.error(`❌ Failed to update transaction reminders:`, updateError.message);
          }
          
          sent++;
        } catch (e) {
          console.error(`❌ SMS failed to ${providerPhone}:`, e?.message || e);
          failed++;
        }
        
        if (LIMIT && sent >= LIMIT) {
          console.log(`⏹️ Limit reached (${LIMIT}). Stopping.`);
          break;
        }
      }
    }
    
    console.log(`📊 Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Unit test helpers
function testTimeWindows() {
  const testDate = new Date('2024-01-15');
  const acceptedAt = new Date('2024-01-10');
  const shipByDate = new Date('2024-01-20');
  
  console.log('🧪 Testing time windows:');
  console.log(`Lead days: ${diffDays('2024-01-20', '2024-01-10')}`);
  console.log(`T-48 date: ${yyyymmdd(addDays('2024-01-20', -2))}`);
  console.log(`T-24 date: ${yyyymmdd(addDays('2024-01-20', -1))}`);
  console.log(`Morning check: ${isMorningOf('2024-01-20')}`);
}

function testIdempotency() {
  const reminders = { t48: '2024-01-13T10:00:00Z' };
  console.log('🧪 Testing idempotency:');
  console.log(`T-48 already sent: ${!!reminders.t48}`);
  console.log(`T-24 not sent: ${!reminders.t24}`);
}

if (require.main === module) {
  if (argv.includes('--test')) {
    testTimeWindows();
    testIdempotency();
  } else if (argv.includes('--daemon')) {
    // Run as daemon with internal scheduling
    console.log('🔄 Starting ship-by reminders daemon (every 15 minutes)');
    setInterval(async () => {
      try {
        await sendShipByReminders();
      } catch (error) {
        console.error('❌ Daemon error:', error.message);
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    // Run immediately
    sendShipByReminders();
  } else {
    sendShipByReminders();
  }
}

module.exports = { sendShipByReminders, testTimeWindows, testIdempotency };
