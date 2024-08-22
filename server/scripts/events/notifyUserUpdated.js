const { updateAuth0User } = require('../../api-util/auth0Helper')
const { USER_TYPES, MEMBERSHIP_TYPES, COMMUNITY_STATUS, SELLER_STATUS, USER_UPDATE_TYPE, isValidField } = require('../../api-util/metadataHelper')
const { integrationSdkInit, generateScript } = require('../../api-util/scriptManager');
const { slackSellerValidationWorkflow, slackUserUpdateWarningWorkflow } = require('../../api-util/slackHelper')
const { studioBrandUpdate } = require('../../api-util/studioHelper');

const SCRIPT_NAME = 'notifyUserUpdated';
const EVENT_TYPES = 'user/updated'
const RESOURCE_TYPE = 'user'

function script () {
  const integrationSdk = integrationSdkInit();

  const queryEvents = (args) => {
    const filter = { eventTypes: EVENT_TYPES };
    return integrationSdk.events.query(
      {...args, ...filter}
    );
  };

  function profileChangesValidation(userAttributes, previousValues) {
    const { profile } = userAttributes;
    const { communityId, studioId, isBrandAdmin } = profile.metadata || {};
    const { brandStudioId } = profile.privateData || {};
    const {
      profile: previousProfile,
      email: previousEmail,
      identityProviders: previousIdentityProviders
    } = previousValues?.attributes
    const {
      communityId: previousCommunityId,
      studioId: previousStudioId,
      isBrandAdmin: previousIsBrandAdmin,
    } = previousProfile?.metadata || {};
    const { brandStudioId: previousBrandStudioId } = previousProfile?.privateData || {};
    const emailUpdated = !!previousEmail;
    const identityProvidersUpdated = !!previousIdentityProviders;
    const communityIdInit = isValidField(communityId) && (previousCommunityId === null);
    const communityIdUpdated = isValidField(previousCommunityId) || communityIdInit;
    const studioIdInit = isValidField(studioId) && (previousStudioId === null);
    const studioIdUpdated = isValidField(previousStudioId) || studioIdInit;
    const isBrandAdminInit = isValidField(isBrandAdmin) && (previousIsBrandAdmin === null);
    const isBrandAdminUpdated = isValidField(previousIsBrandAdmin) || isBrandAdminInit;
    const brandStudioIdInit = isValidField(brandStudioId) && (previousBrandStudioId === null);
    const brandStudioIdUpdated = isValidField(previousBrandStudioId) || brandStudioIdInit;
    const warnings = [];
    if (emailUpdated) {
      warnings.push(USER_UPDATE_TYPE.PROFILE_EMAIL)
    }
    if (identityProvidersUpdated) {
      warnings.push(USER_UPDATE_TYPE.PROFILE_IDENTITY_PROVIDER)
    }
    if (communityIdUpdated) {
      if (communityIdInit) {
        warnings.push(USER_UPDATE_TYPE.PROFILE_INIT_COMMUNITY_ID)
      } else {
        warnings.push(USER_UPDATE_TYPE.PROFILE_COMMUNITY_ID)
      }
    }
    if (studioIdUpdated) {
      if (studioIdInit) {
        warnings.push(USER_UPDATE_TYPE.PROFILE_INIT_STUDIO_ID)
      } else {
        warnings.push(USER_UPDATE_TYPE.PROFILE_STUDIO_ID)
      }
    }
    if (isBrandAdminUpdated) {
      if (isBrandAdminInit) {
        warnings.push(USER_UPDATE_TYPE.PROFILE_INIT_IS_BRAND_ADMIN)
      } else {
        warnings.push(USER_UPDATE_TYPE.PROFILE_IS_BRAND_ADMIN)
      }
    }
    if (brandStudioIdUpdated) {
      if (brandStudioIdInit) {
        warnings.push(USER_UPDATE_TYPE.PROFILE_INIT_BRAND_STUDIO_ID)
      } else {
        warnings.push(USER_UPDATE_TYPE.PROFILE_BRAND_STUDIO_ID)
      }
    }
    return warnings;
  }

  function userTypeChangesValidation(userAttributes, previousValues) {
    const { profile } = userAttributes;
    const { userType } = profile.publicData;
    const { profile: previousProfile } = previousValues?.attributes
    const { userType: previousUserType } = previousProfile?.publicData || {};
    const userTypeUpdated = isValidField(previousUserType);
    if (userTypeUpdated) {
      const wasBrand = previousUserType === USER_TYPES.BRAND
      const wasBuyer = previousUserType === USER_TYPES.BUYER
      const wasSeller = previousUserType === USER_TYPES.SELLER
      const isBrand = userType === USER_TYPES.BRAND
      const isBuyer = userType === USER_TYPES.BUYER
      const isSeller = userType === USER_TYPES.SELLER
      if (wasBrand) {
        if (isBuyer) {
          return USER_UPDATE_TYPE.USER_TYPE_BRAND_TO_BUYER;
        } else if (isSeller) {
          return USER_UPDATE_TYPE.USER_TYPE_BRAND_TO_SELLER;
        }
      } else if (wasBuyer) {
        if (isBrand) {
          return USER_UPDATE_TYPE.USER_TYPE_BUYER_TO_BRAND;
        } else if (isSeller) {
          return USER_UPDATE_TYPE.USER_TYPE_BUYER_TO_SELLER;
        }
      } else if (wasSeller) {
        if (isBrand) {
          return USER_UPDATE_TYPE.USER_TYPE_SELLER_TO_BRAND;
        } else if (isBuyer) {
          return USER_UPDATE_TYPE.USER_TYPE_SELLER_TO_BUYER;
        }
      }
      return USER_UPDATE_TYPE.USER_TYPE_INVALID_CHANGE;
    }
    return USER_UPDATE_TYPE.NO_CHANGES;
  }

  function communityStatusChangesValidation(userAttributes, previousValues) {
    const { profile } = userAttributes;
    const { communityStatus } = profile.metadata || {};
    const { profile: previousProfile } = previousValues?.attributes
    const { communityStatus: previousCommunityStatus } = previousProfile?.metadata || {};
    const communityStatusInit = isValidField(communityStatus) && (previousCommunityStatus === null);
    const communityStatusUpdated = isValidField(previousCommunityStatus) || communityStatusInit;
    if (communityStatusUpdated) {
      const wasApplied = previousCommunityStatus === COMMUNITY_STATUS.APPLIED
      const wasApproved = previousCommunityStatus === COMMUNITY_STATUS.APPROVED
      const wasWaitlisted = previousCommunityStatus === COMMUNITY_STATUS.WAITLISTED
      const isApplied = communityStatus === COMMUNITY_STATUS.APPLIED
      const isApproved = communityStatus === COMMUNITY_STATUS.APPROVED
      const isWaitlisted = communityStatus === COMMUNITY_STATUS.WAITLISTED
      if (communityStatusInit) {
        if (isApplied) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_INIT_AS_APPLIED;
        } else if (isApproved) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_INIT_AS_APPROVED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_INIT_AS_WAITLISTED;
        }
      }
      if (wasApplied) {
        if (isApproved) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_APPLIED_TO_APPROVED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_APPLIED_TO_WAITLISTED;
        }
      } else if (wasApproved) {
        if (isApplied) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_APPROVED_TO_APPLIED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_APPROVED_TO_WAITLISTED;
        }
      } else if (wasWaitlisted) {
        if (isApplied) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_WAITLISTED_TO_APPLIED;
        } else if (isApproved) {
          return USER_UPDATE_TYPE.COMMUNITY_STATUS_WAITLISTED_TO_APPROVED;
        }
      }
      return USER_UPDATE_TYPE.COMMUNITY_STATUS_INVALID_CHANGE;
    }
    return USER_UPDATE_TYPE.NO_CHANGES;
  }

  function sellerStatusChangesValidation(userAttributes, previousValues) {
    const { profile } = userAttributes
    const { sellerStatus } = profile.metadata || {};
    const { profile: previousProfile } = previousValues?.attributes
    const { sellerStatus: previousSellerStatus } = previousProfile?.metadata || {};
    const sellerStatusInit = isValidField(sellerStatus) && (previousSellerStatus === null);
    const sellerStatusUpdated = isValidField(previousSellerStatus) || sellerStatusInit;
    if (sellerStatusUpdated) {
      const wasApplied = previousSellerStatus === SELLER_STATUS.APPLIED
      const wasApproved = previousSellerStatus === SELLER_STATUS.APPROVED
      const wasWaitlisted = previousSellerStatus === SELLER_STATUS.WAITLISTED
      const isApplied = sellerStatus === SELLER_STATUS.APPLIED
      const isApproved = sellerStatus === SELLER_STATUS.APPROVED
      const isWaitlisted = sellerStatus === SELLER_STATUS.WAITLISTED
      if (sellerStatusInit) {
        if (isApplied) {
          return USER_UPDATE_TYPE.SELLER_STATUS_INIT_AS_APPLIED;
        } else if (isApproved) {
          return USER_UPDATE_TYPE.SELLER_STATUS_INIT_AS_APPROVED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.SELLER_STATUS_INIT_AS_WAITLISTED;
        }
      }
      if (wasApplied) {
        if (isApproved) {
          return USER_UPDATE_TYPE.SELLER_STATUS_APPLIED_TO_APPROVED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.SELLER_STATUS_APPLIED_TO_WAITLISTED;
        }
      } else if (wasApproved) {
        if (isApplied) {
          return USER_UPDATE_TYPE.SELLER_STATUS_APPROVED_TO_APPLIED;
        } else if (isWaitlisted) {
          return USER_UPDATE_TYPE.SELLER_STATUS_APPROVED_TO_WAITLISTED;
        }
      } else if (wasWaitlisted) {
        if (isApplied) {
          return USER_UPDATE_TYPE.SELLER_STATUS_WAITLISTED_TO_APPLIED;
        } else if (isApproved) {
          return USER_UPDATE_TYPE.SELLER_STATUS_WAITLISTED_TO_APPROVED;
        }
      }
      return USER_UPDATE_TYPE.SELLER_STATUS_INVALID_CHANGE;
    }
    return USER_UPDATE_TYPE.NO_CHANGES;
  }

  function shouldDisplayWarning(value) {
    switch (value) {
      // WARNINGS
      case USER_UPDATE_TYPE.PROFILE_EMAIL:
      case USER_UPDATE_TYPE.PROFILE_IDENTITY_PROVIDER:
      case USER_UPDATE_TYPE.PROFILE_COMMUNITY_ID:
      case USER_UPDATE_TYPE.PROFILE_STUDIO_ID:
      case USER_UPDATE_TYPE.PROFILE_IS_BRAND_ADMIN:
      case USER_UPDATE_TYPE.PROFILE_BRAND_STUDIO_ID:
      case USER_UPDATE_TYPE.USER_TYPE_BRAND_TO_BUYER:
      case USER_UPDATE_TYPE.USER_TYPE_BRAND_TO_SELLER:
      case USER_UPDATE_TYPE.USER_TYPE_BUYER_TO_BRAND:
      case USER_UPDATE_TYPE.USER_TYPE_SELLER_TO_BRAND:
      case USER_UPDATE_TYPE.USER_TYPE_SELLER_TO_BUYER:
      case USER_UPDATE_TYPE.USER_TYPE_INVALID_CHANGE:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_APPROVED_TO_APPLIED:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_APPROVED_TO_WAITLISTED:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_WAITLISTED_TO_APPROVED:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_INIT_AS_APPROVED:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_INIT_AS_WAITLISTED:
      case USER_UPDATE_TYPE.COMMUNITY_STATUS_INVALID_CHANGE:
      case USER_UPDATE_TYPE.SELLER_STATUS_APPROVED_TO_APPLIED:
      case USER_UPDATE_TYPE.SELLER_STATUS_APPROVED_TO_WAITLISTED:
      case USER_UPDATE_TYPE.SELLER_STATUS_WAITLISTED_TO_APPROVED:
      case USER_UPDATE_TYPE.SELLER_STATUS_INIT_AS_APPROVED:
      case USER_UPDATE_TYPE.SELLER_STATUS_INIT_AS_WAITLISTED:
      case USER_UPDATE_TYPE.SELLER_STATUS_INVALID_CHANGE:
        return true;
      default:
        return false;
    }
  }

  async function shouldUpdateBrandUsers(userAttributes, previousValues) {
    const { profile } = userAttributes;
    const { userType } = profile.publicData;
    const { isBrandAdmin, brandUsers } = profile.metadata || {};
    const { brandStudioId } = profile.privateData || {};
    const {
      brandName,
      brandWebsite,
      aboutUs,
      brandIndustry,
    } = profile.publicData || {};
    const { profile: previousProfile } = previousValues?.attributes
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
    const brandDataUpdated = aboutUsUpdated || brandNameUpdated || brandWebsiteUpdated || brandIndustryUpdated;
    const isBrand = userType === USER_TYPES.BRAND;
    const shouldUpdate = isBrand && isBrandAdmin && brandDataUpdated;
    const shouldUpdateStudio = isBrand && isBrandAdmin && brandNameUpdated;
    if (shouldUpdate) {
      const brandData = { brandName, brandWebsite, aboutUs, brandIndustry };
      await Promise.all(brandUsers.map(brandUserId => integrationSdk.users.updateProfile({
        id: brandUserId,
        publicData: brandData,
      })));
    }
    if (shouldUpdateStudio) {
      studioBrandUpdate(brandStudioId, brandName)
    }
  }

  async function shouldStartSellerValidationWorkflow(userTypeEvent, sellerStatusEvent, userId, displayName, email, portfolioURL) {
    const buyerAppliedToBeSeller = userTypeEvent === USER_UPDATE_TYPE.USER_TYPE_BUYER_TO_SELLER;
    const waitListedSellerAskedForReview = sellerStatusEvent === USER_UPDATE_TYPE.SELLER_STATUS_WAITLISTED_TO_APPLIED
    if (buyerAppliedToBeSeller) {
      await integrationSdk.users.updateProfile({
        id: userId,
        metadata: {
          membership: MEMBERSHIP_TYPES.BASIC,
          communityStatus: COMMUNITY_STATUS.APPLIED,
          sellerStatus: SELLER_STATUS.APPLIED,
        }
      })
    }
    if (buyerAppliedToBeSeller || waitListedSellerAskedForReview) {
      return await slackSellerValidationWorkflow(userId, displayName, email, portfolioURL)
    }
  }

  async function profileUpgrade(userId, userAttributes, previousValues) {
    const { profile, email } = userAttributes;
    const profileChanges = profileChangesValidation(userAttributes, previousValues);
    const userTypeChanges = userTypeChangesValidation(userAttributes, previousValues);
    const communityStatusChanges = communityStatusChangesValidation(userAttributes, previousValues);
    const sellerStatusChanges = sellerStatusChangesValidation(userAttributes, previousValues);
    const warnings = [
      ...(profileChanges.map((entry) => shouldDisplayWarning(entry) ? entry : undefined).filter(n => n)),
      ...(shouldDisplayWarning(userTypeChanges) ? [userTypeChanges] : []),
      ...(shouldDisplayWarning(communityStatusChanges) ? [communityStatusChanges] : []),
      ...(shouldDisplayWarning(sellerStatusChanges) ? [sellerStatusChanges] : []),
    ]
    const withWarnings = !!warnings.length;
    await shouldUpdateBrandUsers(userAttributes, previousValues);
    if (withWarnings) {
      const { displayName } = profile;
      slackUserUpdateWarningWorkflow(userId, displayName, email, warnings)
    }
    return [
      userTypeChanges,
      sellerStatusChanges
    ]
  }

  const analyzeEvent = async (event) => {
    const { resourceType, eventType } = event.attributes;
    const isValidEvent = resourceType === RESOURCE_TYPE && eventType === EVENT_TYPES
    if (isValidEvent) {
      const {
        resourceId,
        resource: user,
        previousValues,
      } = event.attributes;
      const userId = resourceId.uuid;
      const { profile, email, identityProviders } = user.attributes
      const { displayName, firstName, lastName } = profile;
      const { communityStatus, sellerStatus, membership, studioId, communityId } = profile.metadata || {};
      const { userType } = profile.publicData || {};
      const [userTypeEvent, sellerStatusEvent] = await profileUpgrade(userId, user.attributes, previousValues);
      if (userType === USER_TYPES.SELLER) {
        const { portfolioURL } = profile.publicData;
        await shouldStartSellerValidationWorkflow(userTypeEvent, sellerStatusEvent, userId, displayName, email, portfolioURL);
      }
      await updateAuth0User({
        auth0UserId: identityProviders[0].userId,
        marketId: userId,
        studioId,
        communityId,
        firstName,
        lastName,
        displayName,
        membership,
        sellerStatus,
        communityStatus,
        userType,
      })
    }
  };

  generateScript(SCRIPT_NAME, queryEvents, analyzeEvent);
}

module.exports = script;
