const fs = require('fs');
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

let INTEGRATION_SDK = null;
let EVENTS_BATCH_SIZE = 10;

async function processInBatches(array, process) {
  const totalEvents = array.length;
  const totalBatches = Math.ceil(totalEvents / EVENTS_BATCH_SIZE);
  for (let i = 0; i < array.length; i += EVENTS_BATCH_SIZE) {
    const batch = array.slice(i, i + EVENTS_BATCH_SIZE);
    const index = `totalEvents: ${totalEvents} | BATCH: ${i / EVENTS_BATCH_SIZE +
      1}/${totalBatches}`;
    await process(batch, index);
    if (i + EVENTS_BATCH_SIZE < array.length) {
      await new Promise(resolve => setTimeout(resolve, EVENTS_BATCH_SIZE));
    }
  }
}

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
    INTEGRATION_SDK = sharetribeIntegrationSdk.createInstance({
      clientId,
      clientSecret,
      // Pass rate limit handlers
      queryLimiter: queryLimiter,
      commandLimiter: commandLimiter,
    });
  }
  return INTEGRATION_SDK;
}

function generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch, analyzeEventGroup) {
  console.log(`Loading event script: ${SCRIPT_NAME}`);
  try {
    const dev = process.env.REACT_APP_ENV === 'development';
    // Start polling from current time on, when there's no stored state
    const startTime = new Date();
    // Polling interval (in ms) when all events have been fetched.
    // PROD: Keeping this at 1 minute or more is a good idea.
    // DEV: We use 10 seconds so that the data is printed without much delay.
    // (1 minutes = 60 seconds) && (1 second = 1000 ms) && (1 minute = 60*1000 ms)

    const msInMinute = 60 * 1000;
    // const pollIdleWait = dev ? 10000 : 5 * msInMinute;
    const pollIdleWait = dev ? 10000 : 3 * msInMinute;

    // Polling interval (in ms) when a full page of events is received and there may be more
    const pollWait = 1 * msInMinute;
    // File to keep state across restarts. Stores the last seen event sequence ID,
    // which allows continuing polling from the correct place
    const stateFile = `server/scripts/events/cache/${SCRIPT_NAME}.state`;

    // IGNORE CACHE ON LOCAL DEVELOPMENT
    const saveLastEventSequenceId = sequenceId => {
      const dev = process.env.REACT_APP_ENV === 'development';
      if (dev) return null;
      try {
        fs.writeFileSync(stateFile, sequenceId.toString());
      } catch (err) {
        throw err;
      }
    };

    // IGNORE CACHE ON LOCAL DEVELOPMENT
    const loadLastEventSequenceId = () => {
      const dev = process.env.REACT_APP_ENV === 'development';
      if (dev) return null;
      try {
        const data = fs.readFileSync(stateFile);
        const parsedValue = parseInt(data, 10);
        return isNaN(parsedValue) ? null : parsedValue;
      } catch (err) {
        return null;
      }
    };

    const pollLoop = sequenceId => {
      const params = sequenceId
        ? { startAfterSequenceId: sequenceId }
        : { createdAtStart: startTime };
      queryEvents(params).then(res => {
        const events = res.data.data;
        const lastEvent = events[events.length - 1];
        const fullPage = events.length === res.data.meta.perPage;
        const delay = fullPage ? pollWait : pollIdleWait;
        const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;
        const withEventGroupHandler = !!analyzeEventGroup;
        if (withEventGroupHandler) {
          analyzeEventGroup(events);
        }
        processInBatches(events, analyzeEventsBatch);
        if (lastEvent) saveLastEventSequenceId(lastEvent.attributes.sequenceId);
        setTimeout(() => {
          pollLoop(lastSequenceId);
        }, delay);
      });
    };

    const lastSequenceId = loadLastEventSequenceId();
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
