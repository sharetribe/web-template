const axios = require('axios');

const httpFileUrlToStream = async imageUrl => {
  const response = await axios({
    method: 'GET',
    url: imageUrl,
    responseType: 'stream',
    timeout: 60000,
  });
  return response.data;
};

module.exports = {
  httpFileUrlToStream,
};
