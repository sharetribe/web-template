const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackPortfolioListingCreatedErrorWorkflow } = require('../../api-util/slackHelper');

const SCRIPT_NAME = 'notifyPortfolioListingCreated';
const EVENT_TYPES = 'listing/created';
const RESOURCE_TYPE = 'listing';
const QUERY_PARAMS = { expand: true };

function script() {
  const integrationSdk = integrationSdkInit();

  const queryEvents = args => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  function approvePortfolioListing(listingId) {
    return integrationSdk.listings.update(
      { id: listingId, state: 'published' },
      QUERY_PARAMS
    );
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;





    console.warn('\n\n\n*******************************');
    console.warn('\n[notifyPortfolioListingCreated] - isValidEvent:', isValidEvent);





    if (isValidEvent) {
      const { resourceId, resource: listing } = event.attributes;
      const listingId = resourceId.uuid;
      const { listingType } = listing?.attributes?.publicData || {};
      const isValidListingType = listingType === LISTING_TYPES.PORTFOLIO;





      console.warn('\n[notifyPortfolioListingCreated] - listingType:', listingType);
      console.warn('\n[notifyPortfolioListingCreated] - isValidListingType:', isValidListingType);





      try {
        if (isValidListingType) {
          const response = await approvePortfolioListing(listingId);









          console.warn('\n[notifyPortfolioListingCreated] - response:', response);
          console.warn('\n*******************************\n\n\n');







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
