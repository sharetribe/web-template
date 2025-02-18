function getBlocks(listingId) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *WARNING* :warning:\nAn error occurred while trying to *auto-approve the Portfolio listing* \`${listingId}\`.`,
      },
    },
  ];
}

module.exports = getBlocks;
