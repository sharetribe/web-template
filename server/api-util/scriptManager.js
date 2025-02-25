const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const { StudioManagerClient: SMClient } = require('./studioHelper');

let INTEGRATION_SDK = null;
// (1 minutes = 60 seconds) && (1 second = 1000 ms) && (1 minute = 60*1000 ms)
const MS_IN_MINUTE = 60 * 1000;
const EVENTS_BATCH_SIZE = 10;

function integrationSdkInit() {
  const withExistingIntance = !!INTEGRATION_SDK;
  if (!withExistingIntance) {
    const dev = process.env.REACT_APP_ENV === 'development';
    const clientId = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID;
    const clientSecret = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;
    // Create rate limit handler for queries.
    // NB! If you are using the script in production environment,
    // you will need to use sharetribeIntegrationSdk.util.prodQueryLimiterConfig
    const queryLimiterConfig =
      sharetribeIntegrationSdk.util[dev ? 'devQueryLimiterConfig' : 'prodQueryLimiterConfig'];
    const queryLimiter = sharetribeIntegrationSdk.util.createRateLimiter(queryLimiterConfig);
    // Create rate limit handler for commands.
    // NB! If you are using the script in production environment,
    // you will need to use sharetribeIntegrationSdk.util.prodCommandLimiterConfig
    const commandLimiterConfig =
      sharetribeIntegrationSdk.util[dev ? 'devCommandLimiterConfig' : 'prodCommandLimiterConfig'];
    const commandLimiter = sharetribeIntegrationSdk.util.createRateLimiter(commandLimiterConfig);
    const sdk = sharetribeIntegrationSdk.createInstance({
      clientId,
      clientSecret,
      // Pass rate limit handlers
      queryLimiter: queryLimiter,
      commandLimiter: commandLimiter,
    });
    INTEGRATION_SDK = sdk;
  }
  return INTEGRATION_SDK;
}

async function generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch, analyzeEventGroup) {
  console.log(`Loading event script: ${SCRIPT_NAME}`);
  try {
    const studioManagerClient = new SMClient();
    const dev = process.env.REACT_APP_ENV === 'development';
    // Start polling from current time on, when there's no stored state
    const startTime = new Date();
    // Polling interval (in ms) when all events have been fetched.
    // PROD: Keeping this at 1 minute or more is a good idea.
    // DEV: We use 10 seconds so that the data is printed without much delay.
    const pollIdleWait = dev ? 30000 : 5 * MS_IN_MINUTE;
    // Polling interval (in ms) when a full page of events is received and there may be more
    const pollWait = 1 * MS_IN_MINUTE;
    // Sequence Queue management
    const saveLastEventSequenceId = sequenceId =>
      studioManagerClient.updateScriptSequence(SCRIPT_NAME, { sequenceId });
    const loadLastEventSequenceId = async () => {
      const { sequenceId } = await studioManagerClient.getScriptSequence(SCRIPT_NAME);
      if (sequenceId === 0) return null;
      return sequenceId;
    };

    const pollLoop = async sequenceId => {
      const params = sequenceId
        ? { startAfterSequenceId: sequenceId }
        : { createdAtStart: startTime };
      const res = await queryEvents({ ...params, perPage: EVENTS_BATCH_SIZE });
      const events = res.data.data;
      const withEvents = !!events.length;
      const lastEvent = events[events.length - 1];
      const fullPage = events.length === res.data.meta.perPage;
      const delay = fullPage ? pollWait : pollIdleWait;
      const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;
      if (withEvents) {
        const withEventGroupHandler = !!analyzeEventGroup;
        if (withEventGroupHandler) {
          analyzeEventGroup(events);
        }
        await analyzeEventsBatch(events);
        if (lastEvent) saveLastEventSequenceId(lastEvent.attributes.sequenceId);
      }
      setTimeout(() => {
        pollLoop(lastSequenceId);
      }, delay);
    };
    const lastSequenceId = await loadLastEventSequenceId();
    if (lastSequenceId) {
      console.log(
        `--- ${SCRIPT_NAME}: Resuming event polling from last seen event with sequence ID ${lastSequenceId}`
      );
    } else {
      console.log(`--- ${SCRIPT_NAME}: No state found or failed to load state.`);
      console.log(`--- ${SCRIPT_NAME}: Starting event polling from current time.`);
    }
    pollLoop(lastSequenceId);
  } catch (err) {
    console.error(`SCRIPT ERROR | ${SCRIPT_NAME}: `, err);
  }
}

module.exports = generateScript;

module.exports = {
  integrationSdkInit: integrationSdkInit,
  generateScript: generateScript,
};
