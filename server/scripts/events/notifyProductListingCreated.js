const { generateScript, integrationSdkInit } = require('../../api-util/scriptManager');
const { StorageManagerClient } = require('../../api-util/storageManagerHelper');
const { httpFileUrlToStream } = require('../../api-util/httpHelpers');
const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { slackProductListingsCreatedWorkflow } = require('../../api-util/slackHelper');

const SCRIPT_NAME = 'notifyProductListingCreated';
const EVENT_TYPES = 'listing/created';
const RESOURCE_TYPE = 'listing';

const processEvent = async (integrationSdk, event, storageManagerClient) => {
  const { resourceType, eventType, resourceId, resource } = event.attributes;
  if (resourceType !== RESOURCE_TYPE || eventType !== EVENT_TYPES) return;

  const { attributes: listing, relationships } = resource;
  const userId = relationships?.author?.data?.id?.uuid;
  const listingId = resourceId?.uuid;
  const originalAssetUrl = listing?.privateData?.originalAssetUrl;
  const previewAssetUrl = listing?.privateData?.previewAssetUrl;
  const isProductListing = listing?.publicData?.listingType === LISTING_TYPES.PRODUCT;

  if (!originalAssetUrl || !previewAssetUrl || !userId || !listingId || !isProductListing) return;

  try {
    const originalAssetData = await storageManagerClient.uploadOriginalAsset(
      userId,
      listingId,
      originalAssetUrl
    );
    const imageStream = await httpFileUrlToStream(previewAssetUrl);
    const { data: sdkImage } = await integrationSdk.images.upload({ image: imageStream });
    await integrationSdk.listings.update(
      {
        id: listingId,
        privateData: { originalAssetUrl: originalAssetData.source, previewAssetUrl: null },
        images: [sdkImage.data.id],
      },
      { expand: true, include: ['images'] }
    );
  } catch (error) {
    console.error('Error processing event:', error);
  }
};

const analyzeEventGroup = events => {
  try {
    const parsedEvents = [];
    events.forEach(event => {
      const { resourceType, eventType, resource } = event.attributes;
      if (resourceType !== RESOURCE_TYPE || eventType !== EVENT_TYPES) return;
      const { attributes: listing } = resource;
      const isProductListing = listing?.publicData?.listingType === LISTING_TYPES.PRODUCT;
      if (isProductListing) {
        parsedEvents.push(event);
      }
    });
    const totalListings = parsedEvents.length;
    const withValidEvents = !!totalListings;
    if (withValidEvents) {
      slackProductListingsCreatedWorkflow(totalListings);
    }
  } catch (error) {
    console.error('Error processing events group:', error);
  }
};

function script() {
  const integrationSdk = integrationSdkInit();
  const storageManagerClient = new StorageManagerClient();

  const queryEvents = args => integrationSdk.events.query({ ...args, eventTypes: EVENT_TYPES });
  const analyzeEvent = event => processEvent(integrationSdk, event, storageManagerClient);

  const analyzeEventsBatch = async events => {
    await Promise.all(
      events.map(async (e) => {
        await analyzeEvent(e);
      })
    );
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch, analyzeEventGroup);
}

module.exports = script;
