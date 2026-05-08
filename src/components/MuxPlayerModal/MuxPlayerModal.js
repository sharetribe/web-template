import MuxPlayer from '@mux/mux-player-react';
import { useEffect, useState } from 'react';

// Utils
import { getMuxJwtToken } from '../../util/api';
import { useIntl } from '../../util/reactIntl';

// Shared components
import { IconSpinner, Modal } from '../../components';

// Module CSS
import css from './MuxPlayerModal.module.css';

/**
 * MuxPlayerModal – reusable modal that fetches a signed JWT token for the
 * given Mux playback ID and renders the Mux player inside the modal.
 *
 * Usage:
 *   <MuxPlayerModal
 *     id="mux-player-modal"
 *     playbackId="abc123"
 *     isOpen={isModalOpen}
 *     onClose={() => setIsModalOpen(false)}
 *     onManageDisableScrolling={onManageDisableScrolling}
 *   />
 *
 * @component
 * @param {Object}   props
 * @param {string}   props.id                        - Unique id passed to Modal (required for scroll management)
 * @param {string}   [props.playbackId]              - Mux signed playback ID
 * @param {string}   [props.videoTitle]              - Optional video caption shown below the player
 * @param {boolean}  props.isOpen                    - Whether the modal is visible
 * @param {Function} props.onClose                   - Called when the modal is closed
 * @param {Function} props.onManageDisableScrolling  - Required by Modal to manage body scroll
 * @returns {JSX.Element}
 */
const MuxPlayerModal = props => {
  const {
    id = 'mux-player-modal',
    playbackId,
    videoTitle,
    isOpen,
    onClose,
    onManageDisableScrolling,
  } = props;
  const intl = useIntl();

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch a new JWT token whenever the modal opens with a new playbackId
  useEffect(() => {
    if (!isOpen || !playbackId) {
      // Reset state when closed
      setToken(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setToken(null);
    setError(null);

    getMuxJwtToken({ playbackId })
      .then(data => {
        if (!cancelled) {
          setToken(data.token);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('MuxPlayerModal: failed to fetch JWT token', err);
          setError(intl.formatMessage({ id: 'MuxPlayerModal.tokenError' }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, playbackId]);

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <div className={css.content}>
        {loading ? (
          <div className={css.loading}>
            <IconSpinner />
          </div>
        ) : error ? (
          <p className={css.error}>{error}</p>
        ) : token && playbackId ? (
          <MuxPlayer
            className={css.player}
            playbackId={playbackId}
            tokens={{ playback: token }}
            streamType="on-demand"
            autoPlay={false}
            controls
          />
        ) : null}
        {videoTitle && !loading && !error ? <p className={css.videoCaption}>{videoTitle}</p> : null}
      </div>
    </Modal>
  );
};

export default MuxPlayerModal;
