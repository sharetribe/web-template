const jose = require('jose');
const crypto = require('crypto');
const {
  encryptedJwtPrivateKey,
  issuer: issuerConfig,
} = require('../../config/jwt');

const createDecryptFunction = (encryptedSecret) => {
  const privateKeyInPKCS8 = crypto
    .createPrivateKey(Buffer.from(encryptedSecret, 'base64').toString('utf-8'))
    .export({ type: 'pkcs8', format: 'pem' });

  return async ({ jwt, issuer }) => {
    const privateKey = await jose.importPKCS8(privateKeyInPKCS8, 'RS256');
    return jose.jwtDecrypt(jwt, privateKey, {
      issuer: issuer || issuerConfig,
    });
  };
};

module.exports = encryptedJwtPrivateKey
  ? createDecryptFunction(encryptedJwtPrivateKey)
  : () => {
      console.warn('No encryptedJwtPrivateKey found, JWT decrypt is disabled');
    };
