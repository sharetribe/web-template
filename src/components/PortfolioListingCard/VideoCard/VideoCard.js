import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Modal } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import { AspectRatioWrapperMaybe } from '../../../components';
import { getEmbedUrl, videoURLHandler } from '../../VideoPlayer/VideoPlayer';
import { GRID_STYLE_MASONRY, GRID_STYLE_SQUARE } from '../../../util/types';

import css from './VideoCard.module.css';

export const VideoCard = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const videoRef = useRef(null);

  const { className = null, rootClassName = null, item, gridLayout } = props;
  const classes = classNames(rootClassName || css.root, className);
  const videoUrl = item.url;
  const [isHostedVideo, isStreamingService] = videoURLHandler(videoUrl);
  const isSquareLayout = gridLayout === GRID_STYLE_SQUARE;

  if (isHostedVideo) {
    const timeToSeconds = timeStr => {
      if (!timeStr) return 0;
      const [h, m, s] = timeStr.split(':').map(Number);
      return h * 3600 + m * 60 + s;
    };
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
          <AspectRatioWrapperMaybe
            width={1}
            height={1}
            className={css.videoContainer}
            isSquareLayout={isSquareLayout}
          >
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
          </AspectRatioWrapperMaybe>
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

  if (isStreamingService) {
    const embedUrl = getEmbedUrl(videoUrl);
    return (
      <AspectRatioWrapperMaybe
        width={1}
        height={1}
        className={css.videoContainer}
        isSquareLayout={isSquareLayout}
      >
        <iframe
          className={css.videoContainer}
          src={embedUrl}
          title="Embedded Video Player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </AspectRatioWrapperMaybe>
    );
  }

  return (
    <div className={classNames(classes, css.videoWrapper)}>
      <AspectRatioWrapperMaybe
        width={1}
        height={1}
        className={css.videoContainer}
        isSquareLayout={isSquareLayout}
      >
        <p className={css.unsupportedLabel}>❌ Unsupported video format: {videoUrl}</p>
      </AspectRatioWrapperMaybe>
    </div>
  );
};

VideoCard.propTypes = {
  className: PropTypes.string,
  gridLayout: PropTypes.oneOf([GRID_STYLE_SQUARE, GRID_STYLE_MASONRY]),
  item: PropTypes.shape({
    url: PropTypes.string,
    startTime: PropTypes.string,
    thumbnailTime: PropTypes.string,
  }).isRequired,
};

export default VideoCard;
