const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackPortfolioListingUpdatedErrorWorkflow } = require('../../api-util/slackHelper');

const SCRIPT_NAME = 'notifyPortfolioListingUpdated';
const EVENT_TYPES = 'listing/updated';
const RESOURCE_TYPE = 'listing';

function script() {
  const queryEvents = args => {
    const integrationSdk = integrationSdkInit();
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  function approvePortfolioListing(listingId) {
    const integrationSdk = integrationSdkInit();
    return integrationSdk.listings.approve({ id: listingId });
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;
    if (isValidEvent) {
      const { resourceId, resource: listing, previousValues } = event.attributes;
      const listingId = resourceId.uuid;
      const { state } = listing?.attributes || {};
      const { listingType } = listing?.attributes?.publicData || {};
      const isValidListingType = listingType === LISTING_TYPES.PORTFOLIO;
      try {
        const { state: previousState } = previousValues?.attributes || {};
        const stateUpdated = !!previousState;
        const isListingPendingApproval = state === 'pendingApproval';
        const shouldUpdate = isValidListingType && stateUpdated && isListingPendingApproval;
        if (shouldUpdate) {
          await approvePortfolioListing(listingId);
        }
      } catch (error) {
        slackPortfolioListingUpdatedErrorWorkflow(listingId);
        console.error(
          `[notifyPortfolioListingUpdated] Error processing event | listingId: ${listingId} | Error:`,
          error
        );
      }
    }
  };

  const analyzeEventsBatch = async events => {
    for (const event of events) {
      await analyzeEvent(event);
    }
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch);
}

module.exports = script;
