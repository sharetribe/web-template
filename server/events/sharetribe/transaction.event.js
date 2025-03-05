const fs = require('fs');
const { getISdk } = require('../../api-util/sdk');
const { Transitions, SharetribeEventsType } = require('../../api-util/enums');
const { ApiError } = require('../../api-util/ApiError');
const { getGoogleAuthToken } = require('../../api-util/userDataExtractor');
const { google } = require('googleapis');
const { PRIMARY } = require('../../api-util/constants');
const { fetchCurrentUser } = require('../../api/google/helpers');

// Start polling from current time on, when there's no stored state
const startTime = new Date();

// File to keep state across restarts. Stores the last seen event sequence ID,
// which allows continuing polling from the correct place
const stateFile = './notify-new-transaction.transition.state';

// Polling interval (in ms) when all events have been fetched. Keeping this at 1
// minute or more is a good idea. In this example we use 10 seconds so that the
// data is printed out without too much delay.
const pollIdleWait = 10000;
// Polling interval (in ms) when a full page of events is received and there may be more
const pollWait = 250;
const { REACT_APP_MARKETPLACE_ROOT_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

// Integration API
const isdk = getISdk();

// oAuth2Client
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${REACT_APP_MARKETPLACE_ROOT_URL}/account/google/auth`
);

const saveLastEventSequenceId = sequenceId => {
  try {
    fs.writeFileSync(stateFile, sequenceId.toString());
  } catch (err) {
    throw err;
  }
};

const loadLastEventSequenceId = () => {
  try {
    const data = fs.readFileSync(stateFile);
    return parseInt(data, 10);
  } catch (err) {
    return null;
  }
};
const { TRANSACTION_TRANSITIONED } = SharetribeEventsType;
const onPollEvents = async event => {
  try {
    const { eventType, source, resourceId, resource: transaction, auditData } = event.attributes;
    const lastTransition = transaction?.attributes?.lastTransition;
    switch (lastTransition) {
      case Transitions.OPERATOR_CANCEL:
        try {
          const { metadata = {} } = transaction?.attributes || {};
          const { googleCalendarEventDetails = {} } = metadata || {};
          const eventId = googleCalendarEventDetails?.eventId;
          const transactionId = transaction?.id;
          const providerId = transaction?.relationships?.provider?.data?.id?.uuid;
          if (eventId) {
            const currentProvider = await fetchCurrentUser(providerId);
            const googleAuthToken = getGoogleAuthToken(currentProvider);
            oAuth2Client.setCredentials(googleAuthToken);
            const calendar = google.calendar({
              version: 'v3',
              auth: oAuth2Client,
            });

            // Delete the event using the eventId
            await calendar.events.delete({
              calendarId: PRIMARY,
              eventId: eventId,
            });
            await isdk.transactions.updateMetadata({
              id: transactionId,
              metadata: {
                googleCalendarEventDetails: null,
              },
            });
          }
          console.log(`Event with ID ${eventId} has been deleted successfully.`);
        } catch (error) {
          throw new ApiError(400, 'Error while deleting event');
        }
        break;

      default:
        return null;
    }
  } catch (error) {
    console.log(error, 'error');
    throw new ApiError(500, 'Internal server error');
  }
};

const pollLoop = async sequenceId => {
  try {
    const params = sequenceId
      ? { startAfterSequenceId: sequenceId }
      : { createdAtStart: startTime };

    const result = await isdk.events.query({
      ...params,
      eventTypes: [TRANSACTION_TRANSITIONED],
    });

    const events = result.data.data;

    const lastEvent = events[events.length - 1];
    const fullPage = events.length === result.data.meta.perPage;
    const delay = fullPage ? pollWait : pollIdleWait;
    const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;
    for (const event of events) {
      await onPollEvents(event);
    }

    if (lastEvent) saveLastEventSequenceId(lastEvent.attributes.sequenceId);

    setTimeout(() => {
      pollLoop(lastSequenceId);
    }, delay);
  } catch (error) {
    console.error(error);
  }
};
const lastSequenceId = loadLastEventSequenceId();
module.exports = { pollTransactionEvents: () => pollLoop(lastSequenceId) };
