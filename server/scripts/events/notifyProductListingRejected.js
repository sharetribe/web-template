const { trackManagementAPIEvent } = require('../../api-util/analytics');
const { generateScript, integrationSdkInit } = require('../../api-util/scriptManager');
const { LISTING_TYPES } = require('../../api-util/metadataHelper');

const SCRIPT_NAME = 'notifyProductListingRejected';
const EVENT_TYPES = 'listing/deleted';
const RESOURCE_TYPE = 'listing';

function escapeCSV(value) {
  if (value == null) return '';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

function generateCSV(listings) {
  const headers = ['originalFileName', 'title', 'description', 'keywords'];
  const rows = listings.map(listing => {
    const title = escapeCSV(listing.title);
    const description = escapeCSV(listing.description);
    const originalFileName = escapeCSV(listing.publicData?.originalFileName);
    const keywords = escapeCSV(listing.publicData?.keywords);
    return [originalFileName, title, description, keywords].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

async function getAuthor(authorId) {
  const integrationSdk = integrationSdkInit();
  const result = await integrationSdk.users.show({ id: authorId });
  const userAttributes = result?.data?.data?.attributes || {};
  const { email, profile } = userAttributes;
  return { email, ...profile };
}

const filterEvents = event => {
  const { resourceType, eventType, resourceId, previousValues } = event.attributes;
  if (resourceType !== RESOURCE_TYPE || eventType !== EVENT_TYPES) return false;
  const { attributes: listing, relationships } = previousValues;
  const isProductListing = listing?.publicData?.listingType === LISTING_TYPES.PRODUCT;
  if (!isProductListing) {
    return false;
  }
  const authorId = relationships?.author?.data?.id?.uuid;
  const listingId = resourceId?.uuid;
  const isMissingFields = !authorId || !listingId;
  if (isMissingFields) {
    return false;
  }
  return true;
};

function groupEventsByAuthor(events) {
  const filteredEvents = events.filter(filterEvents);
  const grouped = {};
  filteredEvents.forEach(event => {
    const { previousValues } = event.attributes;
    const { attributes: listing, relationships } = previousValues;
    const authorId = relationships?.author?.data?.id?.uuid;
    if (!grouped[authorId]) {
      grouped[authorId] = [];
    }
    grouped[authorId].push(listing);
  });
  return Object.entries(grouped).map(([authorId, listings]) => ({
    authorId,
    listings,
  }));
}

const analyzeListings = listings => {
  const csvContent = generateCSV(listings);
  const rejectedListings = listings.map(listing => ({
    originalFileName: listing.publicData?.originalFileName,
  }));
  return [rejectedListings, csvContent];
};

function script() {
  const queryEvents = args => {
    const integrationSdk = integrationSdkInit();
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  const analyzeEventsBatch = async events => {
    const eventGroups = groupEventsByAuthor(events);
    try {
      for (const eventGroup of eventGroups) {
        const { authorId, listings } = eventGroup;
        const { email } = await getAuthor(authorId);
        const [rejectedListings, csvContent] = analyzeListings(listings);
        const eventUser = { id: authorId, email };
        const eventProperties = {
          rejectedListings,
          attachments: [
            {
              content: Buffer.from(csvContent).toString('base64'),
              filename: 'rejected_listings.csv',
              type: 'text/csv',
              disposition: 'attachment',
            },
          ],
        };
        trackManagementAPIEvent(
          'MARKETPLACE | PRODUCT_LISTING - Rejected/Deleted',
          eventUser,
          eventProperties
        );
      }
      return;
    } catch (error) {
      console.error(
        '[notifyProductListingRejected] - Error sending rejection notification:',
        error
      );
      return;
    }
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch);
}

module.exports = script;
