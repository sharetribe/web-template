const _ = require('lodash');
const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackProfileListingUpdateErrorWorkflow } = require('../../api-util/slackHelper');
const { StudioManagerClient: SMClient } = require('../../api-util/studioHelper');

const SCRIPT_NAME = 'notifyProfileListingUpdated';
const EVENT_TYPES = 'listing/updated';
const RESOURCE_TYPE = 'listing';
const QUERY_PARAMS = { expand: true };

function script() {
  const queryEvents = args => {
    const integrationSdk = integrationSdkInit();
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  async function getAuthor(userId) {
    const integrationSdk = integrationSdkInit();
    const result = await integrationSdk.users.show({ id: userId }, QUERY_PARAMS);
    const { profile } = result?.data?.data?.attributes || {};
    const { studioId, profileListingId } = profile?.metadata || {};
    return { studioId, profileListingId };
  }

  async function profileListingSync(listingId, authorId, listing, previousValues) {
    const { creativeSpecialty = [], genres = [], skills = [], location } =
      listing.attributes.publicData || {};
    const {
      creativeSpecialty: previousCreativeSpecialty,
      genres: previousGenres,
      location: previousLocation,
      skills: previousSkills,
    } = previousValues?.attributes?.publicData || {};
    const creativeSpecialtyUpdated = !!previousCreativeSpecialty;
    const genresUpdated = !!previousGenres;
    const locationUpdated = !!previousLocation;
    const skillsUpdated = !!previousSkills;
    const profileListingUpdated =
      creativeSpecialtyUpdated || genresUpdated || locationUpdated || skillsUpdated;
    if (profileListingUpdated) {
      const { studioId, profileListingId } = await getAuthor(authorId);
      const validListing = profileListingId === listingId;
      if (validListing) {
        const studioManagerClient = new SMClient();
        await studioManagerClient.creatorProfileListingUpdate(studioId, {
          creativeSpecialty: creativeSpecialty.map(entry => _.startCase(entry)).join(', '),
          genres: genres.map(entry => _.startCase(entry)).join(', '),
          skills: skills.map(entry => _.startCase(entry)).join(', '),
          location: location?.address,
        });
      }
    }
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;
    if (isValidEvent) {
      console.warn('\n\n----------------');
      console.warn('\n[notifyProfileListingUpdated] - START!');

      const { resourceId, resource: listing, previousValues } = event.attributes;
      const listingId = resourceId.uuid;
      const author = listing?.relationships?.author?.data;
      const authorId = author?.id?.uuid;
      const { listingType } = listing?.attributes?.publicData || {};
      const isValidListingType = listingType === LISTING_TYPES.PROFILE;
      try {
        if (isValidListingType) {
          await profileListingSync(listingId, authorId, listing, previousValues);
        }
      } catch (error) {
        slackProfileListingUpdateErrorWorkflow(authorId);
        console.error(
          `[notifyProfileListingUpdated] Error processing event | authorId: ${authorId} | listingId: ${listingId} | Error:`,
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
