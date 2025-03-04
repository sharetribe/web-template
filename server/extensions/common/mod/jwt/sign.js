const Ajv = require('ajv');
const jose = require('jose');
const crypto = require('crypto');
const {
  encryptedJwtPrivateKey,
  issuer: issuerConfig,
  audience: audienceConfig,
  expireTime: expireTimeConfig,
} = require('../../config/jwt');
const jwtPayloadSchema = require('../../schemas/jwtPayloadSchema');

const ajv = new Ajv();

const createSignFunction = (encryptedSecret) => {
  const privateKeyInPKCS8 = crypto
    .createPrivateKey(Buffer.from(encryptedSecret, 'base64').toString('utf-8'))
    .export({ type: 'pkcs8', format: 'pem' });
  const validatePayload = ajv.compile(jwtPayloadSchema);
  return async ({ payload, issuer, audience, expire }) => {
    const payloadCheckingResult = validatePayload(payload);
    if (!payloadCheckingResult) {
      console.error('Error in encryptedJwtPrivateKey', validatePayload.errors);
      return null;
    }
    const privateKey = await jose.importPKCS8(privateKeyInPKCS8, 'RS256');
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer(issuer || issuerConfig)
      .setAudience(audience || audienceConfig)
      .setExpirationTime(expire || expireTimeConfig)
      .sign(privateKey);
  };
};

module.exports = encryptedJwtPrivateKey
  ? createSignFunction(encryptedJwtPrivateKey)
  : () => {
      console.warn('No encryptedJwtPrivateKey found, JWT signing is disabled');
    };
