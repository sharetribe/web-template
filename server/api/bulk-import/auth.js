'use strict';

const crypto = require('crypto');
const { getSdk } = require('../../api-util/sdk');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const TOKEN_BYTES = 32;
const tokenStore = new Map();

const parseList = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const getAllowedOperators = () => ({
  emails: new Set(
    parseList(process.env.BULK_IMPORT_OPERATOR_EMAILS).map(email => email.toLowerCase())
  ),
  ids: new Set(parseList(process.env.BULK_IMPORT_OPERATOR_IDS)),
});

const getCurrentUser = async (req, res) => {
  const sdk = getSdk(req, res);
  const response = await sdk.currentUser.show();
  const user = response?.data?.data;
  const userId = user?.id?.uuid;
  const email = user?.attributes?.email;

  if (!userId) {
    const error = new Error('unauthorized');
    error.status = 401;
    throw error;
  }

  return { userId, email };
};

const isAllowedOperator = ({ userId, email }) => {
  const { emails, ids } = getAllowedOperators();

  if (emails.size === 0 && ids.size === 0) {
    return { allowed: false, configured: false };
  }

  const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : null;
  return {
    allowed: ids.has(userId) || (normalizedEmail && emails.has(normalizedEmail)),
    configured: true,
  };
};

const cleanupExpiredTokens = now => {
  for (const [token, record] of tokenStore.entries()) {
    if (record.expiresAt <= now) {
      tokenStore.delete(token);
    }
  }
};

const issueActionToken = userId => {
  const now = Date.now();
  cleanupExpiredTokens(now);

  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  tokenStore.set(token, {
    userId,
    expiresAt: now + TOKEN_TTL_MS,
  });
  return { token, expiresAt: new Date(now + TOKEN_TTL_MS).toISOString() };
};

const validateActionToken = (token, userId) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const record = tokenStore.get(token);
  if (!record) {
    return false;
  }

  if (record.expiresAt <= Date.now()) {
    tokenStore.delete(token);
    return false;
  }

  return record.userId === userId;
};

const requireOperatorSession = async (req, res, next) => {
  let currentUser;
  try {
    currentUser = await getCurrentUser(req, res);
  } catch (err) {
    return res.status(401).json({ error: 'Bulk import requires a signed-in operator session.' });
  }

  const operator = isAllowedOperator(currentUser);
  if (!operator.configured) {
    return res.status(503).json({
      error:
        'Bulk import is not configured (missing BULK_IMPORT_OPERATOR_EMAILS or BULK_IMPORT_OPERATOR_IDS).',
    });
  }
  if (!operator.allowed) {
    return res.status(403).json({ error: 'Current user is not allowed to use bulk import.' });
  }

  req.bulkImportUser = currentUser;
  return next();
};

const requireActionToken = (req, res, next) => {
  const token = req.get('X-Bulk-Import-Token');
  const userId = req.bulkImportUser?.userId;

  if (!validateActionToken(token, userId)) {
    return res.status(401).json({ error: 'Invalid or expired bulk import action token.' });
  }

  return next();
};

const authorizeAction = (req, res) => {
  const { token, expiresAt } = issueActionToken(req.bulkImportUser.userId);
  return res.json({ ok: true, token, expiresAt });
};

module.exports = {
  authorizeAction,
  requireActionToken,
  requireOperatorSession,
  _test: {
    TOKEN_TTL_MS,
    issueActionToken,
    validateActionToken,
    tokenStore,
  },
};
