const { generateScript, integrationSdkInit } = require('../../api-util/scriptManager');
const { StorageManagerClient } = require('../../api-util/storageManagerHelper');
const { httpFileUrlToStream } = require('../../api-util/httpHelpers');
const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const {
  slackProductListingsCreatedWorkflow,
  slackProductListingsErrorWorkflow,
  slackProductListingsFieldsErrorWorkflow,
} = require('../../api-util/slackHelper');
const { retryAsync, RETRY_STORAGE_DELAY, RETRY_SDK_DELAY } = require('../../api-util/retryAsync');

const SCRIPT_NAME = 'notifyProductListingCreated';
const EVENT_TYPES = 'listing/created';
const RESOURCE_TYPE = 'listing';
const RETRIES = 3;

const filterEvents = event => {
  const { resourceType, eventType, resourceId, resource } = event.attributes;
  if (resourceType !== RESOURCE_TYPE || eventType !== EVENT_TYPES) return false;
  const { attributes: listing, relationships } = resource;
  const isProductListing = listing?.publicData?.listingType === LISTING_TYPES.PRODUCT;
  if (!isProductListing) {
    return false;
  }
  const authorId = relationships?.author?.data?.id?.uuid;
  const listingId = resourceId?.uuid;
  const tempOriginalAssetUrl =
    listing?.privateData?.tempOriginalAssetUrl || listing?.privateData?.originalAssetUrl;
  const tempPreviewAssetUrl =
    listing?.privateData?.tempPreviewAssetUrl || listing?.privateData?.previewAssetUrl;
  const isMissingFields = !tempOriginalAssetUrl || !tempPreviewAssetUrl || !authorId || !listingId;
  if (isMissingFields) {
    slackProductListingsFieldsErrorWorkflow(resource);
    return false;
  }
  return true;
};

const analyzeEventGroup = events => {
  try {
    const parsedEvents = events.filter(filterEvents);
    const totalListings = parsedEvents.length;
    const withValidEvents = !!totalListings;
    if (withValidEvents) {
      slackProductListingsCreatedWorkflow(totalListings);
    }
  } catch (error) {
    console.error('[analyzeEventGroup] Error processing events group:', error);
  }
};

function scriptHelper() {
  async function getAuthor(authorId) {
    const integrationSdk = integrationSdkInit();
    const result = await integrationSdk.users.show({ id: authorId });
    const { profile } = result?.data?.data?.attributes || {};
    return profile;
  }

  const storageHandler = async events => {
    const storageManagerClient = new StorageManagerClient();
    console.warn('\n\n----------------');
    console.warn(`\n[storageHandler] - START! | Total: ${events.length}`);
    const data = await Promise.all(
      events.map(async event => {
        const { resourceId, resource } = event.attributes;
        const { attributes: listing, relationships } = resource;
        const authorId = relationships?.author?.data?.id?.uuid;
        const author = await getAuthor(authorId);
        const creator = `${author.firstName} ${author.lastName}`;
        const listingId = resourceId?.uuid;
        const tempOriginalAssetUrl =
          listing?.privateData?.tempOriginalAssetUrl || listing?.privateData?.originalAssetUrl;
        return {
          userId: authorId,
          relationId: listingId,
          tempSslUrl: tempOriginalAssetUrl,
          metadata: { creator },
        };
      })
    );
    let results = [];
    for (const product of data) {
      try {
        const originalData = await storageManagerClient.uploadOriginalAsset(product);
        console.warn(
          `\n[storageHandler] - id: ${originalData.id} | source: ${originalData.source}`
        );
        results.push(originalData);
      } catch (error) {
        console.error(
          `[storageHandler] Error storing the original asset: ${product.relationId} | Error:`,
          error
        );
      }
    }
    console.warn(`\n[storageHandler] - resultsLength: ${results.length}`);
    // console.warn('\n[storageHandler] - results:', results);
    return results;
  };

  const analyzeEvent = async (event, originalAssetData) => {
    const integrationSdk = integrationSdkInit();
    const { resourceId, resource } = event.attributes;
    const { attributes: listing } = resource;
    const listingId = resourceId?.uuid;
    const tempPreviewAssetUrl =
      listing?.privateData?.tempPreviewAssetUrl || listing?.privateData?.previewAssetUrl;
    try {
      const imageStream = await httpFileUrlToStream(tempPreviewAssetUrl);
      const promiseFn = async () => {
        const { data: sdkImage } = await integrationSdk.images.upload({ image: imageStream });
        await integrationSdk.listings.update(
          {
            id: listingId,
            privateData: { originalAssetUrl: originalAssetData.source },
            images: [sdkImage.data.id],
          },
          { expand: true, include: ['images'] }
        );
      };
      await retryAsync(promiseFn, RETRIES, RETRY_SDK_DELAY);
      return true;
    } catch (error) {
      console.error(
        `[notifyProductListingCreated] Error processing event | listingId: ${listingId} | Error:`,
        error
      );
      return false;
    }
  };

  const analyzeEventsBatch = async events => {
    let successList = [];
    let failList = [];
    const promiseFn = async () => await storageHandler(events);
    const originalAssets = await retryAsync(promiseFn, RETRIES, RETRY_STORAGE_DELAY);
    console.warn('[analyzeEventsBatch] - Marketplace update START!');
    for (const event of events) {
      const { resourceId } = event.attributes;
      const listingId = resourceId?.uuid;
      const originalAssetData = originalAssets.find(asset => asset.id === listingId);
      if (originalAssetData) {
        const success = await analyzeEvent(event, originalAssetData);
        console.warn(`\n[analyzeEventsBatch] - listingId: ${listingId} | success: ${success}`);
        if (success) {
          successList.push(listingId);
        } else {
          failList.push(listingId);
        }
      } else {
        failList.push(listingId);
      }
    }
    return [successList, failList];
  };
  return analyzeEventsBatch;
}

function script() {
  const eventsBatchManager = scriptHelper();

  const queryEvents = args => {
    const integrationSdk = integrationSdkInit();
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  const analyzeEventsBatch = async events => {
    const parsedEvents = events.filter(filterEvents);
    try {
      const [successList, failList] = await eventsBatchManager(parsedEvents);
      const withErrors = !!failList.length;
      if (withErrors) {
        slackProductListingsErrorWorkflow(failList);
      }
      const totalEvents = events.length;
      const invalidEvents = totalEvents - parsedEvents.length;
      const result = { success: successList.length, fail: failList.length, invalid: invalidEvents };
      return result;
    } catch (error) {
      const failList = parsedEvents.map(event => {
        const { resourceId } = event.attributes;
        const listingId = resourceId?.uuid;
        return listingId;
      });
      slackProductListingsErrorWorkflow(failList);
      console.error(
        `[notifyProductListingCreated] - Error storing the originals: ${failList.join(', ')}`
      );
      return;
    }
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEventsBatch, analyzeEventGroup);
}

module.exports = script;
module.exports.scriptHelper = scriptHelper;
