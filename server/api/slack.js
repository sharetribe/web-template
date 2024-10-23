const { WebClient } = require('@slack/web-api');

const { COMMUNITY_STATUS, SELLER_STATUS, LISTING_TYPES } = require('../api-util/metadataHelper');
const { integrationSdkInit } = require('../api-util/scriptManager');
const { StudioManagerClient: SMClient, STUDIO_USER_TYPE } = require('../api-util/studioHelper');

const SELLER_ACTIONS_BLOCK_ID = 'seller_actions';
const COMMUNITY_ACTIONS_BLOCK_ID = 'community_actions';
const VERIFY_ERROR_PREFIX = 'Failed to verify authenticity';

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
    const reviewedAt = new Date();
    let metadata;
    switch (action) {
      case SLACK_ACTIONS.approveSeller: {
        console.warn(`--- APPROVE SELLER: ${userId}`);
        await integrationSdk.users.updatePermissions({
          id: userId,
          postListings: 'permission/allow',
        });
        const response = await integrationSdk.users.show({ id: userId });
        const user = response.data.data;
        const { profile } = user.attributes;
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
        const profileListing = listingResponse.data.data;
        const profileListingId = profileListing?.id?.uuid;
        metadata = {
          profileListingId,
          sellerStatus: SELLER_STATUS.APPROVED,
          reviewedAt: reviewedAt.toUTCString(),
        };
        break;
      }
      case SLACK_ACTIONS.rejectSeller: {
        console.warn(`--- REJECT SELLER: ${userId}`);
        metadata = { sellerStatus: SELLER_STATUS.WAITLISTED, reviewedAt: reviewedAt.toUTCString() };
        break;
      }
      case SLACK_ACTIONS.approveCommunity: {
        console.warn(`--- APPROVE COMMUNITY: ${userId}`);
        const response = await integrationSdk.users.show({ id: userId });
        const user = response.data.data;
        const { profile, email, identityProviders } = user.attributes;
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
        metadata = {
          ...newCreatorIds,
          communityStatus: COMMUNITY_STATUS.APPROVED,
        };
        break;
      }
      case SLACK_ACTIONS.rejectCommunity: {
        metadata = { communityStatus: COMMUNITY_STATUS.WAITLISTED };
        console.warn(`--- REJECT COMMUNITY: ${userId}`);
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

const verifySlackRequest = (req, res) => {
  const slackVerificationToken = process.env.SLACK_BOT_VERIFICATION_TOKEN;
  const reqHeaders = req.headers;
  const requestTimestamp = reqHeaders['x-slack-request-timestamp'];
  const slackSignature = reqHeaders['x-slack-signature'];
  const notifyUserUpdated = 'v0';
  // Rule 1: Check staleness
  const requestTimestampMaxDelta = 5;
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (requestTimestamp < fiveMinutesAgo) {
    throw new Error(
      `${VERIFY_ERROR_PREFIX}: x-slack-request-timestamp must differ from system time by no more than ${requestTimestampMaxDelta} minutes or request is stale`
    );
  }
  // Rule 2: Check signature
  const [signatureVersion] = slackSignature.split('=');
  if (signatureVersion !== notifyUserUpdated) {
    throw new Error(`${VERIFY_ERROR_PREFIX}: unknown signature version`);
  }
  const payload = JSON.parse(req.body.payload);
  const requestToken = payload.token;
  const validSignature = requestToken === slackVerificationToken;
  if (validSignature) {
    return true;
  } else {
    return res.status(400).send('Verification failed');
  }
};

const verifySlackRequestMiddleware = (req, res, next) => {
  try {
    verifySlackRequest(req, res);
    next();
  } catch (e) {
    console.debug(`Slack interactivity: ${e}`);
    res.status(400).send('Verification failed');
  }
};

module.exports = {
  verifySlackRequestMiddleware,
  slackInteractivity,
};
