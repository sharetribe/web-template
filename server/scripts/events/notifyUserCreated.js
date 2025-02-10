const { updateAuth0User } = require('../../api-util/auth0Helper');
const {
  USER_TYPES,
  COMMUNITY_STATUS,
  SELLER_STATUS,
  BRAND_MEMBERSHIP_TYPES,
  SELLER_MEMBERSHIP_TYPES,
} = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackSellerValidationWorkflow } = require('../../api-util/slackHelper');
const { StudioManagerClient: SMClient, STUDIO_USER_TYPE } = require('../../api-util/studioHelper');

const SCRIPT_NAME = 'notifyUserCreated';
const EVENT_TYPES = 'user/created';
const RESOURCE_TYPE = 'user';
const QUERY_PARAMS = { expand: true };

function script() {
  const integrationSdk = integrationSdkInit();

  const queryEvents = args => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  async function addBrandUser(brandAdminId, userId, brandUsers) {
    const parsedBrandUsers = [...new Set([...brandUsers, userId])];
    await integrationSdk.users.updateProfile(
      {
        id: brandAdminId,
        metadata: {
          brandUsers: parsedBrandUsers,
        },
      },
      QUERY_PARAMS
    );
  }

  async function getBrandData(userId, brandStudioId) {
    const response = await integrationSdk.users.query(
      {
        priv_brandStudioId: brandStudioId,
        meta_isBrandAdmin: true,
      },
      QUERY_PARAMS
    );
    const data = response.data.data;
    const brandFound = data.length > 0;
    if (!brandFound) {
      return {
        brandName: '',
        brandWebsite: '',
        aboutUs: '',
        brandIndustry: '',
      };
    }
    const user = data[0];
    const brandAdminId = user.id.uuid;
    const { profile } = user.attributes;
    const { publicData, metadata } = profile;
    const { brandName, brandWebsite, aboutUs, brandIndustry } = publicData;
    const { brandUsers } = metadata;
    await addBrandUser(brandAdminId, userId, brandUsers);
    return {
      brandName,
      brandWebsite,
      aboutUs,
      brandIndustry,
    };
  }

  async function getExtendedData(userId, userAttributes) {
    const { profile, email, identityProviders } = userAttributes;
    const { firstName, lastName } = profile;
    const { userType } = profile.publicData;
    if (userType === USER_TYPES.BRAND) {
      const { brandStudioId } = profile.privateData;
      const { brandName } = profile.publicData;
      const studioManagerClient = new SMClient();
      const studioBrandUser = await studioManagerClient.studioBrandUserInit(brandStudioId, {
        admin: {
          email,
          firstName,
          lastName,
          providerId: identityProviders[0].userId,
          marketId: userId,
          type: STUDIO_USER_TYPE.BRAND,
        },
        companyName: brandName,
      });
      const { communityId, studioId } = studioBrandUser;
      const withBrandStudioId = !!brandStudioId;
      if (!withBrandStudioId) {
        const { brandStudioId: newBrandStudioId } = studioBrandUser;
        return {
          privateData: {
            brandStudioId: newBrandStudioId,
          },
          metadata: {
            brandUsers: [],
            membership: BRAND_MEMBERSHIP_TYPES.BASIC,
            isBrandAdmin: true,
            communityId,
            studioId,
          },
        };
      }
      const brandData = await getBrandData(userId, brandStudioId);
      return {
        publicData: brandData,
        metadata: {
          membership: BRAND_MEMBERSHIP_TYPES.BASIC,
          isBrandAdmin: false,
          communityId,
          studioId,
        },
      };
    } else if (userType === USER_TYPES.SELLER) {
      const appliedAt = new Date();
      return {
        metadata: {
          membership: SELLER_MEMBERSHIP_TYPES.BASIC,
          communityStatus: COMMUNITY_STATUS.APPLIED,
          sellerStatus: SELLER_STATUS.APPLIED,
          appliedAt: appliedAt.toUTCString(),
        },
      };
    }
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;
    if (isValidEvent) {
      const { resourceId, resource: user } = event.attributes;
      const userId = resourceId.uuid;
      const { profile, email, identityProviders } = user.attributes;
      const { displayName, firstName, lastName } = profile;
      const { userType } = profile.publicData;
      if (userType === USER_TYPES.BUYER) {
        return;
      }
      const { metadata, privateData, publicData } = await getExtendedData(userId, user.attributes);
      const { studioId, communityId, sellerStatus, communityStatus } = metadata || {};
      await integrationSdk.users.updateProfile(
        {
          id: userId,
          ...(!!privateData && { privateData }),
          ...(!!publicData && { publicData }),
          metadata,
        },
        QUERY_PARAMS
      );
      await updateAuth0User({
        auth0UserId: identityProviders[0].userId,
        marketId: userId,
        studioId,
        communityId,
        firstName,
        lastName,
        displayName,
        sellerStatus,
        communityStatus,
        userType,
      });
      if (userType === USER_TYPES.SELLER) {
        const { displayName } = profile;
        const { portfolioURL } = profile.publicData;
        await slackSellerValidationWorkflow(userId, displayName, email, portfolioURL);
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
