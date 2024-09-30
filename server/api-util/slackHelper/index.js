const { WebClient } = require('@slack/web-api');

const { isValidURL } = require('../urlHelpers');
const getSellerValidationBlocks = require('./sellerValidationBlocks');
const getUserUpdateWarningBlocks = require('./userUpdateWarningBlocks');

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

module.exports = {
  slackSellerValidationWorkflow,
  slackUserUpdateWarningWorkflow,
};
