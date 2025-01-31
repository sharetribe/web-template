function getLinksBlock(userId, baseURL, portfolioURL) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "You'll find more details in these links:",
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Profile',
          },
          url: `${baseURL}/u/${userId}`,
          action_id: 'profile_link',
          value: userId,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Portfolio',
          },
          url: portfolioURL,
          action_id: 'portfolio_link',
          value: userId,
        },
      ],
    },
  ];
}

function getApproveAsSellerBlock(userId) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Should the user be accepted as a Seller?',
      },
    },
    {
      type: 'actions',
      block_id: 'seller_actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Approve',
          },
          style: 'primary',
          action_id: 'approve_seller',
          value: userId,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Reject',
          },
          style: 'danger',
          action_id: 'reject_seller',
          value: userId,
        },
      ],
    },
  ];
}

function getApproveAsMembersBlock(userId) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Should the user be invited into the community?',
      },
    },
    {
      type: 'actions',
      block_id: 'community_actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Approve',
          },
          style: 'primary',
          action_id: 'approve_community',
          value: userId,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Reject',
          },
          style: 'danger',
          action_id: 'reject_community',
          value: userId,
        },
      ],
    },
  ];
}

function getBlocks(userId, displayName, email, portfolioURL) {
  const baseURL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `User *${displayName}* (\`${email}\`) just applied to be accepted as a Seller in the marketplace.`,
      },
    },
    ...getLinksBlock(userId, baseURL, portfolioURL),
    ...getApproveAsSellerBlock(userId),
    ...getApproveAsMembersBlock(userId),
  ];
}

module.exports = getBlocks;
