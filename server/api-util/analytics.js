const Analytics = require('analytics-node');
const { v4: uuidv4 } = require('uuid');

let client;

async function trackEvent(identity, event, properties) {
  if (!client) {
    if (!process.env.SEGMENT_WRITE_KEY) {
      return;
    }
    client = new Analytics(process.env.SEGMENT_WRITE_KEY);
  }
  let trackBody;
  const { userId } = identity;
  if (!!userId) {
    trackBody = { userId, event, properties };
  } else {
    const anonymousId = identity.anonymousId || uuidv4();
    // identify anonymous user first
    await client.identify({
      anonymousId,
      ...(!!properties ? { traits: properties } : {}),
    });
    trackBody = { anonymousId, event, properties };
  }
  return client.track(trackBody);
}

async function identifyUserEvent(user, properties) {
  if (!client) {
    if (!process.env.SEGMENT_WRITE_KEY) {
      return;
    }
    client = new Analytics(process.env.SEGMENT_WRITE_KEY);
  }
  const { id: userId, email } = user;
  const traits = { ...properties, email };
  console.warn('identifyUserEvent fired', { userId, traits });
  return client.identify({ userId, traits });
}

async function trackManagementAPIEvent(event, user, properties = {}) {
  const { id: userId, email } = user;
  const identity = !!userId ? { userId } : { anonymousId: uuidv4() };
  console.warn('trackManagementAPIEvent fired', { event, identity, email });
  return trackEvent(identity, event, { ...properties, email });
}

module.exports = {
  identifyUserEvent,
  trackManagementAPIEvent,
};
