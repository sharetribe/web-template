import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { isUploadImageOverLimitError } from '../../../../util/errors';

// Import shared components
import { Button, Form } from '../../../../components';

// Import modules from this directory
import ImageSlot from './ImageSlot';
import css from './EditListingPhotosFormSlots.module.css';

const SLOT_KEYS = ['front', 'back', 'horizontal', 'details'];

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

// Inner component that has access to FinalForm's form API via render props
const PhotosFormContent = props => {
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
    values,
    listingImageConfig,
    onImageUploadHandler,
    imageUploadRequested,
  } = props;

  const intl = useIntl();
  const [submittedImages, setSubmittedImages] = useState([]);

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix } = listingImageConfig;

  const { publishListingError, showListingsError, updateListingError, uploadImageError } =
    fetchErrors || {};
  const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

  const currentSlotImages = SLOT_KEYS.map(k => values[`image_${k}`]).filter(Boolean);
  const arrayOfImgIds = imgs => imgs?.map(i => (typeof i.id === 'string' ? i.imageId : i.id));
  const imageIdsFromCurrent = arrayOfImgIds(currentSlotImages);
  const imageIdsFromPreviousSubmit = arrayOfImgIds(submittedImages);
  const imageArrayHasSameImages = isEqual(imageIdsFromCurrent, imageIdsFromPreviousSubmit);
  const submittedOnce = submittedImages.length > 0;
  const pristineSinceLastSubmit = submittedOnce && imageArrayHasSameImages;

  const filledSlots = SLOT_KEYS.filter(k => !!values[`image_${k}`]);
  const tooFewImages = filledSlots.length < 3;

  const submitReady = (updated && pristineSinceLastSubmit) || ready;
  const submitInProgress = updateInProgress;
  const submitDisabled =
    invalid || disabled || submitInProgress || imageUploadRequested || ready || tooFewImages;

  const classes = classNames(css.root, className);

  return (
    <Form
      className={classes}
      onSubmit={e => {
        const slotImages = SLOT_KEYS.map(k => values[`image_${k}`]).filter(Boolean);
        setSubmittedImages(slotImages);
        handleSubmit(e);
      }}
    >
      {updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingPhotosForm.updateFailed" />
        </p>
      ) : null}

      <div className={css.imageSlotsGrid}>
        {SLOT_KEYS.map(slotKey => (
          <ImageSlot
            key={slotKey}
            slotKey={slotKey}
            label={intl.formatMessage({
              id: `EditListingPhotosForm.slotLabel.${slotKey}`,
            })}
            image={values[`image_${slotKey}`]}
            onImageUpload={(file, key) => {
              onImageUploadHandler(file, key, form.change);
            }}
            onRemoveImage={key => {
              const img = values[`image_${key}`];
              if (img) {
                form.change(`image_${key}`, null);
                onRemoveImage(img?.id);
              }
            }}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
            disabled={imageUploadRequested}
            isRequired={['front', 'back', 'horizontal'].includes(slotKey)}
          />
        ))}
      </div>

      {tooFewImages ? (
        <div className={css.arrayError}>
          {intl.formatMessage({ id: 'EditListingPhotosForm.minImagesRequired' })}
        </div>
      ) : null}

      <ImageUploadError uploadOverLimit={uploadOverLimit} uploadImageError={uploadImageError} />

      <p className={css.tip}>
        <FormattedMessage id="EditListingPhotosForm.addImagesTip" />
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
};

export const EditListingPhotosForm = props => {
  const [imageUploadRequested, setImageUploadRequested] = useState(false);

  const onImageUploadHandler = (file, slotKey, formChange) => {
    const { listingImageConfig, onImageUpload } = props;
    if (file) {
      setImageUploadRequested(true);
      const tempId = `${file.name}_${Date.now()}`;

      // Show a preview immediately while the upload is in progress
      formChange(`image_${slotKey}`, { id: tempId, file });

      onImageUpload({ id: tempId, file }, listingImageConfig)
        .then(result => {
          setImageUploadRequested(false);
          // Update slot with the real uploaded image (has imageId UUID)
          formChange(`image_${slotKey}`, result.data);
        })
        .catch(() => {
          setImageUploadRequested(false);
          // Clear the preview on error
          formChange(`image_${slotKey}`, null);
        });
    }
  };

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        return (
          <PhotosFormContent
            {...formRenderProps}
            onImageUploadHandler={onImageUploadHandler}
            imageUploadRequested={imageUploadRequested}
          />
        );
      }}
    />
  );
};

export default EditListingPhotosForm;
