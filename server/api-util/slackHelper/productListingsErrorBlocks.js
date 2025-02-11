function getBlocks(listings) {
  const totalListings = listings.length;
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *WARNING* :warning:\nA total of *${totalListings} Product Listings* have failed to be uploaded.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*LISTINGS:*\n\`\`\`${listings.join('\n')}\`\`\``,
      },
    },
  ];
}

module.exports = getBlocks;
