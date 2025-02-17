const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackPortfolioListingCreatedErrorWorkflow } = require('../../api-util/slackHelper');

const SCRIPT_NAME = 'notifyPortfolioListingCreated';
const EVENT_TYPES = 'listing/created';
const RESOURCE_TYPE = 'listing';

function script() {
  const integrationSdk = integrationSdkInit();

  const queryEvents = args => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  function approvePortfolioListing(listingId) {
    return integrationSdk.listings.approve({ id: listingId });
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;
    if (isValidEvent) {
      const { resourceId, resource: listing } = event.attributes;
      const listingId = resourceId.uuid;
      const { listingType } = listing?.attributes?.publicData || {};
      const isValidListingType = listingType === LISTING_TYPES.PORTFOLIO;
      try {
        if (isValidListingType) {
          const response = await approvePortfolioListing(listingId);
        }
      } catch (error) {
        slackPortfolioListingCreatedErrorWorkflow(listingId);
        console.error(
          `[notifyPortfolioListingCreated] Error processing event | listingId: ${listingId} | Error:`,
          error
        );
      }
    }
  };

  const analyzeEventsBatch = async events => {
    await Promise.all(
      events.map(async e => {
        await analyzeEvent(e);
      })
    );
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch);
}

module.exports = script;
