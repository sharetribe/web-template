const axios = require('axios');

const httpFileUrlToStream = async imageUrl => {
  const response = await axios({
    method: 'GET',
    url: imageUrl,
    responseType: 'stream',
    timeout: 30000, // 30 seconds
  });
  return response.data;
};

module.exports = {
  httpFileUrlToStream,
};
