const { slackInteractivity } = require('./slackInteractivity');

const VERIFY_ERROR_PREFIX = 'Failed to verify authenticity';

const verifySlackRequest = (req, res) => {
  const slackVerificationToken = process.env.SLACK_BOT_VERIFICATION_TOKEN;
  const reqHeaders = req.headers;
  const requestTimestamp = reqHeaders['x-slack-request-timestamp'];
  const slackSignature = reqHeaders['x-slack-signature'];
  const notifyUserUpdated = 'v0';
  // Rule 1: Check staleness
  const requestTimestampMaxDelta = 5;
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (requestTimestamp < fiveMinutesAgo) {
    throw new Error(
      `${VERIFY_ERROR_PREFIX}: x-slack-request-timestamp must differ from system time by no more than ${requestTimestampMaxDelta} minutes or request is stale`
    );
  }
  // Rule 2: Check signature
  const [signatureVersion] = slackSignature.split('=');
  if (signatureVersion !== notifyUserUpdated) {
    throw new Error(`${VERIFY_ERROR_PREFIX}: unknown signature version`);
  }
  const payload = JSON.parse(req.body.payload);
  const requestToken = payload.token;
  const validSignature = requestToken === slackVerificationToken;
  if (validSignature) {
    return true;
  } else {
    console.debug(`Slack interactivity: Invalid Signature`);
    return res.status(400).send('Verification failed');
  }
};

const verifySlackRequestMiddleware = (req, res, next) => {
  try {
    verifySlackRequest(req, res);
    next();
  } catch (e) {
    console.debug(`Slack interactivity: ${e}`);
    res.status(400).send('Verification failed');
  }
};

module.exports = {
  verifySlackRequestMiddleware,
  slackInteractivity,
};
