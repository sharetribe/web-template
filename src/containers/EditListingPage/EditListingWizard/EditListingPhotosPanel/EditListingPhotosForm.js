import React, { useEffect, useState } from 'react';
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
} from '@dnd-kit/sortable';
import * as UpChunk from '@mux/upchunk';
import { ARRAY_ERROR } from 'final-form';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { nonEmptyArray, composeValidators } from '../../../../util/validators';
import { isUploadImageOverLimitError } from '../../../../util/errors';
import { getMuxUploadUrl, getMuxAsset, getMuxJwtToken } from '../../../../util/api';

// Import shared components
import { Button, Form, AspectRatioWrapper, MuxPlayerModal } from '../../../../components';

// Import modules from this directory
import ListingImage from './ListingImage';
import SortableMediaItem from './SortableMediaItem';
import css from './EditListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';
const ACCEPT_MEDIA = 'image/*,video/*';
const MUX_ASSET_POLL_ATTEMPTS = 20;
const MUX_ASSET_POLL_DELAY_MS = 1500;

const getIdString = id => id?.uuid || id;
const imageMediaId = imageId => `image:${getIdString(imageId)}`;
const videoMediaId = assetId => `video:${assetId}`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sanitizeMediaGallery = mediaGallery =>
  (mediaGallery || [])
    .filter(item => !item.uploading && (item.type === 'image' ? item.imageId : item.assetId))
    .map(item =>
      item.type === 'image'
        ? {
            id: imageMediaId(item.imageId),
            type: 'image',
            imageId: getIdString(item.imageId),
          }
        : {
            id: videoMediaId(item.assetId),
            type: 'video',
            assetId: item.assetId,
            playbackId: item.playbackId,
            name: item.name,
          }
    );

const resolveImage = (item, images) => {
  const itemImageId = getIdString(item.imageId);
  const itemUploadId = item.uploadId;
  return (images || []).find(image => {
    const imageId = getIdString(image.imageId || image.id);
    const tempId = getIdString(image.id);
    return imageId === itemImageId || tempId === itemUploadId;
  });
};

const updateMediaItem = (form, id, updates) => {
  const current = form.getState().values.mediaGallery || [];
  form.change(
    'mediaGallery',
    current.map(item => (item.id === id ? { ...item, ...updates } : item))
  );
};

const fetchMuxThumbnailToken = playbackId =>
  getMuxJwtToken({ playbackId, type: 'thumbnail' }).then(data => data.token);

const removeMediaItem = (form, id) => {
  const current = form.getState().values.mediaGallery || [];
  form.change(
    'mediaGallery',
    current.filter(item => item.id !== id)
  );
};

const pollMuxAsset = async uploadId => {
  let lastError = null;
  for (let i = 0; i < MUX_ASSET_POLL_ATTEMPTS; i += 1) {
    try {
      const assetData = await getMuxAsset({ uploadId });
      if (assetData?.asset_id && assetData?.playback_id) {
        return assetData;
      }
    } catch (e) {
      lastError = e;
    }
    await delay(MUX_ASSET_POLL_DELAY_MS);
  }
  throw lastError || new Error('Mux asset was not ready in time');
};

const ImageUploadError = props => {
  return props.uploadOverLimit ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
    </p>
  ) : props.uploadImageError ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
    </p>
  ) : null;
};

const PublishListingError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;
};

const ShowListingsError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;
};

// Field component that uses file-input to allow user to select images.
export const FieldAddImage = props => {
  const { formApi, onImageUploadHandler, aspectWidth = 1, aspectHeight = 1, ...rest } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          formApi.change(`addImage`, file);
          formApi.blur(`addImage`);
          onImageUploadHandler(file);
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : <input {...inputProps} className={css.addImageInput} />}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

const FieldAddMedia = props => {
  const { formApi, onMediaUploadHandler, aspectWidth = 1, aspectHeight = 1, ...rest } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          formApi.change(`addMedia`, file);
          formApi.blur(`addMedia`);
          onMediaUploadHandler(file, formApi);
          e.target.value = '';
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : <input {...inputProps} className={css.addImageInput} />}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

// Component that shows listing images from "images" field array
const FieldListingImage = props => {
  const { name, intl, onRemoveImage, aspectWidth, aspectHeight, variantPrefix } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const image = input.value;
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
          />
        ) : null;
      }}
    </Field>
  );
};

