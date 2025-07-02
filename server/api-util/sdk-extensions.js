/**
 * Extends the SDK configuration to include protected data in listings
 * @param {Object} sdk - The SDK instance
 * @returns {Object} - The extended SDK instance with overridden listings.show
 */
const extendSdk = sdk => {
  const originalListingsShow = sdk.listings.show;

  sdk.listings.show = config => {
    // Create extended config with required fields
    const extendedConfig = {
      ...config,
      include: ['author'],
      'fields.user': [
        'profile',
        'profile.protectedData',
        'profile.publicData',
        'email'
      ],
      'fields.profile': ['protectedData', 'publicData']
    };

    console.log('🔧 SDK Extension - Original config:', config);
    console.log('🔧 SDK Extension - Extended config:', extendedConfig);
    
    return originalListingsShow(extendedConfig)
      .then(response => {
        // Log the response data for debugging
        const included = response?.data?.included || [];
        console.log('🔍 Included data:', included.map(e => ({
          type: e.type,
          id: e.id,
          hasProfile: !!e.attributes?.profile,
          hasProtectedData: !!e.attributes?.profile?.protectedData
        })));
        return response;
      });
  };

  return sdk;
};

module.exports = { extendSdk }; 