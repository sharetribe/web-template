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
        
        // Method 1: Try to get from listing relationships
        if (listing.relationships?.author?.data?.id) {
          providerId = listing.relationships.author.data.id;
          console.log('🔍 Found provider ID from listing.author:', providerId);
        }
        
        // Method 2: Try to get from included data
        if (!providerId && listingResponse.data.included) {
          const authorIncluded = listingResponse.data.included.find(item => 
            item.type === 'user' && item.id === listing.relationships?.author?.data?.id
          );
          if (authorIncluded) {
            providerId = authorIncluded.id;
            console.log('🔍 Found provider ID from included data:', providerId);
            console.log('🔍 [DEBUG] Author included data structure:', {
              hasAttributes: !!authorIncluded.attributes,
              hasProfile: !!authorIncluded.attributes?.profile,
              hasProtectedData: !!authorIncluded.attributes?.profile?.protectedData,
              profileKeys: authorIncluded.attributes?.profile ? Object.keys(authorIncluded.attributes.profile) : 'No profile',
              protectedDataKeys: authorIncluded.attributes?.profile?.protectedData ? Object.keys(authorIncluded.attributes.profile.protectedData) : 'No protectedData'
            });
            console.log('🔍 [DEBUG] Author included data:', JSON.stringify(authorIncluded, null, 2));
          }
        }
        
        // Method 3: Try to get from listing attributes
        if (!providerId && listing.attributes?.authorId) {
          providerId = listing.attributes.authorId;
          console.log('🔍 Found provider ID from listing.authorId:', providerId);
        }
        
        // Method 4: Try to get from listing publicData
        if (!providerId && listing.attributes?.publicData?.authorId) {
          providerId = listing.attributes.publicData.authorId;
          console.log('🔍 Found provider ID from listing.publicData.authorId:', providerId);
        }
        
        // Method 5: Try to get from listing metadata
        if (!providerId && listing.attributes?.metadata?.authorId) {
          providerId = listing.attributes.metadata.authorId;
          console.log('🔍 Found provider ID from listing.metadata.authorId:', providerId);
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
        
        // TEST: Try to access current user's own protected data first
        console.log('🧪 [TEST] Testing current user protected data access...');
        try {
          const currentUserResponse = await sdk.currentUser.show({
            include: ['profile'],
            'fields.user': ['profile', 'protectedData'],
            'fields.profile': ['protectedData', 'publicData'],
          });
          
          console.log('✅ [TEST] Current user access SUCCESSFUL');
          const currentUserProtectedData = currentUserResponse?.data?.data?.attributes?.profile?.protectedData || {};
          console.log('🔍 [TEST] Current user protectedData:', currentUserProtectedData);
          console.log('🔍 [TEST] Current user protectedData.phoneNumber:', currentUserProtectedData.phoneNumber);
        } catch (currentUserError) {
          console.error('❌ [TEST] Current user access FAILED:', {
            error: currentUserError.message,
            status: currentUserError.status,
            errorCode: currentUserError.data?.errors?.[0]?.code
          });
        }
        
        if (providerId) {
          // Now get the user data for this provider
          console.log('🔍 [DEBUG] About to fetch provider profile for ID:', providerId);
          try {
            // Test different field specification approaches
            console.log('🧪 [TEST] Testing different field specifications...');
            
            // Approach 1: Current approach
            console.log('🧪 [TEST] Approach 1: Current field specification');
            const userResponse = await sdk.users.show({
              id: providerId,
              include: ['profile'],
              'fields.user': ['profile', 'protectedData'],
              'fields.profile': ['protectedData', 'publicData'],
            });
            
            console.log('✅ [DEBUG] Provider profile fetch SUCCESSFUL');
            console.log('🔍 [DEBUG] User response status:', userResponse?.status);
            console.log('🔍 [DEBUG] User response has data:', !!userResponse?.data);
            
            // Test Approach 2: Alternative field specification
            console.log('🧪 [TEST] Approach 2: Alternative field specification');
            try {
              const userResponse2 = await sdk.users.show({
                id: providerId,
                include: ['profile'],
                'fields.user': ['profile', 'profile.protectedData', 'profile.publicData'],
                'fields.profile': ['protectedData', 'publicData'],
              });
              console.log('✅ [TEST] Approach 2 SUCCESSFUL');
              const protectedData2 = userResponse2?.data?.data?.attributes?.profile?.protectedData || {};
              console.log('🔍 [TEST] Approach 2 protectedData:', protectedData2);
            } catch (approach2Error) {
              console.error('❌ [TEST] Approach 2 FAILED:', approach2Error.message);
            }
            
            // Test Approach 3: Minimal field specification
            console.log('🧪 [TEST] Approach 3: Minimal field specification');
            try {
              const userResponse3 = await sdk.users.show({
                id: providerId,
                include: ['profile'],
              });
              console.log('✅ [TEST] Approach 3 SUCCESSFUL');
              const protectedData3 = userResponse3?.data?.data?.attributes?.profile?.protectedData || {};
              console.log('🔍 [TEST] Approach 3 protectedData:', protectedData3);
            } catch (approach3Error) {
              console.error('❌ [TEST] Approach 3 FAILED:', approach3Error.message);
            }
            
            return userResponse;
          } catch (userError) {
            console.error('❌ [DEBUG] Provider profile fetch FAILED:', {
              error: userError.message,
              status: userError.status,
              statusText: userError.statusText,
              errorCode: userError.data?.errors?.[0]?.code,
              errorTitle: userError.data?.errors?.[0]?.title,
              errorDetail: userError.data?.errors?.[0]?.detail,
              fullError: JSON.stringify(userError, null, 2)
            });
            
            // Check for specific permission errors
            if (userError.status === 403) {
              console.error('🚫 [DEBUG] PERMISSION DENIED - 403 error detected');
              if (userError.data?.errors?.[0]?.code === 'permission-denied-read') {
                console.error('🚫 [DEBUG] READ PERMISSION DENIED - Cannot read user data');
              }
            }
            
            return null;
          }
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
    .then(async (apiResponse) => {
      const { status, statusText, data } = apiResponse;
      
      // STEP 4: Add a forced test log
      console.log('🧪 Inside initiate-privileged — beginning SMS evaluation');
      
      // 🔧 FIXED: Lender notification SMS for booking requests - ensure provider phone only
      if (
        bodyParams?.transition === 'transition/request-payment' &&
        !isSpeculative &&
        data?.data
      ) {
        console.log('📨 [SMS][booking-request] Preparing to send lender notification SMS');
        
        try {
          const transaction = data?.data;
          const sdk = getTrustedSdk(req);
          
          // 🔧 FIXED: Resolve provider ID from transaction/listing (normalized)
          const txProviderId = (transaction?.relationships?.provider?.data?.id) || 
                              (transaction?.attributes?.providerId) || 
                              (transaction?.attributes?.publicData?.providerId);
          const listingAuthorId = listingData?.relationships?.author?.data?.id;
          
          // Helper for ID equality checks
          const eq = (a, b) => (a && b) ? String(a) === String(b) : false;
          
          console.log('[INVEST] match provider?', eq(txProviderId, listingAuthorId));
          console.log('[INVEST] txProviderId:', txProviderId);
          console.log('[INVEST] listingAuthorId:', listingAuthorId);
          
          // 🔧 FIXED: Fetch provider user/profile by ID (do not use currentUser or transaction.protectedData)
          const providerId = txProviderId || listingAuthorId;
          if (!providerId) {
            console.warn('[SMS][booking-request] No provider ID found; not sending SMS');
            return;
          }
          
          const provider = await sdk.users.show({ 
            id: providerId,
            include: ['profile'],
            'fields.user': ['profile'],
            'fields.profile': ['protectedData', 'publicData']
          });
          
          const prof = provider?.data?.data;
          if (!prof) {
            console.warn('[SMS][booking-request] Provider profile not found; not sending SMS');
            return;
          }
          
          // 🔧 FIXED: Get provider phone from profile only (no transaction fallback)
          const providerPhone = 
            prof?.attributes?.profile?.protectedData?.phone ??
            prof?.attributes?.profile?.protectedData?.phoneNumber ??
            prof?.attributes?.profile?.publicData?.phone ??
            prof?.attributes?.profile?.publicData?.phoneNumber ?? 
            null;
          
          // 🔧 FIXED: Also resolve customerId and borrowerPhone for safety check
          const customerId = transaction?.relationships?.customer?.data?.id;
          let borrowerPhone = null;
          
          if (customerId) {
            try {
              const customer = await sdk.users.show({ 
                id: customerId,
                include: ['profile'],
                'fields.user': ['profile'],
                'fields.profile': ['protectedData', 'publicData']
              });
              
              const customerProf = customer?.data?.data;
              borrowerPhone = 
                customerProf?.attributes?.profile?.protectedData?.phone ??
                customerProf?.attributes?.profile?.protectedData?.phoneNumber ??
                customerProf?.attributes?.profile?.publicData?.phone ??
                customerProf?.attributes?.profile?.publicData?.phoneNumber ?? 
                null;
            } catch (customerErr) {
              console.warn('[SMS][booking-request] Could not fetch customer profile for safety check:', customerErr.message);
            }
          }
          
          // 🔧 FIXED: Guard against misroute - block if provider missing phone or if we accidentally selected borrower
          if (!providerPhone) {
            console.warn('[SMS][booking-request] Provider missing phone; not sending.', { 
              txId: transaction?.id, 
              txProviderId, 
              listingAuthorId 
            });
            return;
          }
          
          if (providerPhone === borrowerPhone) {
            console.error('[SMS][booking-request] Detected borrower phone for lender notification; aborting send.', { 
              txId: transaction?.id, 
              txProviderId, 
              customerId 
            });
            return;
          }
          
          // 🔧 FIXED: Final verification logs before SMS send
          console.log('[SMS][booking-request] Final verification before send:', {
            txId: transaction?.id,
            txProviderId,
            customerId,
            providerPhone,
            borrowerPhone,
            to: providerPhone
          });
          
          // Send the SMS to provider only
          const listingTitle = listingData?.attributes?.title || 'your listing';
          const message = `👗 New Sherbrt booking request! Someone wants to borrow your item "${listingTitle}". Tap your dashboard to respond.`;
          
          await sendSMS(providerPhone, message);
          console.log(`✅ [SMS][booking-request] Lender notification sent to ${providerPhone}`);
          
        } catch (err) {
          console.error('❌ [SMS][booking-request] Error sending lender notification:', err.message);
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
