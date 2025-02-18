import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ARRAY_ERROR } from 'final-form';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';
import { FormattedMessage, injectIntl } from '../../../../util/reactIntl';
import { isUploadImageOverLimitError } from '../../../../util/errors';
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
  const { onPublishListing, config } = props;
  const dispatch = useDispatch();
  const uploadedMedia = useSelector(state => state.EditPortfolioListingPage.uploadedMedia);
  const uploadImageError = useSelector(state => state.EditPortfolioListingPage.uploadError);
  const publishListingError = useSelector(state => state.EditPortfolioListingPage.saveError);
  const showListingsError = useSelector(state => state.EditPortfolioListingPage.error);
  const existingImages = useSelector(state => state.EditPortfolioListingPage.images);
  const listing = useSelector(state => state.EditPortfolioListingPage.portfolioListing);
  const listingId = listing?.id;
  const existingVideos = listing?.attributes?.publicData?.videos || [];
  const listingState = listing?.attributes?.state;
  const isDraft = listingState === LISTING_STATE_DRAFT;

  const [imageUploading, setImageUploading] = useState(false);
  const [localImages, setLocalImages] = useState(existingImages);

  const onImageUploadHandler = file => {
    if (file) {
      setImageUploading(true); // Show loading state

      const tempImageId = `${file.name}_${Date.now()}`;

      dispatch(uploadMedia({ id: tempImageId, file }, config))
        .then(() => {
          setImageUploading(false);
        })
        .catch(() => {
          setImageUploading(false);
        });
    }
  };

  const onPublishHandler = () => {
    if (!listingId) return;
    if (isDraft) {
      dispatch(publishPortfolioListing(listingId)).then(updatedListing => {
        if (updatedListing) {
          onPublishListing(updatedListing);
        }
      });
    } else {
      onPublishListing(listing);
    }
  };

  const onSaveVideo = video => {
    if (listingId) {
      dispatch(saveVideoToListing(listingId, video, config));
    }
  };

  useEffect(() => {
    setLocalImages([...existingImages, ...uploadedMedia]);
  }, [existingImages, uploadedMedia]);

  const handleRemoveVideo = videoId => {
    dispatch(removeVideoFromListing(listingId, videoId, config));
  };

  const handleRemoveImage = imageId => {
    dispatch(removeImageFromListing(listingId, imageId, config)).then(() => {
      setLocalImages(prev => prev.filter(img => img.id !== imageId));
    });
  };

  return (
    <FinalForm
      onSubmit={onPublishHandler}
      {...props}
      initialValues={{ images: localImages, videos: existingVideos }}
      mutators={{ ...arrayMutators }}
      render={({
        form,
        className,
        handleSubmit,
        intl,
        invalid,
        disabled,
        updateInProgress,
        touched,
        errors,
        listingImageConfig = {},
      }) => {
        const { aspectWidth = 1, aspectHeight = 1 } = listingImageConfig;
        const submitDisabled = invalid || disabled || updateInProgress;
        const imagesError = touched.images && errors?.images && errors.images[ARRAY_ERROR];
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <div className={css.imagesFieldArray}>
              <FieldArray name="images">
                {() =>
                  localImages.map((image, index) => (
                    <FieldListingImage
                      listingId={listingId}
                      key={image.id.uuid || image.id}
                      name={`images[${index}]`}
                      image={image}
                      intl={intl}
                      onRemoveImage={() => handleRemoveImage(image.id)}
                    />
                  ))
                }
              </FieldArray>

              <FieldArray name="videos">
                {() =>
                  existingVideos.map((video, index) => (
                    <FieldListingVideo
                      key={video.id}
                      name={`videos[${index}]`}
                      aspectWidth={aspectWidth}
                      aspectHeight={aspectHeight}
                      onRemoveVideo={() => handleRemoveVideo(video.id)}
                    />
                  ))
                }
              </FieldArray>

              <FieldAddMedia
                id="addMedia"
                name="addMedia"
                disabled={updateInProgress}
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
            <ShowListingsError error={showListingsError} />

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={updateInProgress}
              disabled={submitDisabled}
            >
              {isDraft ? 'Publish' : 'Return'}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default injectIntl(EditPortfolioListingFilesFormComponent);
