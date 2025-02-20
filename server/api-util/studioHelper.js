const axios = require('axios');

const BASE_PATH = 'api/v1/management';
const STUDIO_USER_TYPE = {
  CREATOR: 'CREATOR',
  BRAND: 'BRAND',
};

class StudioManagerClient {
  axiosClient = axios.create({
    baseURL: `${process.env.WEBAPI_URL}/${BASE_PATH}`,
    timeout: 45000, // 45 seconds timeout
  });

  constructor() {
    this.axiosClient.interceptors.request.use(
      async config => {
        const apiKey = process.env.STUDIO_MANAGER_API_KEY;
        config.headers.set('x-api-key', apiKey);
        return config;
      },
      error => Promise.reject(error)
    );

    this.axiosClient.interceptors.response.use(
      response => response,
      function(error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('StudioManagerClient Error - data:', error.response.data);
          console.error('StudioManagerClient Error - status:', error.response.status);
          console.error('StudioManagerClient Error - headers:', error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.error('StudioManagerClient Error:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('StudioManagerClient Error:', error.message);
        }
        console.error('StudioManagerClient Error - config:', error.config);
        return { data: {} };
      }
    );
  }

  async addStudioBrand(data) {
    const result = await this.axiosClient.post(`/brand`, data);
    const { brandStudioId, communityId, studioId } = result?.data?.data || {};
    return {
      brandStudioId,
      communityId,
      studioId,
    };
  }

  async addStudioBrandUser(brandStudioId, data) {
    const result = await this.axiosClient.post(`/brand/${brandStudioId}/user`, data);
    const { communityId, studioId } = result?.data?.data || {};
    return {
      communityId,
      studioId,
    };
  }

  async studioBrandUserInit(brandStudioId, data) {
    if (!brandStudioId) {
      return await this.addStudioBrand(data);
    }
    return await this.addStudioBrandUser(brandStudioId, data.admin);
  }

  async studioBrandUpdate(brandId, data) {
    await this.axiosClient.put(`/brand/${brandId}`, data);
    return true;
  }

  async studioUserUpdate(userId, data) {
    await this.axiosClient.put(`/user/${userId}`, data);
    return true;
  }

  async studioCreatorInit(data) {
    const result = await this.axiosClient.post(`/creator`, data);
    const { communityId, studioId } = result?.data?.data || {};
    return {
      communityId,
      studioId,
    };
  }

  async creatorProfileListingUpdate(userId, data) {
    await this.axiosClient.put(`/user/${userId}/creator`, data);
    return true;
  }

  async getScriptSequence(scriptName) {
    const result = await this.axiosClient.get(`/sequence/${scriptName}`);
    const { success, sequenceId } = result?.data || {};
    return { success, sequenceId };
  }
  async updateScriptSequence(scriptName, data) {
    const result = await this.axiosClient.put(`/sequence/${scriptName}`, data);
    const { success, sequenceId } = result?.data || {};
    return { success, sequenceId };
  }
}

module.exports = {
  StudioManagerClient,
  STUDIO_USER_TYPE,
};
