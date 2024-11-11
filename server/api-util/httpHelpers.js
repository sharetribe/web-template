const https = require('node:https');

const httpFileUrlToStream = url => {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to get image. Status code: ${res.statusCode}`));
        }
        resolve(res); // `res` is the readable stream here
      })
      .on('error', reject);
  });
};

module.exports = {
  httpFileUrlToStream,
};
