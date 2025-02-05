import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Image, Modal } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import imagePlaceholder from '../../assets/image-placeholder.jpg';
import { useConfiguration } from '../../context/configurationContext';
import { AspectRatioWrapper } from '../../components';

import css from './PortfolioListingCard.module.css';

export const PortfolioListingCard = props => {
  const config = useConfiguration();
  const { className = null, rootClassName = null, item, renderSizes = null } = props;
  const classes = classNames(rootClassName || css.root, className);
  const [modalVisible, setModalVisible] = useState(false);
  const videoRef = useRef(null);
  const isVideo = item.type === 'video';
  const timeToSeconds = timeStr => {
    if (!timeStr) return 0;
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  if (isVideo) {
    const videoUrl = item.url;
    const thumbnailTime = timeToSeconds(item.thumbnailTime || '00:00:00');

    const handleCloseModal = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setModalVisible(false);
    };

    return (
      <>
        <div
          className={classNames(classes, css.videoWrapper)}
          onClick={() => setModalVisible(true)}
        >
          <AspectRatioWrapper width={1} height={1} className={css.videoContainer}>
            <video
              className={css.videoThumbnail}
              src={videoUrl}
              muted
              preload="metadata"
              onLoadedMetadata={e => {
                e.target.currentTime = thumbnailTime;
              }}
            />
            {/* Play Button Overlay */}
            <div className={css.playButton}>
              <PlayCircleOutlined className={css.playIcon} />
            </div>
          </AspectRatioWrapper>
        </div>

        <Modal
          open={modalVisible}
          footer={null}
          centered
          onCancel={handleCloseModal}
          className={css.videoModal}
          styles={{ content: { padding: 0 } }}
          width={{
            xs: '90%',
            md: '70%',
            xl: '60%',
          }}
        >
          <video className={css.modalVideo} src={videoUrl} controls autoPlay ref={videoRef} />
        </Modal>
      </>
    );
  }

  // Handle images
  const title = item?.attributes?.title || 'portfolio-image';
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const imageVariants = item?.attributes?.variants || {};
  const variants = Object.keys(imageVariants).filter(k => k.startsWith(variantPrefix));
  const srcSet = variants
    .map(variantName => {
      const variant = imageVariants[variantName];
      return variant ? `${variant.url} ${variant.width}w` : null;
    })
    .filter(Boolean)
    .join(', ');

  return (
    <div className={classes}>
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
        <Image srcSet={srcSet} alt={title} fallback={imagePlaceholder} />
      </AspectRatioWrapper>
    </div>
  );
};

PortfolioListingCard.propTypes = {
  className: PropTypes.string,
  renderSizes: PropTypes.string,
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    startTime: PropTypes.string,
    thumbnailTime: PropTypes.string,
    attributes: PropTypes.object,
  }).isRequired,
};

export default PortfolioListingCard;
