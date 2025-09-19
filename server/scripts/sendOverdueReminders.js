const { getTrustedSdk } = require('../api-util/sdk');
const { sendSMS } = require('../api-util/sendSMS');
const { maskPhone } = require('../api-util/phone');

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

function isInTransit(trackingStatus) {
  const upperStatus = trackingStatus?.toUpperCase();
  return upperStatus === 'IN_TRANSIT' || upperStatus === 'ACCEPTED';
}

async function evaluateReplacementCharge(tx) {
  // Stub function for replacement charge evaluation
  console.log(`🔍 Evaluating replacement charge for tx ${tx?.id?.uuid || tx?.id}`);
  
  // TODO: Implement actual replacement charge logic
  // This would typically involve:
  // 1. Getting the listing price/value
  // 2. Calculating replacement cost
  // 3. Recording the charge intent
  // 4. Potentially initiating Stripe charge
  
  return {
    replacementAmount: 5000, // $50.00 in cents
    evaluated: true,
    timestamp: new Date().toISOString()
  };
}

async function sendOverdueReminders() {
  console.log('🚀 Starting overdue reminder SMS script...');
  
  try {
    const sdk = await getScriptSdk();
    console.log('✅ SDK initialized');

    const today = process.env.FORCE_TODAY || yyyymmdd(Date.now());
    const todayDate = new Date(today);
    
    console.log(`📅 Processing overdue reminders for: ${today}`);

    // Load delivered transactions where return date has passed and no first scan
    const query = {
      state: 'delivered',
      include: ['customer', 'listing'],
      per_page: 100
    };

    const response = await sdk.transactions.query(query);
    const transactions = response.data.data;
    const included = response.data.included;

    console.log(`📊 Found ${transactions.length} delivered transactions`);

    let sent = 0, failed = 0, processed = 0;

    for (const tx of transactions) {
      processed++;
      
      const deliveryEnd = tx?.attributes?.deliveryEnd;
      if (!deliveryEnd) continue;
      
      const returnDate = new Date(deliveryEnd);
      const daysLate = diffDays(todayDate, returnDate);
      
      // Skip if not overdue
      if (daysLate < 1) continue;
      
      const protectedData = tx?.attributes?.protectedData || {};
      const returnData = protectedData.return || {};
      
      // Skip if already scanned (in transit)
      if (returnData.firstScanAt) {
        console.log(`✅ Return already in transit for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }
      
      // Get borrower phone
      const customerRef = tx?.relationships?.customer?.data;
      const customerKey = customerRef ? `${customerRef.type}/${customerRef.id?.uuid || customerRef.id}` : null;
      const customer = customerKey ? included.get(customerKey) : null;
      
      const borrowerPhone = customer?.attributes?.profile?.protectedData?.phone ||
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
      
      // Get listing info
      const listingRef = tx?.relationships?.listing?.data;
      const listingKey = listingRef ? `${listingRef.type}/${listingRef.id?.uuid || listingRef.id}` : null;
      const listing = listingKey ? included.get(listingKey) : null;
      
      // Get return label URL
      const returnLabelUrl = returnData.label?.url ||
                            protectedData.returnLabelUrl ||
                            protectedData.returnLabel ||
                            protectedData.shippingLabelUrl ||
                            protectedData.returnShippingLabel ||
                            `https://sherbrt.com/return/${tx?.id?.uuid || tx?.id}`;
      
      // Check if we've already notified for this day
      const overdue = returnData.overdue || {};
      const lastNotifiedDay = overdue.lastNotifiedDay;
      
      if (lastNotifiedDay === daysLate) {
        console.log(`📅 Already notified for day ${daysLate} for tx ${tx?.id?.uuid || '(no id)'}`);
        continue;
      }
      
      // Calculate fees
      const fees = returnData.fees || {};
      const perDayCents = fees.perDayCents || 1500; // $15/day default
      const feesStartedAt = fees.startedAt || new Date(returnDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const totalCents = perDayCents * daysLate;
      
      // Determine message based on days late
      let message;
      let tag;
      
      if (daysLate === 1) {
        message = `⚠️ Due yesterday. Please ship today to avoid $15/day late fees. QR: ${returnLabelUrl}`;
        tag = 'overdue_day1_to_borrower';
      } else if (daysLate === 2) {
        message = `🚫 2 days late. $15/day fees are adding up. Ship now: ${returnLabelUrl}`;
        tag = 'overdue_day2_to_borrower';
      } else if (daysLate === 3) {
        message = `⏰ 3 days late. Fees continue. Ship today to avoid full replacement.`;
        tag = 'overdue_day3_to_borrower';
      } else if (daysLate === 4) {
        message = `⚠️ 4 days late. Ship immediately to prevent replacement charges.`;
        tag = 'overdue_day4_to_borrower';
      } else {
        // Day 5+
        const replacementAmount = 5000; // $50.00 in cents
        message = `🚫 5 days late. You may be charged full replacement ($${replacementAmount/100}). Avoid this by shipping today: ${returnLabelUrl}`;
        tag = 'overdue_day5_to_borrower';
      }
      
      if (VERBOSE) {
        console.log(`📬 To ${borrowerPhone} (tx ${tx?.id?.uuid || ''}, ${daysLate} days late) → ${message}`);
      }
      
      try {
        await sendSMS(borrowerPhone, message, {
          role: 'borrower',
          tag: tag,
          meta: { 
            txId: tx?.id?.uuid || tx?.id,
            listingId: listing?.id?.uuid || listing?.id,
            daysLate: daysLate,
            totalFeesCents: totalCents
          }
        });
        
        // Update transaction with fees and notification tracking
        const updatedReturnData = {
          ...returnData,
          fees: {
            ...fees,
            perDayCents: perDayCents,
            totalCents: totalCents,
            startedAt: feesStartedAt
          },
          overdue: {
            ...overdue,
            daysLate: daysLate,
            lastNotifiedDay: daysLate
          }
        };
        
        // Evaluate replacement on Day 5 if not already evaluated
        if (daysLate === 5 && !overdue.replacementEvaluated) {
          const replacementResult = await evaluateReplacementCharge(tx);
          updatedReturnData.overdue.replacementEvaluated = true;
          updatedReturnData.overdue.replacementEvaluation = replacementResult;
          console.log(`🔍 Evaluated replacement charge for Day 5: $${replacementResult.replacementAmount/100}`);
        }
        
        try {
          await sdk.transactions.update({
            id: tx.id,
            attributes: {
              protectedData: {
                ...protectedData,
                return: updatedReturnData
              }
            }
          });
          console.log(`💾 Updated transaction fees and overdue tracking for tx ${tx?.id?.uuid || '(no id)'}`);
        } catch (updateError) {
          console.error(`❌ Failed to update transaction:`, updateError.message);
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
    
    console.log(`📊 Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Unit test helpers
function testOverdueScenarios() {
  console.log('🧪 Testing overdue scenarios:');
  
  const today = new Date('2024-01-20');
  const returnDate = new Date('2024-01-15');
  const daysLate = Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24));
  
  console.log(`Days late: ${daysLate}`);
  console.log(`Per day fee: $15 (1500 cents)`);
  console.log(`Total fees: $${(1500 * daysLate) / 100}`);
  
  // Test replacement evaluation
  if (daysLate >= 5) {
    console.log('🔍 Would evaluate replacement charge');
  }
}

if (require.main === module) {
  if (argv.includes('--test')) {
    testOverdueScenarios();
  } else if (argv.includes('--daemon')) {
    // Run as daemon with internal scheduling (daily at 9 AM UTC)
    console.log('🔄 Starting overdue reminders daemon (daily at 9 AM UTC)');
    
    const runDaily = async () => {
      try {
        await sendOverdueReminders();
      } catch (error) {
        console.error('❌ Daemon error:', error.message);
      }
    };
    
    // Calculate time until next 9 AM UTC
    const now = new Date();
    const next9AM = new Date(now);
    next9AM.setUTCHours(9, 0, 0, 0);
    if (next9AM <= now) {
      next9AM.setUTCDate(next9AM.getUTCDate() + 1);
    }
    
    const msUntilNext9AM = next9AM.getTime() - now.getTime();
    console.log(`⏰ Next run scheduled for: ${next9AM.toISOString()}`);
    
    setTimeout(() => {
      runDaily();
      // Then run every 24 hours
      setInterval(runDaily, 24 * 60 * 60 * 1000);
    }, msUntilNext9AM);
    
    // Run immediately for testing
    runDaily();
  } else {
    sendOverdueReminders();
  }
}

module.exports = { sendOverdueReminders, evaluateReplacementCharge, testOverdueScenarios };
