const { WebClient } = require('@slack/web-api');

const { identifyUserEvent, trackManagementAPIEvent } = require('../../api-util/analytics');
const { COMMUNITY_STATUS, SELLER_STATUS, LISTING_TYPES } = require('../../api-util/metadataHelper');
const { integrationSdkInit } = require('../../api-util/scriptManager');
const { StudioManagerClient: SMClient, STUDIO_USER_TYPE } = require('../../api-util/studioHelper');

const SELLER_ACTIONS_BLOCK_ID = 'seller_actions';
const COMMUNITY_ACTIONS_BLOCK_ID = 'community_actions';

const SLACK_ACTIONS = {
  approveSeller: 'approve_seller',
  rejectSeller: 'reject_seller',
  approveCommunity: 'approve_community',
  rejectCommunity: 'reject_community',
};

const chatUpdate = async (action, channel, ts, blocks) => {
  const isSellerAction =
    action === SLACK_ACTIONS.approveSeller || action === SLACK_ACTIONS.rejectSeller;
  const isCommunityAction =
    action === SLACK_ACTIONS.approveCommunity || action === SLACK_ACTIONS.rejectCommunity;
  const blockId = isSellerAction ? SELLER_ACTIONS_BLOCK_ID : COMMUNITY_ACTIONS_BLOCK_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;

  if (!isSellerAction && !isCommunityAction) return;

  const parsedBLocks = blocks.map(block => {
    const isActionBlock = block.block_id === blockId;
    if (!isActionBlock) return block;
    const isApproveAction =
      action === SLACK_ACTIONS.approveSeller || action === SLACK_ACTIONS.approveCommunity;
    if (isSellerAction) {
      return {
        type: 'section',
        block_id: blockId,
        text: {
          type: 'mrkdwn',
          text: `User has been ${isApproveAction ? 'approved' : 'rejected'} to be a Seller`,
          verbatim: false,
        },
      };
    }
    return {
      type: 'section',
      block_id: blockId,
      text: {
        type: 'mrkdwn',
        text: `User request to become part of the Community has been ${
          isApproveAction ? 'approved' : 'rejected'
        }`,
        verbatim: false,
      },
    };
  });
  const payload = {
    text: 'User action has been processed.',
    blocks: parsedBLocks,
    channel,
    ts,
  };
  const webClient = new WebClient(slackBotToken);
  await webClient.chat.update(payload);
};

async function approveSellerHandler(userId, userAttributes) {
  console.warn(`--- APPROVE SELLER: ${userId}`);
  const integrationSdk = integrationSdkInit();
  const reviewedAt = new Date();
  await integrationSdk.users.updatePermissions({
    id: userId,
    postListings: 'permission/allow',
  });
  const { profile, email } = userAttributes;
  const { creativeSpecialty } = profile.publicData || {};
  const { location } = profile.privateData || {};
  const { firstName, lastName, displayName } = profile;
  const listingResponse = await integrationSdk.listings.create(
    {
      authorId: userId,
      title: `${firstName} ${lastName} ${displayName}`,
      description: '',
      state: 'published',
      geolocation: location?.geolocation,
      publicData: {
        location: {
          address: location?.address,
          building: location?.building,
        },
        listingType: LISTING_TYPES.PROFILE,
        categoryLevel1: 'creatives',
        creativeSpecialty,
        // DEFAULT VALUES
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
      },
    },
    { expand: true }
  );
  const eventUser = { id: userId, email };
  const eventTraits = {
    type: 'CREATOR',
    sellerStatus: SELLER_STATUS.APPROVED,
  };
  identifyUserEvent(eventUser, eventTraits);
  trackManagementAPIEvent('NEW_CREATOR | MARKET_SELLER - Approved', eventUser);
  const profileListing = listingResponse.data.data;
  const profileListingId = profileListing?.id?.uuid;
  const metadata = {
    profileListingId,
    sellerStatus: SELLER_STATUS.APPROVED,
    reviewedAt: reviewedAt.toUTCString(),
  };
  return metadata;
}

