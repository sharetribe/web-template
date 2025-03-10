const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const { StudioManagerClient: SMClient } = require('./studioHelper');

let IDLE_TIMER = null;
let RESTART_COUNTER = 0;
let INTEGRATION_SDK = null;
const EVENTS_BATCH_SIZE = 10;
const MS_IN_MINUTE = 60 * 1000; // (1 minutes = 60 seconds) && (1 second = 1000 ms) && (1 minute = 60*1000 ms)
const POLL_TIMEOUT_LIMIT = 5 * MS_IN_MINUTE; // 5 minutes
const RESTART_COUNTER_TIMEOUT = 15 * MS_IN_MINUTE; // 15 minutes

function clearIdleTimer() {
  if (IDLE_TIMER) {
    clearTimeout(IDLE_TIMER);
    IDLE_TIMER = null;
  }
  RESTART_COUNTER = 0;
}

function idleTimerHandler() {
  if (RESTART_COUNTER > 2) {
    console.error('[idleTimerHandler] - ❌ INTEGRATION-SDK is NOT working');
    integrationSdkInit(true);
    clearIdleTimer();
  } else {
    RESTART_COUNTER++;
    console.error(`[idleTimerHandler] - ⏳ INTEGRATION-SDK failed - ${RESTART_COUNTER}`);
    if (!IDLE_TIMER) {
      IDLE_TIMER = setTimeout(() => {
        console.warn(`[idleTimerHandler] - Back online! Resetting RESTART_COUNTER`);
        clearIdleTimer();
      }, RESTART_COUNTER_TIMEOUT);
    }
  }
}

function integrationSdkInit(force = false) {
  const withExistingIntance = !!INTEGRATION_SDK;
  const shouldInitialize = force || !withExistingIntance;
  if (shouldInitialize) {
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
    const pollIdleWait = 5 * MS_IN_MINUTE;
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
      let lastSequenceId = sequenceId;
      let delay = pollIdleWait;
      const executeWithTimeout = new Promise(async (resolve, reject) => {
        try {
          const params = sequenceId
            ? { startAfterSequenceId: sequenceId }
            : { createdAtStart: startTime };
          const withLogs = SCRIPT_NAME === 'notifyProductListingCreated';
          if (withLogs) {
            console.warn('\n\n\n*******************************');
          }
          const res = await queryEvents({ ...params, perPage: EVENTS_BATCH_SIZE });
          const events = res.data.data;
          const withEvents = !!events.length;
          const lastEvent = events[events.length - 1];
          const fullPage = events.length === res.data.meta.perPage;
          if (withEvents) {
            const batchLastSequenceId = lastEvent.attributes.sequenceId;
            const lastResourceId = lastEvent.attributes.resourceId.uuid;
            console.log(
              `--- [pollLoop] | [${SCRIPT_NAME}] - startAfterSequenceId: ${sequenceId} | batchLastSequenceId: ${batchLastSequenceId} | lastResourceId: ${lastResourceId}`
            );
            if (withLogs) {
              const eventList = events.map(event => {
                const { resourceId } = event.attributes;
                const listingId = resourceId?.uuid;
                return listingId;
              });
              console.warn(
                `--- [pollLoop] | [${SCRIPT_NAME}] - Event IDs: ${eventList.join(', ')}`
              );
            }
            const withEventGroupHandler = !!analyzeEventGroup;
            if (withEventGroupHandler) {
              analyzeEventGroup(events);
            }
            await analyzeEventsBatch(events);
            await saveLastEventSequenceId(batchLastSequenceId);
            lastSequenceId = batchLastSequenceId;
            delay = fullPage ? pollWait : pollIdleWait;
          } else {
            console.log(
              `--- [pollLoop] | [${SCRIPT_NAME}] - startAfterSequenceId: ${sequenceId} | NO NEW EVENTS`
            );
          }
          if (withLogs) {
            console.warn('\n*******************************\n\n\n');
          }
          clearIdleTimer();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      const pollTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: pollLoop took too long')), POLL_TIMEOUT_LIMIT)
      );
      try {
        await Promise.race([executeWithTimeout, pollTimeout]); // Whichever finishes first
      } catch (error) {
        console.log(`--- [pollLoop] | [${SCRIPT_NAME}] - Restarted due to timeout`);
        idleTimerHandler();
        delay = pollWait;
      }
      setTimeout(
        () => {
          pollLoop(lastSequenceId);
        },
        dev ? 30000 : delay
      );
    };

    const lastSequenceId = await loadLastEventSequenceId();
    if (lastSequenceId) {
      console.log(
        `--- [pollLoop] | [${SCRIPT_NAME}] - Resuming event polling from last seen event with sequence ID ${lastSequenceId}`
      );
    } else {
      console.log(`--- [pollLoop] | [${SCRIPT_NAME}] - No state found or failed to load state.`);
      console.log(`--- [pollLoop] | [${SCRIPT_NAME}] - Starting event polling from current time.`);
    }
    pollLoop(lastSequenceId);
  } catch (err) {
    console.error(`SCRIPT ERROR | [${SCRIPT_NAME}]`, err);
  }
}

module.exports = generateScript;

module.exports = {
  integrationSdkInit: integrationSdkInit,
  generateScript: generateScript,
};
