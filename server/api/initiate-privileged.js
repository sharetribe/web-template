const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

// Conditional import of sendSMS to prevent module loading errors
let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve(); // No-op function
}

console.log('🚦 initiate-privileged endpoint is wired up');

module.exports = (req, res) => {
  console.log('🚀 initiate-privileged endpoint HIT!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
  // STEP 1: Confirm the endpoint is hit
  console.log('🚦 initiate-privileged endpoint is wired up');
  
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;
  
  // STEP 2: Log the transition type
  console.log('🔁 Transition received:', bodyParams?.transition);
  
  // STEP 3: Check that sendSMS is properly imported
  console.log('📱 sendSMS function available:', !!sendSMS);
  console.log('📱 sendSMS function type:', typeof sendSMS);

  const sdk = getSdk(req, res);
  let lineItems = null;

  const listingPromise = () => sdk.listings.show({ id: bodyParams?.params?.listingId });

  Promise.all([listingPromise(), fetchCommission(sdk)])
    .then(([showListingResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      lineItems = transactionLineItems(
        listing,
        { ...orderData, ...bodyParams.params },
        providerCommission,
        customerCommission
      );

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      const { params } = bodyParams;

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
          lineItems,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.initiateSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.initiate(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      
      // STEP 4: Add a forced test log
      console.log('🧪 Inside initiate-privileged — beginning SMS evaluation');
      
      // STEP 8: Temporarily force an SMS to confirm Twilio works
      if (sendSMS) {
        sendSMS('+15555555555', '🧪 Fallback test SMS to verify Twilio setup works')
          .then(() => console.log('✅ Fallback test SMS sent successfully'))
          .catch(err => console.error('❌ Fallback test SMS failed:', err.message));
      }
      
      // SMS notification for transition/request-payment (initial booking request)
      if (bodyParams?.transition === 'transition/request-payment' && !isSpeculative && data?.data) {
        console.log('📨 Preparing to send SMS for initial booking request');
        
        // Get the listing to find the provider
        const listingId = bodyParams?.params?.listingId;
        if (listingId && sendSMS) {
          sdk.listings.show({ id: listingId })
            .then(listingResponse => {
              const listing = listingResponse.data.data;
              const provider = listing.relationships.provider.data;
              
              if (provider && provider.attributes && provider.attributes.profile && provider.attributes.profile.protectedData) {
                const lenderPhone = provider.attributes.profile.protectedData.phone;
                
                // STEP 6: Add logs for borrower and lender phone numbers
                console.log('📱 Lender phone:', lenderPhone);
                
                if (lenderPhone) {
                  // STEP 7: Wrap sendSMS in try/catch with logs
                  return sendSMS(
                    lenderPhone,
                    `👗 New Sherbrt rental request! Someone wants to borrow your item — tap your dashboard to review and respond.`
                  )
                    .then(() => {
                      console.log('✅ SMS sent to', lenderPhone);
                      console.log(`📱 SMS sent to lender (${lenderPhone}) for initial booking request`);
                    })
                    .catch(err => {
                      console.error('❌ SMS send error:', err.message);
                    });
                } else {
                  console.warn('⚠️ Lender phone number not found in protected data');
                }
              } else {
                console.warn('⚠️ Provider or protected data not found for SMS notification');
              }
            })
            .catch(smsError => {
              console.error('❌ Failed to send SMS notification:', smsError.message);
              // Don't fail the transaction if SMS fails
            });
        }
      }
      
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
      handleError(res, e);
    });
};