async function approveCommunityHandler(userId, userAttributes) {
  console.warn(`--- APPROVE COMMUNITY: ${userId}`);
  const { profile, email, identityProviders } = userAttributes;
  const { creativeSpecialty } = profile.publicData || {};
  const { location } = profile.privateData || {};
  const { firstName, lastName } = profile;
  const studioManagerClient = new SMClient();
  const newCreatorIds = await studioManagerClient.studioCreatorInit({
    attributes: {
      creativeSpecialty: creativeSpecialty.join(', '),
      location: location?.address,
    },
    user: {
      email,
      firstName,
      lastName,
      providerId: identityProviders[0].userId,
      marketId: userId,
      type: STUDIO_USER_TYPE.CREATOR,
    },
  });
  const metadata = {
    ...newCreatorIds,
    communityStatus: COMMUNITY_STATUS.APPROVED,
  };
  return metadata;
}

async function rejectSellerHandler(userId, userAttributes) {
  console.warn(`--- REJECT SELLER: ${userId}`);
  const { email } = userAttributes;
  const eventUser = { id: userId, email };
  const eventTraits = {
    sellerStatus: SELLER_STATUS.WAITLISTED,
  };
  identifyUserEvent(eventUser, eventTraits);
  trackManagementAPIEvent('NEW_CREATOR | MARKET_SELLER - Waitlisted', eventUser);
  const reviewedAt = new Date();
  const metadata = { sellerStatus: SELLER_STATUS.WAITLISTED, reviewedAt: reviewedAt.toUTCString() };
  return metadata;
}

async function rejectCommunityHandler(userId, userAttributes) {
  console.warn(`--- REJECT COMMUNITY: ${userId}`);
  const { email } = userAttributes;
  const eventUser = { id: userId, email };
  const eventTraits = {
    communityStatus: COMMUNITY_STATUS.WAITLISTED,
  };
  identifyUserEvent(eventUser, eventTraits);
  trackManagementAPIEvent('NEW_CREATOR | COMMUNITY - Waitlisted', eventUser);
  const metadata = { communityStatus: COMMUNITY_STATUS.WAITLISTED };
  return metadata;
}

const slackInteractivity = async (req, res) => {
  console.warn('\nStarting slack interactivity service..');
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0].action_id;
  const userId = payload.actions[0].value;
  console.warn(`--- action:`, action);
  console.warn(`--- userId:`, userId);
  try {
    const channel = payload.channel.id;
    const { ts: messageTimestamp, blocks } = payload.message;
    const integrationSdk = integrationSdkInit();
    const response = await integrationSdk.users.show({ id: userId });
    const user = response.data.data;
    const userAttributes = user.attributes;
    const { email } = userAttributes;
    console.warn(`--- email:`, email);
    let metadata;
    switch (action) {
      case SLACK_ACTIONS.approveSeller: {
        metadata = await approveSellerHandler(userId, userAttributes);
        break;
      }
      case SLACK_ACTIONS.rejectSeller: {
        metadata = await rejectSellerHandler(userId, userAttributes);
        break;
      }
      case SLACK_ACTIONS.approveCommunity: {
        metadata = await approveCommunityHandler(userId, userAttributes);
        break;
      }
      case SLACK_ACTIONS.rejectCommunity: {
        metadata = await rejectCommunityHandler(userId, userAttributes);
        break;
      }
      default:
        console.warn(`--- NO ACTION REQUIRED`);
        break;
    }
    const withMetadata = !!metadata;
    if (withMetadata) {
      await integrationSdk.users.updateProfile({
        id: userId,
        metadata,
      });
    }
    await chatUpdate(action, channel, messageTimestamp, blocks);
  } catch (error) {
    const metadata = error?.data?.response_metadata;
    console.warn(`--- error`, error?.data);
    console.warn(`--- metadata`, metadata);
    return res.status(500);
  }
  console.warn('Slack interactivity service DONE\n');
  res.sendStatus(200);
};

module.exports = {
  slackInteractivity,
};
