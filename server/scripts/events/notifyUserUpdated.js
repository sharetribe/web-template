const _ = require('lodash');
const { updateAuth0User } = require('../../api-util/auth0Helper');
const {
  USER_TYPES,
  SELLER_MEMBERSHIP_TYPES,
  COMMUNITY_STATUS,
  SELLER_STATUS,
  USER_UPDATE_TYPE,
} = require('../../api-util/metadataHelper');
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const {
  slackSellerValidationWorkflow,
  slackUserUpdateWarningWorkflow,
  slacktUserUpdatedErrorWorkflow,
} = require('../../api-util/slackHelper');
const { StudioManagerClient: SMClient } = require('../../api-util/studioHelper');
const {
  profileChangesValidation,
  userTypeChangesValidation,
  communityStatusChangesValidation,
  sellerStatusChangesValidation,
  shouldDisplayWarning,
} = require('./util/userUpdateValidations');

const SCRIPT_NAME = 'notifyUserUpdated';
const EVENT_TYPES = 'user/updated';
const RESOURCE_TYPE = 'user';
const QUERY_PARAMS = { expand: true };

function script() {
  const integrationSdk = integrationSdkInit();

  const queryEvents = args => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query({ ...args, ...filter });
  };

  async function shouldStartSellerValidationWorkflow(
    userTypeEvent,
    sellerStatusEvent,
    userId,
    displayName,
    email,
    portfolioURL
  ) {
    const buyerAppliedToBeSeller = userTypeEvent === USER_UPDATE_TYPE.USER_TYPE_BUYER_TO_SELLER;
    const waitListedSellerAskedForReview =
      sellerStatusEvent === USER_UPDATE_TYPE.SELLER_STATUS_WAITLISTED_TO_APPLIED;
    if (buyerAppliedToBeSeller) {
      const appliedAt = new Date();
      await integrationSdk.users.updateProfile({
        id: userId,
        metadata: {
          membership: SELLER_MEMBERSHIP_TYPES.BASIC,
          communityStatus: COMMUNITY_STATUS.APPLIED,
          sellerStatus: SELLER_STATUS.APPLIED,
          appliedAt: appliedAt.toUTCString(),
        },
      });
    }
    if (buyerAppliedToBeSeller || waitListedSellerAskedForReview) {
      return await slackSellerValidationWorkflow(userId, displayName, email, portfolioURL);
    }
  }

  async function profileUpgrade(userId, userAttributes, previousValues) {
    const { profile, email } = userAttributes;
    const profileChanges = profileChangesValidation(userAttributes, previousValues);
    const userTypeChanges = userTypeChangesValidation(userAttributes, previousValues);
    const communityStatusChanges = communityStatusChangesValidation(userAttributes, previousValues);
    const sellerStatusChanges = sellerStatusChangesValidation(userAttributes, previousValues);
    const warnings = [
      ...profileChanges
        .map(entry => (shouldDisplayWarning(entry) ? entry : undefined))
        .filter(n => n),
      ...(shouldDisplayWarning(userTypeChanges) ? [userTypeChanges] : []),
      ...(shouldDisplayWarning(communityStatusChanges) ? [communityStatusChanges] : []),
      ...(shouldDisplayWarning(sellerStatusChanges) ? [sellerStatusChanges] : []),
    ];
    const withWarnings = !!warnings.length;
    if (withWarnings) {
      const { displayName } = profile;
      slackUserUpdateWarningWorkflow(userId, displayName, email, warnings);
    }
    return [userTypeChanges, sellerStatusChanges];
  }

  async function shouldUpdateBrandUsers(userAttributes, previousValues) {
    const { profile } = userAttributes;
    const { isBrandAdmin, brandUsers } = profile.metadata || {};
    const { brandStudioId } = profile.privateData || {};
    const { brandName, brandWebsite, aboutUs, brandIndustry, userType } = profile.publicData || {};
    const { profile: previousProfile } = previousValues?.attributes || {};
    const {
      brandName: previousBrandName,
      brandWebsite: previousBrandWebsite,
      aboutUs: previousAboutUs,
      brandIndustry: previousBrandIndustry,
    } = previousProfile?.publicData || {};
    const aboutUsUpdated = !!previousAboutUs;
    const brandNameUpdated = !!previousBrandName;
    const brandWebsiteUpdated = !!previousBrandWebsite;
    const brandIndustryUpdated = !!previousBrandIndustry;
    const brandDataUpdated =
      aboutUsUpdated || brandNameUpdated || brandWebsiteUpdated || brandIndustryUpdated;
    const isBrand = userType === USER_TYPES.BRAND;
    const shouldUpdate = isBrand && isBrandAdmin && brandDataUpdated;
    const shouldUpdateStudio = isBrand && isBrandAdmin && brandNameUpdated;
    if (shouldUpdate) {
      const brandData = { brandName, brandWebsite, aboutUs, brandIndustry };
      await Promise.all(
        brandUsers.map(brandUserId =>
          integrationSdk.users.updateProfile({
            id: brandUserId,
            publicData: brandData,
          })
        )
      );
    }
    if (shouldUpdateStudio) {
      const studioManagerClient = new SMClient();
      await studioManagerClient.studioBrandUpdate(brandStudioId, { companyName: brandName });
    }
  }

  async function getProfileImage(userId, profileImageId) {
    if (!profileImageId) return;
    const result = await integrationSdk.users.show(
      { id: userId, 'fields.image': ['variants.default'], include: ['profileImage'] },
      QUERY_PARAMS
    );
    const includedData = result.data.included;
    const includesProfileImages = !!includedData;
    if (!includesProfileImages) return;
    const profileImage = includedData.find(included => included.id.uuid === profileImageId);
    const withProfileImage = !!profileImage;
    if (!withProfileImage) return;
    const defaultVariant = profileImage?.attributes?.variants?.default?.url;
    if (!defaultVariant) return;
    return defaultVariant;
  }

  async function shouldSyncUserProfile(userId, resource, previousValues) {
    const userAttributes = resource.attributes;
    const userRelationships = resource.relationships;
    const { profile } = userAttributes;
    const { firstName, lastName, metadata } = profile;
    const { studioId } = metadata || {};
    const { profileImage } = userRelationships || {};
    const { profile: previousProfile } = previousValues?.attributes || {};
    const { profileImage: previousProfileImage } = previousValues?.relationships || {};
    const { firstName: previousFirstName, lastName: previousLastName } = previousProfile || {};
    const withStudioAccess = !!studioId;
    const firstNameUpdated = !!previousFirstName;
    const lastNameUpdated = !!previousLastName;
    const profileImageUpdated = !!previousProfileImage;
    const profileUpdated = firstNameUpdated || lastNameUpdated || profileImageUpdated;
    const shouldUpdateStudio = withStudioAccess && profileUpdated;
    if (shouldUpdateStudio) {
      const profileImageId = profileImage?.data?.id?.uuid;
      const studioManagerClient = new SMClient();
      await studioManagerClient.studioUserUpdate(studioId, {
        avatarUri: await getProfileImage(userId, profileImageId),
        firstName,
        lastName,
      });
    }
  }

  async function shouldSyncStudioProfileListing(resource, previousValues) {
    const userAttributes = resource.attributes;
    const { profile } = userAttributes;
    const {
      birthday,
      pronouns,
      mentorship,
      portfolioURL: website,
      instagramHandle,
      linkedinHandle,
      tiktokHandle,
      twitterHandle,
      vimeoHandle,
      youtubeHandle,
    } = profile?.publicData || {};
    const { studioId } = profile.metadata || {};
    const { profile: previousProfile } = previousValues?.attributes || {};
    const {
      birthday: previousBirthday,
      pronouns: previousPronouns,
      mentorship: previousMentorship,
      portfolioURL: previousWebsite,
      instagramHandle: previousInstagramHandle,
      linkedinHandle: previousLinkedinHandle,
      tiktokHandle: previousTiktokHandle,
      twitterHandle: previousTwitterHandle,
      vimeoHandle: previousVimeoHandle,
      youtubeHandle: previousYoutubeHandle,
    } = previousProfile?.publicData || {};
    const birthdayUpdated = !!previousBirthday;
    const pronounsUpdated = !!previousPronouns;
    const mentorshipUpdated = !!previousMentorship;
    const websiteUpdated = !!previousWebsite;
    const instagramHandleUpdated = !!previousInstagramHandle;
    const linkedinHandleUpdated = !!previousLinkedinHandle;
    const tiktokHandleUpdated = !!previousTiktokHandle;
    const twitterHandleUpdated = !!previousTwitterHandle;
    const vimeoHandleUpdated = !!previousVimeoHandle;
    const youtubeHandleUpdated = !!previousYoutubeHandle;
    const profileListingUpdated =
      birthdayUpdated ||
      pronounsUpdated ||
      mentorshipUpdated ||
      websiteUpdated ||
      instagramHandleUpdated ||
      linkedinHandleUpdated ||
      tiktokHandleUpdated ||
      twitterHandleUpdated ||
      vimeoHandleUpdated ||
      youtubeHandleUpdated;
    const withStudioAccess = !!studioId;
    const shouldUpdateStudio = withStudioAccess && profileListingUpdated;
    if (shouldUpdateStudio) {
      const studioManagerClient = new SMClient();
      await studioManagerClient.creatorProfileListingUpdate(studioId, {
        birthday,
        pronouns,
        mentorship: mentorship.map(entry => _.startCase(entry)).join(', '),
        website,
        instagramHandle,
        linkedinHandle,
        tiktokHandle,
        twitterHandle,
        vimeoHandle,
        youtubeHandle,
      });
    }
  }

  async function shouldSyncProfileListing(resource, previousValues) {
    const userAttributes = resource.attributes;
    const { profile } = userAttributes;
    const { userType } = profile.publicData || {};
    if (userType === USER_TYPES.SELLER) {
      const { firstName, lastName, displayName } = profile;
      const { profile: previousProfile } = previousValues?.attributes || {};
      const {
        firstName: previousFirstName,
        lastName: previousLastName,
        displayName: previousDisplayName,
      } = previousProfile || {};
      const { profileListingId } = profile.metadata || {};
      const withProfileListing = !!profileListingId;
      const firstNameUpdated = !!previousFirstName;
      const lastNameUpdated = !!previousLastName;
      const displayNameUpdated = !!previousDisplayName;
      const profileUpdated = firstNameUpdated || lastNameUpdated || displayNameUpdated;
      const shouldUpdateProfileListing = withProfileListing && profileUpdated;
      if (shouldUpdateProfileListing) {
        await integrationSdk.listings.update({
          id: profileListingId,
          title: `${firstName} ${lastName} ${displayName}`,
        });
      }
      await shouldSyncStudioProfileListing(resource, previousValues);
    }
  }

  async function profileSync(userId, resource, previousValues) {
    const userAttributes = resource.attributes;
    const { profile, identityProviders } = userAttributes;
    const { displayName, firstName, lastName } = profile;
    const { communityStatus, sellerStatus, studioId, communityId } = profile.metadata || {};
    const { userType } = profile.publicData || {};
    await shouldUpdateBrandUsers(userAttributes, previousValues);
    await shouldSyncUserProfile(userId, resource, previousValues);
    await shouldSyncProfileListing(resource, previousValues);
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
  }

  const analyzeEvent = async event => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES;
    if (isValidEvent) {
      const { resourceId, resource: user, previousValues } = event.attributes;
      const userId = resourceId.uuid;
      const { profile, email } = user.attributes;
      const { displayName } = profile;
      const { userType } = profile.publicData || {};
      try {
        const [userTypeEvent, sellerStatusEvent] = await profileUpgrade(
          userId,
          user.attributes,
          previousValues
        );
        if (userType === USER_TYPES.SELLER) {
          const { portfolioURL } = profile.publicData;
          await shouldStartSellerValidationWorkflow(
            userTypeEvent,
            sellerStatusEvent,
            userId,
            displayName,
            email,
            portfolioURL
          );
        }
        await profileSync(userId, user, previousValues);
      } catch (error) {
        slacktUserUpdatedErrorWorkflow(userId);
        console.error(
          `[notifyUserUpdated] Error processing event | userId: ${userId} | Error:`,
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
