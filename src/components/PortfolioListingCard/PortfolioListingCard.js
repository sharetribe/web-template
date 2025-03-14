import React from 'react';
import PropTypes from 'prop-types';

import { ImageCard } from './ImageCard/ImageCard';
import { VideoCard } from './VideoCard/VideoCard';

export const PortfolioListingCard = props => {
  const { item } = props;
  const isVideo = item.type === 'video';

  if (isVideo) {
    return <VideoCard item={item} />;
  }

  return <ImageCard item={item} />;
};

PortfolioListingCard.propTypes = {
  className: PropTypes.string,
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    startTime: PropTypes.string,
    thumbnailTime: PropTypes.string,
    attributes: PropTypes.object,
  }).isRequired,
};

export default PortfolioListingCard;
