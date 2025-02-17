import React, { useRef } from 'react';
import { PlayCircleOutlined } from '@ant-design/icons';
import css from './VideoPlayer.module.css';

const VideoPlayer = ({ src, previewTime }) => {
  const videoRef = useRef();
  const [played, setPlayed] = React.useState(false);

  const handleClick = () => {
    if (!videoRef.current || played) {
      return;
    }
    const video = videoRef.current;
    video.currentTime = 0;
    video.play();
    setPlayed(true);
  };

  return (
    <div className={css.videoContainer} onClick={handleClick}>
      <video
        className={css.videoPlayer}
        src={`${src}#t=${previewTime}`}
        preload="metadata"
        controls={played}
        ref={videoRef}
      />
      {played ? null : (
        <div className={css.playOverlay}>
          <PlayCircleOutlined className={css.playIcon} />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
