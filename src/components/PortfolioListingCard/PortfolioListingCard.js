import React from 'react';
import PropTypes from 'prop-types';

import { ImageCard } from './ImageCard/ImageCard';
import { VideoCard } from './VideoCard/VideoCard';
import { GRID_STYLE_MASONRY, GRID_STYLE_SQUARE } from '../../util/types';

export const PortfolioListingCard = props => {
  const { item, gridLayout } = props;
  const isVideo = item.type === 'video';

  if (isVideo) {
    return <VideoCard item={item} gridLayout={gridLayout} />;
  }

  return <ImageCard item={item} gridLayout={gridLayout} />;
};

PortfolioListingCard.propTypes = {
  className: PropTypes.string,
  gridLayout: PropTypes.oneOf([GRID_STYLE_SQUARE, GRID_STYLE_MASONRY]),
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    startTime: PropTypes.string,
    thumbnailTime: PropTypes.string,
    attributes: PropTypes.object,
  }).isRequired,
};

export default PortfolioListingCard;
