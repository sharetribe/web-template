const _ = require('lodash');
const { LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { StudioManagerClient: SMClient } = require('../../api-util/studioHelper');

const SCRIPT_NAME = 'notifyProfileListingUpdated';
const EVENT_TYPES = 'listing/updated';
const RESOURCE_TYPE = 'listing';
const QUERY_PARAMS = { expand: true };

function script() {
  const integrationSdk = integrationSdkInit();

  const queryEvents = args => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  async function getAuthor(userId) {
    const result = await integrationSdk.users.show({ id: userId }, QUERY_PARAMS);
    const { profile } = result?.data?.data?.attributes || {};
    const { studioId, profileListingId } = profile?.metadata || {};
    return { studioId, profileListingId };
  }

  async function profileListingSync(listingId, authorId, listing, previousValues) {
    const { creativeSpecialty, genres, location, skills } = listing.attributes.publicData || {};
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
      const { resourceId, resource: listing, previousValues } = event.attributes;
      const listingId = resourceId.uuid;
      const author = listing?.relationships?.author?.data;
      const authorId = author?.id?.uuid;
      const { listingType } = listing?.attributes?.publicData || {};
      const isValidListingType = listingType === LISTING_TYPES.PROFILE;
      if (isValidListingType) {
        await profileListingSync(listingId, authorId, listing, previousValues);
      }
    }
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEvent);
}

module.exports = script;
