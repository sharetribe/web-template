import React, { useRef, useState } from 'react';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

import ListingImage from '../EditListingPhotosPanel/ListingImage';

import css from './PhotoGallerySection.module.css';

const MAX_IMAGES = 10;

const imageKey = img => img.id?.uuid || img.id;

const SortableImageItem = props => {
  const {
    image,
    index,
    savedImageAltText,
    onRemoveImage,
    aspectWidth,
    aspectHeight,
    variantPrefix,
  } = props;

  const id = imageKey(image);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 'auto',
    position: 'relative',
  };

  const labelKey = index < 4 ? `EditListingDetailsPanel.photoLabel${index + 1}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${css.imageWrapper} ${css.sortableItem}`}
      {...attributes}
      {...listeners}
    >
      <ListingImage
        image={image}
        savedImageAltText={savedImageAltText}
        onRemoveImage={onRemoveImage}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
        variantPrefix={variantPrefix}
      />
      {labelKey && (
        <span className={css.imageLabel}>
          <FormattedMessage id={labelKey} />
        </span>
      )}
    </div>
  );
};

/**
 * Free-form photo gallery section for the Details panel.
 * Renders current images as thumbnails with remove buttons,
 * plus an "Add" button. Supports drag-to-reorder via @dnd-kit.
 *
 * @param {Object} props
 * @param {Array} props.images - Renderable image objects from Redux
 * @param {Function} props.onImageUpload - (data, listingImageConfig) => void
 * @param {Function} props.onRemoveImage - (imageId) => void
 * @param {Function} props.onReorderImages - (reorderedImages) => void
 * @param {Object|null} props.uploadImageError - API error from last upload attempt
 * @param {Object} props.listingImageConfig - { aspectWidth, aspectHeight, variantPrefix }
 * @param {string|null} props.photoError - intl key for validation error set by panel
 */
const PhotoGallerySection = props => {
  const {
    images = [],
    onImageUpload,
    onRemoveImage,
    onReorderImages,
    uploadImageError,
    listingImageConfig,
    photoError,
  } = props;

  const intl = useIntl();
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    listingImageConfig || {};

  const isMaxReached = images.length >= MAX_IMAGES;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const imageIds = images.map(imageKey);

  const handleSortEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = imageIds.indexOf(active.id);
    const newIndex = imageIds.indexOf(over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderImages(arrayMove(images, oldIndex, newIndex));
    }
  };

  const uploadFiles = files => {
    if (isMaxReached) return;
    const ts = Date.now();
    Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .reduce((chain, file, index) => {
        return chain.then(() =>
          Promise.resolve(
            onImageUpload({ id: `${file.name}_${ts}_${index}`, file }, listingImageConfig)
          ).catch(() => {})
        );
      }, Promise.resolve());
  };

  const handleFileChange = e => {
    uploadFiles(e.target.files || []);
    e.target.value = '';
  };

  const handleDragEnter = e => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = e => {
    e.preventDefault();
  };

  const handleDrop = e => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const savedImageAltText = intl.formatMessage({
    id: 'EditListingPhotosForm.savedImageAltText',
  });

  const rootClass = isDragging && !isMaxReached ? `${css.root} ${css.rootDragActive}` : css.root;

  return (
    <div
      className={rootClass}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className={css.title}>
        <FormattedMessage id="EditListingDetailsPanel.photosTitle" />
      </h3>

      <p className={css.photosTip}>
        <FormattedMessage
          id="EditListingDetailsPanel.photosTipText"
          values={{
            link: (
              <a
                href="/static/files/HowTo-AV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={css.photosTipLink}
              >
                <FormattedMessage id="EditListingDetailsPanel.photosTipLinkText" />
              </a>
            ),
          }}
        />
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
        <SortableContext items={imageIds} strategy={rectSortingStrategy}>
          <div className={css.imageGrid}>
            {images.map((image, index) => (
              <SortableImageItem
                key={imageKey(image)}
                image={image}
                index={index}
                savedImageAltText={savedImageAltText}
                onRemoveImage={onRemoveImage}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
                variantPrefix={variantPrefix}
              />
            ))}

            {!isMaxReached && (
              <div className={css.addImageWrapper}>
                <label className={css.addImageLabel} htmlFor="gallery-add-image">
                  <span className={css.addImageIcon}>+</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="gallery-add-image"
                  className={css.fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {photoError && (
        <p className={css.error}>
          <FormattedMessage id={photoError} />
        </p>
      )}

      {uploadImageError && !photoError && (
        <p className={css.error}>
          <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
        </p>
      )}

      <p className={css.tip}>
        <FormattedMessage
          id={
            isMaxReached
              ? 'EditListingDetailsPanel.photosMaxReached'
              : 'EditListingDetailsPanel.photosAddTip'
          }
        />
      </p>
    </div>
  );
};

export default PhotoGallerySection;
