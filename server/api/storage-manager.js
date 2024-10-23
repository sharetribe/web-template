const axios = require('axios');

const uploadOriginalAsset = async (userId, listingId, tempSslUrl, metadata) => {
  const axiosClient = axios.create({
    baseURL: `${process.env.STORAGE_MANAGER_URL}/api`,
  });

  axiosClient.interceptors.request.use(
    async config => {
      config.headers['x-api-key'] = process.env.STORAGE_MANAGER_API_KEY;
      return config;
    },
    error => Promise.reject(error)
  );

  axiosClient.interceptors.response.use(
    response => response,
    error => {
      return Promise.reject(error);
    }
  );

  return axiosClient.post(`/assets/marketplace/original`, {
    userId,
    listingId,
    tempSslUrl,
    metadata,
  });
};

module.exports = async (req, res) => {
  const { userId, listingId, fileUrl } = req.body;
  try {
    const result = await uploadOriginalAsset(userId, listingId, fileUrl, {});
    res
      .status(200)
      .send(result.data)
      .end();
  } catch (ex) {
    res
      .status(500)
      .send(ex)
      .end();
  }
};