/**
 * The EditListingPhotosForm component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const EditListingPhotosForm = props => {
  const [state, setState] = useState({ imageUploadRequested: false });
  const [submittedImages, setSubmittedImages] = useState([]);
  const [submittedMedia, setSubmittedMedia] = useState([]);
  const [videoUploadError, setVideoUploadError] = useState(null);
  const [muxPlayerOpen, setMuxPlayerOpen] = useState(false);
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState(null);
  const [thumbnailTokensByPlaybackId, setThumbnailTokensByPlaybackId] = useState({});
  const [thumbnailErrorsByPlaybackId, setThumbnailErrorsByPlaybackId] = useState({});
  const intl = useIntl();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onImageUploadHandler = file => {
    const { listingImageConfig, onImageUpload } = props;
    if (file) {
      setState({ imageUploadRequested: true });

      onImageUpload({ id: `${file.name}_${Date.now()}`, file }, listingImageConfig)
        .then(() => {
          setState({ imageUploadRequested: false });
        })
        .catch(() => {
          setState({ imageUploadRequested: false });
        });
    }
  };

  const prefetchThumbnailToken = playbackId => {
    if (
      !playbackId ||
      thumbnailTokensByPlaybackId[playbackId] ||
      thumbnailErrorsByPlaybackId[playbackId]
    ) {
      return Promise.resolve();
    }

    return fetchMuxThumbnailToken(playbackId)
      .then(token => {
        setThumbnailTokensByPlaybackId(prev => ({ ...prev, [playbackId]: token }));
      })
      .catch(err => {
        console.error('Failed to fetch Mux thumbnail token', err);
        setThumbnailErrorsByPlaybackId(prev => ({ ...prev, [playbackId]: true }));
      });
  };

  const onMediaUploadHandler = (file, form) => {
    const { listingImageConfig, onImageUpload, onVideoUploaded } = props;
    if (!file) return;

    if (file.type?.startsWith('image/')) {
      const uploadId = `${file.name}_${Date.now()}`;
      const tempMediaId = `image-upload:${uploadId}`;
      form.mutators.push('mediaGallery', {
        id: tempMediaId,
        type: 'image',
        uploadId,
        uploading: true,
      });
      setState({ imageUploadRequested: true });

      onImageUpload({ id: uploadId, file }, listingImageConfig)
        .then(response => {
          const imageId = response?.data?.imageId || response?.data?.id;
          updateMediaItem(form, tempMediaId, {
            id: imageMediaId(imageId),
            imageId: getIdString(imageId),
            uploading: false,
          });
          setState({ imageUploadRequested: false });
        })
        .catch(() => {
          removeMediaItem(form, tempMediaId);
          setState({ imageUploadRequested: false });
        });
      return;
    }

    if (file.type?.startsWith('video/')) {
      const tempMediaId = `video-upload:${file.name}_${Date.now()}`;
      form.mutators.push('mediaGallery', {
        id: tempMediaId,
        type: 'video',
        name: file.name,
        uploading: true,
        progress: 0,
      });
      setVideoUploadError(null);

      getMuxUploadUrl({ playback_policy: ['signed'] })
        .then(uploadData => {
          if (!uploadData?.url || !uploadData?.id) {
            throw new Error('Failed to get upload URL from server');
          }

          const upload = UpChunk.createUpload({
            endpoint: uploadData.url,
            file,
            chunkSize: 5120,
          });

          upload.on('error', err => {
            console.error('Mux upload error:', err.detail);
            removeMediaItem(form, tempMediaId);
            setVideoUploadError(
              intl.formatMessage({ id: 'EditListingPhotosForm.videoUploadFailed' })
            );
          });

          upload.on('progress', progress => {
            updateMediaItem(form, tempMediaId, { progress: Math.round(progress.detail) });
          });

          upload.on('success', () => {
            pollMuxAsset(uploadData.id)
              .then(assetData => {
                const assetId = assetData.asset_id;
                const playbackId = assetData.playback_id;
                updateMediaItem(form, tempMediaId, {
                  id: videoMediaId(assetId),
                  assetId,
                  playbackId,
                  name: file.name,
                  uploading: false,
                  progress: 100,
                });
                prefetchThumbnailToken(playbackId);
                if (onVideoUploaded) {
                  onVideoUploaded(assetId);
                }
              })
              .catch(err => {
                console.error('Error processing Mux asset:', err);
                removeMediaItem(form, tempMediaId);
                setVideoUploadError(
                  intl.formatMessage({ id: 'EditListingPhotosForm.videoUploadFailed' })
                );
              });
          });
        })
        .catch(error => {
          console.error('Error starting Mux upload:', error);
          removeMediaItem(form, tempMediaId);
          setVideoUploadError(
            intl.formatMessage({ id: 'EditListingPhotosForm.videoUploadFailed' })
          );
        });
    }
  };

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      keepDirtyOnReinitialize={props.mediaMode}
      render={formRenderProps => {
        const {
          form,
          className,
          fetchErrors,
          handleSubmit,
          invalid,
          onRemoveImage,
          disabled,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          touched,
          errors,
          values,
          listingImageConfig,
          mediaMode,
          images: availableImages,
          onManageDisableScrolling,
        } = formRenderProps;

        const images = values.images || [];
        const mediaGallery = values.mediaGallery || [];
        const { aspectWidth = 1, aspectHeight = 1, variantPrefix } = listingImageConfig;

        const { publishListingError, showListingsError, updateListingError, uploadImageError } =
          fetchErrors || {};
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

        const arrayOfImgIds = imgs => imgs?.map(i => (typeof i.id === 'string' ? i.imageId : i.id));
        const imageIdsFromProps = arrayOfImgIds(images);
        const imageIdsFromPreviousSubmit = arrayOfImgIds(submittedImages);
        const imageArrayHasSameImages = isEqual(imageIdsFromProps, imageIdsFromPreviousSubmit);
        const submittedOnce = submittedImages.length > 0 || submittedMedia.length > 0;

        const sanitizedMediaGallery = sanitizeMediaGallery(mediaGallery);
        const mediaArrayHasSameItems = isEqual(sanitizedMediaGallery, submittedMedia);
        const pristineSinceLastSubmit = mediaMode
          ? submittedOnce && mediaArrayHasSameItems
          : submittedOnce && imageArrayHasSameImages;

        const mediaHasUploading = mediaGallery.some(item => item.uploading);
        const mediaHasPhoto = mediaGallery.some(item => item.type === 'image' && item.imageId);
        const mediaMissing = mediaMode && sanitizedMediaGallery.length === 0;
        const mediaPhotoMissing = mediaMode && !mediaHasPhoto;
        const submitReady = (updated && pristineSinceLastSubmit) || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled =
          invalid ||
          disabled ||
          submitInProgress ||
          state.imageUploadRequested ||
          mediaHasUploading ||
          mediaMissing ||
          mediaPhotoMissing ||
          ready;
        const imagesError = touched.images && errors?.images && errors.images[ARRAY_ERROR];
        const mediaError = mediaMissing
          ? intl.formatMessage({ id: 'EditListingPhotosForm.mediaRequired' })
          : mediaPhotoMissing
          ? intl.formatMessage({ id: 'EditListingPhotosForm.mediaPhotoRequired' })
          : null;

        const classes = classNames(css.root, className);

        useEffect(() => {
          if (!mediaMode) return;

          mediaGallery
            .filter(item => item.type === 'video' && !item.uploading && item.playbackId)
            .forEach(item => {
              prefetchThumbnailToken(item.playbackId);
            });
        }, [mediaMode, mediaGallery, thumbnailTokensByPlaybackId, thumbnailErrorsByPlaybackId]);

        const onDragEnd = event => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;

          const oldIndex = mediaGallery.findIndex(item => item.id === active.id);
          const newIndex = mediaGallery.findIndex(item => item.id === over.id);
          if (oldIndex >= 0 && newIndex >= 0) {
            form.change('mediaGallery', arrayMove(mediaGallery, oldIndex, newIndex));
          }
        };

        const previewVideo = (playbackId, videoTitle) => {
          setActivePlaybackId(playbackId);
          setActiveVideoTitle(videoTitle);
          setMuxPlayerOpen(true);
        };

        const mediaGrid = mediaMode ? (
          <div className={css.imagesFieldArray}>
            <FieldArray name="mediaGallery">
              {() => (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={mediaGallery.map(item => item.id)}
                    strategy={rectSortingStrategy}
                  >
                    {mediaGallery.map((item, index) => (
                      <SortableMediaItem
                        key={item.id}
                        item={item}
                        image={resolveImage(item, availableImages)}
                        intl={intl}
                        onRemove={() => {
                          if (item.type === 'image' && item.uploadId) {
                            onRemoveImage(item.uploadId);
                          }
                          removeMediaItem(form, item.id);
                        }}
                        onPreviewVideo={previewVideo}
                        thumbnailToken={thumbnailTokensByPlaybackId[item.playbackId]}
                        thumbnailError={thumbnailErrorsByPlaybackId[item.playbackId]}
                        aspectWidth={aspectWidth}
                        aspectHeight={aspectHeight}
                        variantPrefix={variantPrefix}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </FieldArray>

            <FieldAddMedia
              id="addMedia"
              name="addMedia"
              accept={ACCEPT_MEDIA}
              label={
                <span className={css.chooseImageText}>
                  <span className={css.chooseImage}>
                    <FormattedMessage id="EditListingPhotosForm.chooseMedia" />
                  </span>
                  <span className={css.imageTypes}>
                    <FormattedMessage id="EditListingPhotosForm.mediaTypes" />
                  </span>
                </span>
              }
              type="file"
              disabled={state.imageUploadRequested || mediaHasUploading}
              formApi={form}
              onMediaUploadHandler={onMediaUploadHandler}
              aspectWidth={aspectWidth}
              aspectHeight={aspectHeight}
            />
          </div>
        ) : (
          <div className={css.imagesFieldArray}>
            <FieldArray
              name="images"
              validate={composeValidators(
                nonEmptyArray(
                  intl.formatMessage({
                    id: 'EditListingPhotosForm.imageRequired',
                  })
                )
              )}
            >
              {({ fields }) =>
                fields.map((name, index) => (
                  <FieldListingImage
                    key={name}
                    name={name}
                    onRemoveImage={imageId => {
                      fields.remove(index);
                      onRemoveImage(imageId);
                    }}
                    intl={intl}
                    aspectWidth={aspectWidth}
                    aspectHeight={aspectHeight}
                    variantPrefix={variantPrefix}
                  />
                ))
              }
            </FieldArray>

            <FieldAddImage
              id="addImage"
              name="addImage"
              accept={ACCEPT_IMAGES}
              label={
                <span className={css.chooseImageText}>
                  <span className={css.chooseImage}>
                    <FormattedMessage id="EditListingPhotosForm.chooseImage" />
                  </span>
                  <span className={css.imageTypes}>
                    <FormattedMessage id="EditListingPhotosForm.imageTypes" />
                  </span>
                </span>
              }
              type="file"
              disabled={state.imageUploadRequested}
              formApi={form}
              onImageUploadHandler={onImageUploadHandler}
              aspectWidth={aspectWidth}
              aspectHeight={aspectHeight}
            />
          </div>
        );

        return (
          <Form
            className={classes}
            onSubmit={e => {
              setSubmittedImages(images);
              setSubmittedMedia(sanitizedMediaGallery);
              handleSubmit(e);
            }}
          >
            {muxPlayerOpen && (
              <MuxPlayerModal
                id="edit-listing-media-mux-player-modal"
                playbackId={activePlaybackId}
                isOpen={muxPlayerOpen}
                onClose={() => {
                  setMuxPlayerOpen(false);
                  setActivePlaybackId(null);
                  setActiveVideoTitle(null);
                }}
                onManageDisableScrolling={onManageDisableScrolling}
                videoTitle={activeVideoTitle}
              />
            )}

            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.updateFailed" />
              </p>
            ) : null}

            {mediaGrid}

            {!mediaMode && imagesError ? <div className={css.arrayError}>{imagesError}</div> : null}
            {mediaMode && mediaError ? <div className={css.arrayError}>{mediaError}</div> : null}
            {videoUploadError ? <div className={css.arrayError}>{videoUploadError}</div> : null}

            <ImageUploadError
              uploadOverLimit={uploadOverLimit}
              uploadImageError={uploadImageError}
            />

            <p className={css.tip}>
              <FormattedMessage id="EditListingPhotosForm.sortTip" />
            </p>

            <PublishListingError error={publishListingError} />
            <ShowListingsError error={showListingsError} />

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingPhotosForm;
