const axios = require('axios');

const ASSET_UPLOAD_URL = '/assets/marketplace/original';

class StorageManagerClient {
  client = axios.create({
    baseURL: `${process.env.STORAGE_MANAGER_URL}/api`,
    timeout: 180000, // 3 minutes timeout
  });

  constructor() {
    this.client.interceptors.request.use(config => {
      config.headers['x-api-key'] = process.env.STORAGE_MANAGER_API_KEY;
      return config;
    }, Promise.reject);
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
