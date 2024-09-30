function getBlocks(userId, displayName, email, warningMsgs) {
  const baseURL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *WARNING* :warning:\nUser *${displayName}* (\`${email}\`) was updated in a dangerous way. Ignore if it was a dev-supervised change.`,
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
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*EVENTS:*\n\`\`\`${warningMsgs.join('\n')}\`\`\``,
      },
    },
  ];
}

module.exports = getBlocks;
