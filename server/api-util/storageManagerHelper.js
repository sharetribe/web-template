const axios = require('axios');

const ASSET_UPLOAD_URL = '/assets/marketplace/original';

class StorageManagerClient {
  client = axios.create({
    baseURL: `${process.env.STORAGE_MANAGER_URL}/api`,
    timeout: 45000, // 45 seconds timeout
  });

  constructor() {
    this.client.interceptors.request.use(config => {
      config.headers['x-api-key'] = process.env.STORAGE_MANAGER_API_KEY;
      return config;
    }, Promise.reject);
  }

  async uploadOriginalAssets(data) {
    try {
      const response = await this.client.post(ASSET_UPLOAD_URL, { data });
      return response.data;
    } catch (error) {
      const parsedError = error?.response?.data || '';
      console.error(
        `[StorageManagerClient] | Failed to upload original asset | Error : ${parsedError}`
      );
      throw error;
    }
  }
}

module.exports = {
  StorageManagerClient,
};
