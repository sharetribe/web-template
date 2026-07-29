import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';

// Import shared components
import {
  AspectRatioWrapper,
  ImageFromFile,
  ResponsiveImage,
  IconSpinner,
} from '../../../../components';

// Import modules from this directory
import css from './ListingImage.module.css';

// Cross shaped button on the top-right corner of the image thumbnail
const RemoveImageButton = props => {
  const { className, rootClassName, onClick, buttonRef } = props;
  const intl = useIntl();
  const classes = classNames(rootClassName || css.removeImage, className);
  return (
    <button
      className={classes}
      onClick={onClick}
      ref={buttonRef}
      aria-label={intl.formatMessage({ id: 'EditListingPage.screenreader.removeImage' })}
    >
      <svg
        width="10px"
        height="10px"
        viewBox="0 0 10 10"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g strokeWidth="1" fillRule="evenodd">
          <g transform="translate(-821.000000, -311.000000)">
            <g transform="translate(809.000000, 299.000000)">
              <path
                d="M21.5833333,16.5833333 L17.4166667,16.5833333 L17.4166667,12.4170833 C17.4166667,12.1866667 17.2391667,12 17.00875,12 C16.77875,12 16.5920833,12.18625 16.5920833,12.41625 L16.5883333,16.5833333 L12.4166667,16.5833333 C12.18625,16.5833333 12,16.7695833 12,17 C12,17.23 12.18625,17.4166667 12.4166667,17.4166667 L16.5875,17.4166667 L16.5833333,21.5829167 C16.5829167,21.8129167 16.7691667,21.9995833 16.9991667,22 L16.9995833,22 C17.2295833,22 17.41625,21.81375 17.4166667,21.58375 L17.4166667,17.4166667 L21.5833333,17.4166667 C21.8133333,17.4166667 22,17.23 22,17 C22,16.7695833 21.8133333,16.5833333 21.5833333,16.5833333"
                transform="translate(17.000000, 17.000000) rotate(-45.000000) translate(-17.000000, -17.000000) "
              />
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
};

// Up/down arrows shown instead of the drag handle while it (or one of these buttons)
// has focus. Disabled at the array's edges.
const MoveImageButtons = props => {
  const {
    onMoveUp,
    onMoveDown,
    disableMoveUp,
    disableMoveDown,
    upButtonRef,
    downButtonRef,
  } = props;
  return (
    <div>
      <button
        type="button"
        ref={upButtonRef}
        onClick={onMoveUp}
        disabled={disableMoveUp}
        aria-label="Move image up"
      >
        Up
      </button>
      <button
        type="button"
        ref={downButtonRef}
        onClick={onMoveDown}
        disabled={disableMoveDown}
        aria-label="Move image down"
      >
        Down
      </button>
    </div>
  );
};

// Drag handle shown by default
const DragHandleButton = props => {
  const { buttonRef } = props;
  return (
    <button type="button" ref={buttonRef} data-drag-handle aria-label="Drag to reorder">
      Handle
    </button>
  );
};

/**
 * Cropped "thumbnail" of given listing image.
 * The image might be one already uploaded and attached to listing entity
 * or representing local image file (before it's uploaded & attached to listing).
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.image - The image object
 * @param {string} props.savedImageAltText - The saved image alt text
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {number} [props.aspectWidth] - The aspect width
 * @param {number} [props.aspectHeight] - The aspect height
 * @param {string} [props.variantPrefix] - The variant prefix
 * @returns {JSX.Element}
 */
const ListingImage = props => {
  const {
    className,
    image,
    savedImageAltText,
    onRemoveImage,
    onMoveUp,
    onMoveDown,
    disableMoveUp,
    disableMoveDown,
    hideMoveControls,
    pendingFocusDirection,
    onFocusRequestHandled,
    isCoverImage,
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = props;

  // Whether focus is currently somewhere inside this image's control group
  // (handle-or-arrows + remove button). While true, arrows are shown instead
  // of the handle.
  const [isControlsFocused, setIsControlsFocused] = useState(false);
  const handleButtonRef = useRef(null);
  const upButtonRef = useRef(null);
  const downButtonRef = useRef(null);
  const removeButtonRef = useRef(null);

  const handleRemoveClick = e => {
    e.stopPropagation();
    onRemoveImage(image.id);
  };
  const handleMoveUpClick = e => {
    e.stopPropagation();
    onMoveUp();
  };
  const handleMoveDownClick = e => {
    e.stopPropagation();
    onMoveDown();
  };
  const handleControlsFocus = e => {
    // :focus-visible excludes focus from a mouse click/drag, so dragging the
    // handle doesn't swap it for the arrows - only real keyboard nav does.
    if (e.target.matches(':focus-visible')) {
      setIsControlsFocused(true);
    }
  };
  const handleControlsBlur = e => {
    // Only revert to the handle once focus has left the whole control group,
    // not when it just moved from one button to another inside it.
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsControlsFocused(false);
    }
  };

  // When the handle gets focused and swaps for the arrows, move focus onto
  // one of them so keyboard users don't lose focus to the removed handle.
  const wasControlsFocusedRef = useRef(false);
  useEffect(() => {
    const justFocused = isControlsFocused && !wasControlsFocusedRef.current;
    wasControlsFocusedRef.current = isControlsFocused;
    if (justFocused) {
      const nextFocusTarget = !disableMoveUp
        ? upButtonRef.current
        : !disableMoveDown
        ? downButtonRef.current
        : removeButtonRef.current;
      nextFocusTarget?.focus();
    }
  }, [isControlsFocused, disableMoveUp, disableMoveDown]);

  // After this image was moved by an arrow press, land focus back on the
  // pressed direction's button at its new position (falling back to whichever
  // arrow is enabled if that direction is no longer valid there), so repeated
  // presses keep working on the same logical image without re-tabbing.
  useEffect(() => {
    if (!pendingFocusDirection) {
      return;
    }
    if (!isControlsFocused) {
      // Arrows aren't rendered yet; this effect runs again once they are.
      setIsControlsFocused(true);
      return;
    }
    const upTarget = { enabled: !disableMoveUp, ref: upButtonRef };
    const downTarget = { enabled: !disableMoveDown, ref: downButtonRef };
    // Keep focus on the direction just pressed (e.g. stay on "Down" so repeated
    // presses keep working), unless the move puts the image at the list's
    // start/end, where that arrow is now disabled — then move focus to the other arrow.
    const targetsInPriorityOrder =
      pendingFocusDirection === 'up' ? [upTarget, downTarget] : [downTarget, upTarget];

    const focusTarget =
      targetsInPriorityOrder.find(target => target.enabled)?.ref.current ?? removeButtonRef.current;
    focusTarget?.focus();
    onFocusRequestHandled();
  }, [
    pendingFocusDirection,
    isControlsFocused,
    disableMoveUp,
    disableMoveDown,
    onFocusRequestHandled,
  ]);

  const canReorder = onMoveUp && onMoveDown;

  const imageControls =
    hideMoveControls || !canReorder ? (
      <RemoveImageButton onClick={handleRemoveClick} />
    ) : (
      <div onFocus={handleControlsFocus} onBlur={handleControlsBlur}>
        {isControlsFocused ? (
          <MoveImageButtons
            upButtonRef={upButtonRef}
            downButtonRef={downButtonRef}
            onMoveUp={handleMoveUpClick}
            onMoveDown={handleMoveDownClick}
            disableMoveUp={disableMoveUp}
            disableMoveDown={disableMoveDown}
          />
        ) : (
          <DragHandleButton buttonRef={handleButtonRef} />
        )}
        <RemoveImageButton buttonRef={removeButtonRef} onClick={handleRemoveClick} />
      </div>
    );

  // Plain marker for now - Step 9 gives this its final badge styling/placement.
  const coverBadge = isCoverImage ? <span>Cover</span> : null;

  if (image.file && !image.attributes) {
    // While image is uploading we show overlay on top of thumbnail
    const uploadingOverlay = !image.imageId ? (
      <div className={css.thumbnailLoading}>
        <IconSpinner />
      </div>
    ) : null;

    return (
      <ImageFromFile
        id={image.id}
        className={className}
        file={image.file}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      >
        {image.imageId ? imageControls : null}
        {coverBadge}
        {uploadingOverlay}
      </ImageFromFile>
    );
  } else {
    const classes = classNames(css.root, className);

    const variants = image
      ? Object.keys(image?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
      : [];
    const imgForResponsiveImage = image.imageId ? { ...image, id: image.imageId } : image;

    // This is shown when image is uploaded,
    // but the new responsive image is not yet downloaded by the browser.
    // This is absolutely positioned behind the actual image.
    const fallbackWhileDownloading = image.file ? (
      <ImageFromFile
        id={image.id}
        className={css.fallbackWhileDownloading}
        file={image.file}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      >
        <div className={css.thumbnailLoading}>
          <IconSpinner />
        </div>
      </ImageFromFile>
    ) : null;

    return (
      <div className={classes}>
        <div className={css.wrapper}>
          {fallbackWhileDownloading}
          <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
            <ResponsiveImage
              rootClassName={css.rootForImage}
              image={imgForResponsiveImage}
              alt={savedImageAltText}
              variants={variants}
            />
          </AspectRatioWrapper>
          {imageControls}
          {coverBadge}
        </div>
      </div>
    );
  }
};

export default ListingImage;
