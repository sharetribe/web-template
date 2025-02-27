function getBlocks(resource) {
  const { attributes: listing, relationships, id: resourceId } = resource;
  const authorId = relationships?.author?.data?.id?.uuid;
  const listingId = resourceId?.uuid;
  const tempOriginalAssetUrl =
    listing?.privateData?.tempOriginalAssetUrl || listing?.privateData?.originalAssetUrl;
  const tempPreviewAssetUrl =
    listing?.privateData?.tempPreviewAssetUrl || listing?.privateData?.previewAssetUrl;
  const missingFields = [
    ...(authorId ? [] : ['authorId']),
    ...(tempOriginalAssetUrl ? [] : ['tempOriginalAssetUrl']),
    ...(tempPreviewAssetUrl ? [] : ['tempPreviewAssetUrl']),
  ];
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *WARNING* :warning:\nThe Product Listing \`${listingId}\` have failed to be *UPLOADED* because is missing some needed field.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*FIELDS:*\n\`\`\`${missingFields.join('\n')}\`\`\``,
      },
    },
  ];
}

module.exports = getBlocks;
