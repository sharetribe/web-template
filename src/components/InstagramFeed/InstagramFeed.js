import React, { useState, useRef, useEffect } from 'react';

import { useIntl } from '../../util/reactIntl';

import css from './InstagramFeed.module.css';

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="3" width="4" height="18" rx="1" />
    <rect x="15" y="3" width="4" height="18" rx="1" />
  </svg>
);

const MuteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const UnmuteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VideoIndicatorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

const formatDate = (ts, intl) => {
  if (!ts) return '';
  try {
    return intl.formatDate(new Date(ts), { month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

const VideoPlayer = ({ src, intl }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className={css.videoWrap}>
      <video ref={videoRef} src={src} className={css.modalVideo} autoPlay muted loop playsInline />
      <div className={css.videoControls}>
        <button
          className={css.controlBtn}
          onClick={toggleMute}
          aria-label={intl.formatMessage({
            id: muted ? 'InstagramFeed.unmute' : 'InstagramFeed.mute',
          })}
        >
          {muted ? <MuteIcon /> : <UnmuteIcon />}
        </button>
        <button
          className={css.controlBtn}
          onClick={togglePlay}
          aria-label={intl.formatMessage({
            id: playing ? 'InstagramFeed.pause' : 'InstagramFeed.play',
          })}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
};

const PostModal = ({ post, profile, onClose, intl }) => {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const isVideo = post.mediaType === 'VIDEO' && post.videoUrl;

  return (
    <div
      className={css.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={intl.formatMessage({ id: 'InstagramFeed.dialogLabel' })}
    >
      <div className={css.modal} onClick={e => e.stopPropagation()}>
        <button
          className={css.closeBtn}
          onClick={onClose}
          aria-label={intl.formatMessage({ id: 'InstagramFeed.closePost' })}
        >
          ✕
        </button>

        <div className={css.modalMedia}>
          {isVideo ? (
            <VideoPlayer src={post.videoUrl} intl={intl} />
          ) : (
            <img
              src={post.mediaUrl}
              alt={
                post.caption.slice(0, 80) || intl.formatMessage({ id: 'InstagramFeed.mediaAlt' })
              }
              className={css.modalImage}
            />
          )}
        </div>

        <div className={css.modalInfo}>
          <div className={css.modalHeader}>
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.username}
                className={css.modalAvatar}
              />
            ) : (
              <InstagramIcon />
            )}
            <a
              href={`https://www.instagram.com/${profile.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={css.modalUsernameLink}
            >
              {profile.username}
            </a>
          </div>
          <p className={css.modalCaption}>{post.caption}</p>
          <div className={css.modalFooter}>
            <span className={css.modalDate}>{formatDate(post.timestamp, intl)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GridItem = ({ post, onClick, intl, index }) => (
  <button
    className={css.gridItem}
    onClick={() => onClick(post)}
    aria-label={intl.formatMessage({ id: 'InstagramFeed.viewPost' }, { index })}
  >
    <img src={post.mediaUrl} alt="" className={css.gridThumb} loading="lazy" />
    {post.mediaType === 'VIDEO' && (
      <span className={css.videoIndicator}>
        <VideoIndicatorIcon />
      </span>
    )}
  </button>
);

const getColumns = () => {
  if (typeof window === 'undefined') return 6;
  const w = window.innerWidth;
  if (w < 550) return 2;
  if (w < 768) return 3;
  if (w < 1024) return 4;
  return 6;
};

const InstagramFeed = ({ profile, posts }) => {
  const intl = useIntl();
  const [activePost, setActivePost] = useState(null);
  const [columns, setColumns] = useState(6);

  useEffect(() => {
    const update = () => setColumns(getColumns());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!posts?.length) return null;

  const visiblePosts = posts.slice(0, columns * 2);

  return (
    <div className={css.root}>
      <div className={css.grid}>
        {visiblePosts.map((post, index) => (
          <GridItem
            key={post.id}
            post={post}
            onClick={setActivePost}
            intl={intl}
            index={index + 1}
          />
        ))}
      </div>
      {activePost && (
        <PostModal
          post={activePost}
          profile={profile}
          intl={intl}
          onClose={() => setActivePost(null)}
        />
      )}
    </div>
  );
};

export default InstagramFeed;
