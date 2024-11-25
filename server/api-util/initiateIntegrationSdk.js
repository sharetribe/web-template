
const initiateIntegrationSdk = async () => {
    const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
    return await flexIntegrationSdk.createInstance({
        clientId: process.env.SHARETRIBE_INTEGRATION_CLIENT_ID,
        clientSecret: process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET
    });
}

module.exports = initiateIntegrationSdk