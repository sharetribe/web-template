function getBlocks(totalListings) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `A total of *${totalListings} Product Listings* have been added and are waiting for review.`,
      },
    },
  ];
}

module.exports = getBlocks;
