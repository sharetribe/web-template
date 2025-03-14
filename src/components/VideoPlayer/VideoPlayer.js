import React, { useRef } from 'react';
import { PlayCircleOutlined } from '@ant-design/icons';
import css from './VideoPlayer.module.css';

// List of supported video streaming platforms
const STREAMING_SERVICES = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'];
export function videoURLHandler(src) {
  const isHostedVideo = src.match(/\.(mp4|webm|ogg)$/i);
  const isStreamingService = STREAMING_SERVICES.some(service => src.includes(service));
  return [isHostedVideo, isStreamingService];
}

export function getEmbedUrl(src) {
  let embedUrl = src;
  // Convert known streaming service URLs to embeddable format
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    const videoId = src.split('v=')[1]?.split('&')[0] || src.split('/').pop();
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (src.includes('vimeo.com')) {
    const videoId = src.split('/').pop();
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  } else if (src.includes('dailymotion.com')) {
    const videoId = src.split('/video/')[1]?.split('_')[0];
    embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
  } else if (src.includes('twitch.tv')) {
    const videoId = src.split('/').pop();
    embedUrl = `https://player.twitch.tv/?video=${videoId}&parent=yourdomain.com`;
  }
  return embedUrl;
}

const VideoPlayer = ({ src, previewTime }) => {
  const videoRef = useRef();
  const [played, setPlayed] = React.useState(false);
  const [isHostedVideo, isStreamingService] = videoURLHandler(src);

  if (isHostedVideo) {
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
  }

  if (isStreamingService) {
    const embedUrl = getEmbedUrl(src);
    return (
      <iframe
        className={css.videoContainer}
        src={embedUrl}
        title="Embedded Video Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen={false}
      />
    );
  }

  return (
    <div className={css.videoContainer}>
      <p className={css.unsupportedLabel}>❌ Unsupported video format: {src}</p>
    </div>
  );
};

export default VideoPlayer;
