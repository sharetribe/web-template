const crypto = require('crypto');
module.exports = function cspNonce(req, res, next) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  if (process.env.CSP_DEBUG === '1') console.log('[CSP] nonce first8=', nonce.slice(0,8));
  next();
};