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
  let listingData = null; // Store listing data for SMS use
  let providerData = null; // Store provider data for SMS use

  const listingPromise = () => sdk.listings.show({ 
    id: bodyParams?.params?.listingId
  });

  // Get provider data by first getting the listing, then the user
  const providerPromise = async () => {
    const listingId = bodyParams?.params?.listingId;
    if (listingId) {
      try {
        // First get the listing to find the provider ID
        const listingResponse = await sdk.listings.show({ 
          id: listingId,
          include: ['author', 'author.profileImage'],
          'fields.user': ['profile', 'profile.protectedData', 'profile.publicData', 'email'],
          'fields.profile': ['protectedData', 'publicData']
        });
        const listing = listingResponse.data.data;
        
        console.log('🔍 Listing attributes:', listing.attributes);
        console.log('🔍 Listing relationships:', listing.relationships);
        console.log('🔍 Listing response included data:', listingResponse.data.included?.map(item => ({
          type: item.type,
          id: item.id,
          hasProfile: !!item.attributes?.profile,
          hasProtectedData: !!item.attributes?.profile?.protectedData
        })) || 'No included data');
        
        // Try to get provider ID from different possible locations
        let providerId = null;
        
        // Method 1: Try author relationship (most common in Sharetribe Flex)
        if (listing.relationships && listing.relationships.author) {
          providerId = listing.relationships.author.data.id;
          console.log('🔍 Found provider ID from author relationship:', providerId);
        }
        // Method 2: Try provider relationship (alternative)
        else if (listing.relationships && listing.relationships.provider) {
          providerId = listing.relationships.provider.data.id;
          console.log('🔍 Found provider ID from provider relationship:', providerId);
        }
        // Method 3: Try attributes
        else if (listing.attributes && listing.attributes.author) {
          providerId = listing.attributes.author;
          console.log('🔍 Found provider ID from attributes.author:', providerId);
        }
        // Method 4: Try other possible attribute names
        else if (listing.attributes && listing.attributes.provider) {
          providerId = listing.attributes.provider;
          console.log('🔍 Found provider ID from attributes.provider:', providerId);
        }
        else if (listing.attributes && listing.attributes.userId) {
          providerId = listing.attributes.userId;
          console.log('🔍 Found provider ID from attributes.userId:', providerId);
        }
        // Method 5: Try to get from current user context (if this is the provider)
        else {
          try {
            console.log('🔍 Trying to get current user as provider...');
            const currentUser = await sdk.currentUser.show();
            console.log('🔍 Current user response structure:', Object.keys(currentUser || {}));
            console.log('🔍 Current user data structure:', Object.keys(currentUser?.data || {}));
            console.log('🔍 Current user data.data structure:', Object.keys(currentUser?.data?.data || {}));
            
            if (currentUser && currentUser.data && currentUser.data.data) {
              providerId = currentUser.data.data.id;
              console.log('🔍 Using current user as provider ID:', providerId);
            }
          } catch (userErr) {
            console.warn('⚠️ Could not get current user:', userErr.message);
          }
        }
        
        // Method 6: Try to get from transaction data if available
        if (!providerId && bodyParams?.params?.transactionId) {
          try {
            console.log('🔍 Trying to get provider from transaction data...');
            const transactionResponse = await sdk.transactions.show({ id: bodyParams.params.transactionId });
            console.log('🔍 Transaction response structure:', Object.keys(transactionResponse || {}));
            console.log('🔍 Transaction data structure:', Object.keys(transactionResponse?.data || {}));
            
            if (transactionResponse?.data?.data?.relationships?.provider) {
              providerId = transactionResponse.data.data.relationships.provider.data.id;
              console.log('🔍 Found provider ID from transaction:', providerId);
            }
          } catch (transactionErr) {
            console.warn('⚠️ Could not get transaction data:', transactionErr.message);
          }
        }
        
        if (providerId) {
          // Now get the user data for this provider
          const userResponse = await sdk.users.show({
            id: providerId,
            include: ['profile'],
            'fields.user': ['profile'],
            'fields.profile': ['protectedData'],
          });
          return userResponse;
        } else {
          console.warn('⚠️ No provider ID found in listing data');
          console.log('🔍 Available listing attributes:', Object.keys(listing.attributes || {}));
          return null;
        }
      } catch (err) {
        console.warn('⚠️ Failed to get provider data:', err.message);
        return null;
      }
    }
    return null;
  };

  Promise.all([listingPromise(), fetchCommission(sdk)])
    .then(async ([showListingResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      listingData = listing; // Store for SMS use
      
      // Get provider data separately
      const providerResponse = await providerPromise();
      if (providerResponse && providerResponse.data && providerResponse.data.data) {
        providerData = providerResponse.data.data;
        console.log('🔍 Provider data available:', !!providerData);
        console.log('🔍 Provider data structure:', providerData ? Object.keys(providerData) : 'undefined');
      }
      
      // Debug the listing response
      console.log('🔍 showListingResponse structure:', Object.keys(showListingResponse));
      console.log('🔍 showListingResponse.data structure:', Object.keys(showListingResponse.data));
      console.log('🔍 listing structure:', Object.keys(listing));
      console.log('🔍 listing.relationships:', listing.relationships);
      
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
      
      // ✅ Update SMS block inside transition/request-payment to use providerData:
      if (
        bodyParams?.transition === 'transition/request-payment' &&
        !isSpeculative &&
        data?.data
      ) {
        console.log('📨 Preparing to send SMS for initial booking request');
        console.log('🔍 listingData available:', !!listingData);
        console.log('🔍 providerData available:', !!providerData);

        try {
          const protectedData = providerData?.attributes?.profile?.protectedData || {};
          console.log('🔍 [DEBUG] providerData structure:', {
            hasAttributes: !!providerData?.attributes,
            hasProfile: !!providerData?.attributes?.profile,
            hasProtectedData: !!providerData?.attributes?.profile?.protectedData,
            profileKeys: providerData?.attributes?.profile ? Object.keys(providerData.attributes.profile) : 'No profile',
            protectedDataKeys: providerData?.attributes?.profile?.protectedData ? Object.keys(providerData.attributes.profile.protectedData) : 'No protectedData'
          });
          console.log('🔍 [DEBUG] Full providerData response:', JSON.stringify(providerData, null, 2));
          console.log('🔍 [DEBUG] Extracted protectedData:', protectedData);
          
          const lenderPhone = protectedData.phoneNumber;
          console.log('🔍 [DEBUG] protectedData.phoneNumber:', protectedData.phoneNumber);
          console.log('🔍 [DEBUG] Final lenderPhone value:', lenderPhone);

          if (sendSMS && lenderPhone) {
            const listingTitle = listingData?.attributes?.title || 'your listing';
            const message = `👗 New Sherbrt rental request! Someone wants to borrow your item "${listingTitle}". Tap your dashboard to respond.`;

            sendSMS(lenderPhone, message)
              .then(() => {
                console.log(`✅ SMS sent to ${lenderPhone}`);
              })
              .catch(err => {
                console.error('❌ SMS send error:', err.message);
              });
          } else {
            console.warn('⚠️ Missing lenderPhone or sendSMS unavailable');
            console.log('🔍 [DEBUG] sendSMS available:', !!sendSMS);
            console.log('🔍 [DEBUG] lenderPhone value:', lenderPhone);
            console.log('🔍 Protected data contents:', protectedData);
          }
        } catch (err) {
          console.error('❌ SMS send error:', err.message);
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
