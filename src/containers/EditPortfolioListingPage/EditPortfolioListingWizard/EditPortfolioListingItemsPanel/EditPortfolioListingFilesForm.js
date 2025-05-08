import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ARRAY_ERROR } from 'final-form';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';
import { FormattedMessage, injectIntl } from '../../../../util/reactIntl';
import { isUploadImageOverLimitError } from '../../../../util/errors';
import { composeValidators, nonEmptyArray } from '../../../../util/validators';
import { AspectRatioWrapper, Button, Form } from '../../../../components';
import ListingImage, { RemoveImageButton } from './ListingImage';
import css from './EditPortfolioListingFilesForm.module.css';
import { FieldAddMedia } from './AddMediaField';
import {
  publishPortfolioListing,
  removeImageFromListing,
  removeVideoFromListing,
  saveVideoToListing,
  uploadMedia,
} from '../../EditPortfolioListingPage.duck';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import VideoPlayer from '../../../../components/VideoPlayer/VideoPlayer';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableImage from './SortableImage';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import IconDotsVertical from '../../../../components/IconDotsVertical/IconDotsVertical';

const ImageUploadError = ({ uploadOverLimit, uploadImageError }) =>
  uploadOverLimit ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
    </p>
  ) : uploadImageError ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
    </p>
  ) : null;

const PublishListingError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;

const UpdateListingError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.updateFailed" />
    </p>
  ) : null;

const ShowListingsError = ({ error }) =>
  error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;

const FieldListingVideo = props => {
  const { name, aspectWidth, aspectHeight, onRemoveVideo } = props;

  return (
    <Field name={name}>
      {({ input }) =>
        input.value ? (
          <div className={css.thumbnail}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              <VideoPlayer src={input.value.url} previewTime={input.value.thumbnailTime} />
              <RemoveImageButton
                onClick={onRemoveVideo}
                confirmTitle="Delete Video?"
                confirmMessage="This action cannot be undone."
              />
            </AspectRatioWrapper>
          </div>
        ) : null
      }
    </Field>
  );
};

const FieldListingImage = props => {
  const { name, intl, aspectWidth, aspectHeight, variantPrefix, onRemoveImage } = props;
  return (
    <Field name={name}>
      {({ input }) =>
        input.value ? (
          <ListingImage
            image={input.value}
            key={input.value?.id?.uuid || input.value?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={onRemoveImage}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
          />
        ) : null
      }
    </Field>
  );
};

const EditPortfolioListingFilesFormComponent = props => {
  const { onUpdateListing, config } = props;
  const dispatch = useDispatch();

  const updating = useSelector(state => state.EditPortfolioListingPage.updating);
  const updateError = useSelector(state => state.EditPortfolioListingPage.updateError);
  const imageUploading = useSelector(state => state.EditPortfolioListingPage.uploading);
  const uploadImageError = useSelector(state => state.EditPortfolioListingPage.uploadError);
  const publishListingError = useSelector(state => state.EditPortfolioListingPage.saveError);
  const showListingsError = useSelector(state => state.EditPortfolioListingPage.error);
  const existingImages = useSelector(state => state.EditPortfolioListingPage.images);
  const existingVideos = useSelector(state => state.EditPortfolioListingPage.videos);
  const listing = useSelector(state => state.EditPortfolioListingPage.portfolioListing);
  const listingId = listing?.id;
  const listingState = listing?.attributes?.state;
  const isDraft = listingState === LISTING_STATE_DRAFT;

  const onImageUploadHandler = file => {
    if (file) {
      const tempImageId = `${file.name}_${Date.now()}`;
      dispatch(uploadMedia({ id: tempImageId, file }, config));
    }
  };
  const onPublishHandler = values => {
    const updateListingValues = { ...values, id: listingId };
    if (!listingId) return;
    if (isDraft) {
      dispatch(publishPortfolioListing(listingId)).then(updatedListing => {
        if (updatedListing) {
          onUpdateListing(updateListingValues);
        }
      });
    } else {
      onUpdateListing(updateListingValues);
    }
  };
  const onSaveVideo = video => {
    dispatch(saveVideoToListing(video));
  };
  const handleRemoveVideo = videoId => {
    dispatch(removeVideoFromListing(videoId));
  };
  const handleRemoveImage = imageId => {
    dispatch(removeImageFromListing(imageId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return (
    <FinalForm
      onSubmit={onPublishHandler}
      {...props}
      initialValues={{ images: existingImages, videos: existingVideos }}
      mutators={{ ...arrayMutators }}
      render={({
        form,
        className,
        handleSubmit,
        intl,
        invalid,
        disabled,
        touched,
        errors,
        listingImageConfig = {},
      }) => {
        const { aspectWidth = 1, aspectHeight = 1 } = listingImageConfig;
        const submitInProgress = updating;
        const submitDisabled = invalid || disabled || submitInProgress || imageUploading;
        const imagesError = touched.images && errors?.images && errors.images[ARRAY_ERROR];
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
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
                {({ fields }) => {
                  const imageIds = fields.value.map(image => image.id?.uuid || image.id);
                  return (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={event => {
                        const { active, over } = event;
                        if (active.id !== over?.id) {
                          const oldIndex = fields.value.findIndex(
                            img => (img.id?.uuid || img.id) === active.id
                          );
                          const newIndex = fields.value.findIndex(
                            img => (img.id?.uuid || img.id) === over.id
                          );
                          fields.move(oldIndex, newIndex);
                        }
                      }}
                    >
                      <SortableContext items={imageIds} strategy={verticalListSortingStrategy}>
                        {imageIds.map((id, index) => {
                          const name = `images[${index}]`;
                          const image = fields.value[index];
                          return (
                            <SortableImage
                              key={id}
                              id={id}
                              dragHandle={({ listeners, attributes }) => (
                                <span {...listeners} {...attributes} className={css.dragHandle}>
                                  <IconDotsVertical />
                                </span>
                              )}
                            >
                              <FieldListingImage
                                name={name}
                                intl={intl}
                                image={image}
                                onRemoveImage={() => {
                                  fields.remove(index);
                                  handleRemoveImage(id);
                                }}
                              />
                            </SortableImage>
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  );
                }}
              </FieldArray>

              <FieldArray name="videos">
                {({ fields }) =>
                  fields.map((name, index) => {
                    const video = fields.value?.[index];
                    const videoId = video.id;
                    return (
                      <FieldListingVideo
                        key={videoId}
                        name={name}
                        aspectWidth={aspectWidth}
                        aspectHeight={aspectHeight}
                        onRemoveVideo={() => {
                          fields.remove(index);
                          handleRemoveVideo(videoId);
                        }}
                      />
                    );
                  })
                }
              </FieldArray>

              <FieldAddMedia
                id="addMedia"
                name="addMedia"
                disabled={updating}
                formApi={form}
                onImageUploadHandler={onImageUploadHandler}
                onSaveVideo={onSaveVideo}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
                isUploading={imageUploading}
              />
            </div>

            {imagesError && <div className={css.arrayError}>{imagesError}</div>}
            <ImageUploadError
              uploadOverLimit={uploadOverLimit}
              uploadImageError={uploadImageError}
            />
            <PublishListingError error={publishListingError} />
            <UpdateListingError error={updateError} />
            <ShowListingsError error={showListingsError} />
            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              {isDraft ? 'Publish' : 'Save changes'}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default injectIntl(EditPortfolioListingFilesFormComponent);
