import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';

// Import shared components
import { AspectRatioWrapper, IconSpinner } from '../../../../components';

// Import modules from this directory
import ListingImage from './ListingImage';
import css from './EditListingPhotosForm.module.css';

const itemId = item => item?.id;

const buildMuxThumbnailUrl = (playbackId, token) =>
  playbackId && token
    ? `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=crop&token=${token}`
    : null;

/**
 * Sortable media tile for the mixed Media tab.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
const SortableMediaItem = props => {
  const {
    item,
    image,
    intl,
    onRemove,
    onPreviewVideo,
    thumbnailToken,
    thumbnailError,
    aspectWidth,
    aspectHeight,
    variantPrefix,
  } = props;

  const disabled = item.uploading;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId(item),
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classes = classNames(css.mediaTile, {
    [css.mediaTileDragging]: isDragging,
    [css.mediaTileUploading]: item.uploading,
  });

  const sortableProps = disabled
    ? {}
    : {
        ...attributes,
        ...listeners,
      };

  const removeButton = (
    <button
      type="button"
      className={css.mediaRemoveButton}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label={intl.formatMessage({ id: 'EditListingPhotosForm.removeMedia' })}
    >
      X
    </button>
  );

  const imageTile =
    item.type === 'image' && image ? (
      <ListingImage
        image={image}
        className={css.mediaPreview}
        savedImageAltText={intl.formatMessage({ id: 'EditListingPhotosForm.savedImageAltText' })}
        onRemoveImage={onRemove}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
        variantPrefix={variantPrefix}
        hideRemoveButton
      />
    ) : null;

  const imagePlaceholder =
    item.type === 'image' && !image ? (
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
        <div className={css.videoTilePreview}>
          <IconSpinner />
        </div>
      </AspectRatioWrapper>
    ) : null;

  const videoTile =
    item.type === 'video' ? (
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
        <div className={css.videoTilePreview}>
          {item.uploading ? (
            <>
              <IconSpinner />
              <div className={css.videoProgress}>
                <div
                  className={css.videoProgressFill}
                  style={{ width: `${item.progress || 0}%` }}
                />
              </div>
              <span className={css.videoProgressText}>
                {intl.formatMessage(
                  { id: 'EditListingPhotosForm.uploadingVideo' },
                  { progress: item.progress || 0 }
                )}
              </span>
            </>
          ) : (
            <>
              {buildMuxThumbnailUrl(item.playbackId, thumbnailToken) && !thumbnailError ? (
                <img
                  className={css.videoThumbnail}
                  src={buildMuxThumbnailUrl(item.playbackId, thumbnailToken)}
                  alt=""
                />
              ) : null}
              <button
                type="button"
                className={css.videoPlayButton}
                onPointerDown={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation();
                  onPreviewVideo(item.playbackId, item.name);
                }}
                disabled={!item.playbackId}
              >
                Play
              </button>
            </>
          )}
        </div>
      </AspectRatioWrapper>
    ) : null;

  return (
    <div ref={setNodeRef} style={style} className={classes} {...sortableProps}>
      {imageTile}
      {imagePlaceholder}
      {videoTile}
      {removeButton}
    </div>
  );
};

export default SortableMediaItem;
