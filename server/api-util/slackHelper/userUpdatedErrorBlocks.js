function getBlocks(userId) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *WARNING* :warning:\nAn error occurred while trying to *update user* \`${userId}\`.`,
      },
    },
  ];
}

module.exports = getBlocks;
