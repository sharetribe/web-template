const jose = require('jose');
const crypto = require('crypto');
const {
  encryptedJwtPublicKey,
  issuer: issuerConfig,
  audience: audienceConfig,
} = require('../../config/jwt');

const createVerifyFunction = (encryptedSecret) => {
  const publicKeyInSpki = crypto
    .createPublicKey(Buffer.from(encryptedSecret, 'base64').toString('utf-8'))
    .export({ type: 'spki', format: 'pem' });

  return async ({ jwt, issuer, audience }) => {
    const publicKey = await jose.importSPKI(publicKeyInSpki, 'RS256');
    return jose.jwtVerify(jwt, publicKey, {
      issuer: issuer || issuerConfig,
      audience: audience || audienceConfig,
    });
  };
};

module.exports = encryptedJwtPublicKey
  ? createVerifyFunction(encryptedJwtPublicKey)
  : () => {
      console.warn('No encryptedJwtPublicKey found, JWT verify is disabled');
    };
