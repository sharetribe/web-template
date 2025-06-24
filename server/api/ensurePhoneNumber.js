const { getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

/**
 * API endpoint to ensure phone number is saved to protectedData
 * This can be called after sign-up to guarantee the phone number is stored correctly
 * We only save to protectedData for privacy - publicData is not used for phone numbers
 */
module.exports = async (req, res) => {
  console.log('📱 [ensurePhoneNumber] Endpoint called');
  
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      console.warn('⚠️ [ensurePhoneNumber] No phone number provided');
      return res.status(400).json({ 
        error: 'Phone number is required',
        message: 'Please provide a phone number to save to protectedData'
      });
    }
    
    console.log('📱 [ensurePhoneNumber] Phone number received:', phoneNumber);
    
    // Get trusted SDK to access current user
    const sdk = await getTrustedSdk(req);
    
    // First, get current user to see if phone number is already in protectedData
    console.log('🔍 [ensurePhoneNumber] Fetching current user data...');
    const currentUserResponse = await sdk.currentUser.show({
      include: ['profile'],
      'fields.user': ['profile', 'protectedData'],
      'fields.profile': ['protectedData', 'publicData'],
    });
    
    const currentUser = currentUserResponse?.data?.data;
    const existingProtectedData = currentUser?.attributes?.profile?.protectedData || {};
    const existingPublicData = currentUser?.attributes?.profile?.publicData || {};
    const existingPhoneNumber = existingProtectedData.phoneNumber;
    const existingInstagramHandle = existingProtectedData.instagramHandle;
    
    console.log('🔍 [ensurePhoneNumber] Current protectedData:', existingProtectedData);
    console.log('🔍 [ensurePhoneNumber] Current publicData:', existingPublicData);
    console.log('🔍 [ensurePhoneNumber] Existing phone number:', existingPhoneNumber);
    console.log('🔍 [ensurePhoneNumber] Existing Instagram handle:', existingInstagramHandle);
    
    // Prepare updates
    let updatedProtectedData = { ...existingProtectedData };
    let updatedPublicData = { ...existingPublicData };
    let hasUpdates = false;
    
    // Update phone number in protectedData if different
    if (existingPhoneNumber !== phoneNumber) {
      updatedProtectedData.phoneNumber = phoneNumber;
      hasUpdates = true;
      console.log('📝 [ensurePhoneNumber] Updating phone number in protectedData...');
    }
    
    // Move Instagram handle from protectedData to publicData if it exists
    if (existingInstagramHandle && !existingPublicData.instagramHandle) {
      updatedPublicData.instagramHandle = existingInstagramHandle;
      delete updatedProtectedData.instagramHandle;
      hasUpdates = true;
      console.log('📝 [ensurePhoneNumber] Moving Instagram handle from protectedData to publicData...');
    }

    // Move birthdayDay from protectedData to publicData if it exists
    if (existingProtectedData.birthdayDay && !existingPublicData.birthdayDay) {
      updatedPublicData.birthdayDay = existingProtectedData.birthdayDay;
      delete updatedProtectedData.birthdayDay;
      hasUpdates = true;
      console.log('📝 [ensurePhoneNumber] Moving birthdayDay from protectedData to publicData...');
    }

    // Move birthdayMonth from protectedData to publicData if it exists
    if (existingProtectedData.birthdayMonth && !existingPublicData.birthdayMonth) {
      updatedPublicData.birthdayMonth = existingProtectedData.birthdayMonth;
      delete updatedProtectedData.birthdayMonth;
      hasUpdates = true;
      console.log('📝 [ensurePhoneNumber] Moving birthdayMonth from protectedData to publicData...');
    }
    
    if (hasUpdates) {
      console.log('📝 [ensurePhoneNumber] Updating user profile...');
      
      const updateResponse = await sdk.currentUser.updateProfile({
        protectedData: updatedProtectedData,
        publicData: updatedPublicData
      }, {
        expand: true,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
      });
      
      console.log('✅ [ensurePhoneNumber] Profile updated successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updateResponse.data
      });
    } else {
      console.log('ℹ️ [ensurePhoneNumber] No updates needed');
      
      return res.status(200).json({
        success: true,
        message: 'Profile already up to date',
        data: currentUserResponse.data
      });
    }
    
  } catch (error) {
    console.error('❌ [ensurePhoneNumber] Error:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorCode: error.data?.errors?.[0]?.code,
      errorTitle: error.data?.errors?.[0]?.title,
      errorDetail: error.data?.errors?.[0]?.detail,
      fullError: JSON.stringify(error, null, 2)
    });
    
    handleError(res, error);
  }
}; 