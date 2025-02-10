const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const ASSET_UPLOAD_URL = '/assets/marketplace/original';

class StorageManagerClient {
  client = axios.create({
    baseURL: `${process.env.STORAGE_MANAGER_URL}/api`,
    timeout: 180000, // 3 minutes timeout
    httpAgent: httpAgent,
    httpsAgent: httpsAgent,
  });

  constructor() {
    this.client.interceptors.request.use(config => {
      config.headers['x-api-key'] = process.env.STORAGE_MANAGER_API_KEY;
      return config;
    }, Promise.reject);
    axiosRetry(this.client, {
      retries: 3, // Retry each request up to 3 times
      retryDelay: (retryCount) => retryCount * 2000, // Exponential backoff (2s, 4s, 6s)
      retryCondition: () => true
    });
  }

  async uploadOriginalAsset(userId, listingId, imageUrl, metadata = {}) {
    try {
      const response = await this.client.post(ASSET_UPLOAD_URL, {
        userId,
        listingId,
        tempSslUrl: imageUrl,
        metadata,
      });
      return response.data;
    } catch (error) {
      const parsedError = error?.response?.data || '';
      console.error('Failed to upload original asset:', parsedError);
      throw error;
    }
  }
}

module.exports = {
  StorageManagerClient,
};
