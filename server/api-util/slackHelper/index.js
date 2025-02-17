const { WebClient } = require('@slack/web-api');

const { isValidURL } = require('../urlHelpers');

const getProductListingsCreatedBlocks = require('./productListingsCreatedBlocks');
const getProductListingsErrorBlocks = require('./productListingsErrorBlocks');
const getSellerValidationBlocks = require('./sellerValidationBlocks');
const getUserUpdateWarningBlocks = require('./userUpdateWarningBlocks');
const getProfileListingUpdateErrorBlocks = require('./profileListingUpdateErrorBlocks');
const getPortfolioListingCreatedErrorBlocks = require('./portfolioListingCreatedErrorBlocks');
const getUserCreatedErrorBlocks = require('./userCreatedErrorBlocks');
const getUserUpdatedErrorBlocks = require('./userUpdatedErrorBlocks');

const slackSellerValidationWorkflow = async (userId, displayName, email, portfolioURL) => {
  const slackUserManagerChannelId = process.env.SLACK_USER_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const parsedPortfolioURL = `${isValidURL(portfolioURL) ? '' : 'http://'}${portfolioURL}`;
    const sellerValidationBlocks = getSellerValidationBlocks(
      userId,
      displayName,
      email,
      parsedPortfolioURL
    );
    await webClient.chat.postMessage({
      channel: slackUserManagerChannelId,
      text: 'Starting Seller validation workflow',
      blocks: sellerValidationBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackUserUpdateWarningWorkflow = async (userId, displayName, email, warningMsgs) => {
  const slackUserManagerChannelId = process.env.SLACK_USER_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const userUpdateWarningBlocks = getUserUpdateWarningBlocks(
      userId,
      displayName,
      email,
      warningMsgs
    );
    await webClient.chat.postMessage({
      channel: slackUserManagerChannelId,
      text: 'Starting User Update Warnings workflow',
      blocks: userUpdateWarningBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackProductListingsCreatedWorkflow = async totalListings => {
  const slackListingManagerChannelId = process.env.SLACK_LISTING_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const productListingsCreatedBlocks = getProductListingsCreatedBlocks(totalListings);
    await webClient.chat.postMessage({
      channel: slackListingManagerChannelId,
      text: 'Starting Product Listing Created workflow',
      blocks: productListingsCreatedBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackProductListingsErrorWorkflow = async listings => {
  const slackListingManagerChannelId = process.env.SLACK_LISTING_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const productListingsErrorBlocks = getProductListingsErrorBlocks(listings);
    await webClient.chat.postMessage({
      channel: slackListingManagerChannelId,
      text: 'Starting Product Listing Error workflow',
      blocks: productListingsErrorBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackProfileListingUpdateErrorWorkflow = async userId => {
  const slackUserManagerChannelId = process.env.SLACK_USER_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const profileListingUpdateErrorBlocks = getProfileListingUpdateErrorBlocks(userId);
    await webClient.chat.postMessage({
      channel: slackUserManagerChannelId,
      text: 'Starting Profile Listing Update Error workflow',
      blocks: profileListingUpdateErrorBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackUserCreatedErrorWorkflow = async userId => {
  const slackUserManagerChannelId = process.env.SLACK_USER_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const userCreatedErrorBlocks = getUserCreatedErrorBlocks(userId);
    await webClient.chat.postMessage({
      channel: slackUserManagerChannelId,
      text: 'Starting User Created Error workflow',
      blocks: userCreatedErrorBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slacktUserUpdatedErrorWorkflow = async userId => {
  const slackUserManagerChannelId = process.env.SLACK_USER_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const userUpdatedErrorBlocks = getUserUpdatedErrorBlocks(userId);
    await webClient.chat.postMessage({
      channel: slackUserManagerChannelId,
      text: 'Starting User Updated Error workflow',
      blocks: userUpdatedErrorBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

const slackPortfolioListingCreatedErrorWorkflow = async listingId => {
  const slackListingManagerChannelId = process.env.SLACK_LISTING_MANAGER_CHANNEL_ID;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  try {
    const webClient = new WebClient(slackBotToken);
    const portfolioListingCreatedErrorBlocks = getPortfolioListingCreatedErrorBlocks(listingId);
    await webClient.chat.postMessage({
      channel: slackListingManagerChannelId,
      text: 'Starting Portfolio Listing Created Error workflow',
      blocks: portfolioListingCreatedErrorBlocks,
      unfurl_links: false,
    });
  } catch (error) {
    const metadata = error.data.response_metadata;
    console.warn(`--- error`, error);
    console.warn(`--- metadata`, metadata);
  }
};

module.exports = {
  slackSellerValidationWorkflow,
  slackUserUpdateWarningWorkflow,
  slackProductListingsCreatedWorkflow,
  slackProductListingsErrorWorkflow,
  slackProfileListingUpdateErrorWorkflow,
  slackUserCreatedErrorWorkflow,
  slacktUserUpdatedErrorWorkflow,
  slackPortfolioListingCreatedErrorWorkflow,
};
