import React, { useRef } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import EditListingPhotosFormSlots from './EditListingPhotosFormSlots';
import css from './EditListingPhotosPanel.module.css';

// AV variant: 4 fixed labeled image slots saved to publicData.imageSlots.
const SLOT_KEYS = ['front', 'back', 'horizontal', 'details'];

// Upstream initial values: pass images through as-is.
const getInitialValuesGallery = ({ images = [] }) => ({ images });

// Slot-mode initial values: map each labeled slot back to its image, falling
// back to positional order for older listings without imageSlots metadata.
const getInitialValuesSlots = ({ images = [], listing }) => {
  const publicData = listing?.attributes?.publicData || {};
  const imageSlots = publicData.imageSlots || {};
  const initialValues = {};
  const hasSlotMapping = Object.keys(imageSlots).length > 0;

  if (hasSlotMapping) {
    SLOT_KEYS.forEach(slotKey => {
      const imageUuid = imageSlots[slotKey];
      if (imageUuid) {
        const matchedImage = images.find(img => {
          const uuid = img?.imageId?.uuid || img?.id?.uuid;
          return uuid === imageUuid;
        });
        if (matchedImage) {
          initialValues[`image_${slotKey}`] = matchedImage;
        }
      }
    });
  } else {
    SLOT_KEYS.forEach((slotKey, index) => {
      if (images[index]) initialValues[`image_${slotKey}`] = images[index];
    });
  }
  return initialValues;
};

// Slot-mode submit: collect ordered images + build publicData.imageSlots.
const submitSlots = (values, onSubmit) => {
  const images = SLOT_KEYS.map(k => values[`image_${k}`]).filter(Boolean);
  const imageSlots = {};
  SLOT_KEYS.forEach(k => {
    const img = values[`image_${k}`];
    if (img) imageSlots[k] = img.imageId?.uuid || img.id?.uuid;
  });
  onSubmit({ images, publicData: { imageSlots } });
};

// Upstream submit: strip out the addImage scratch field.
const submitGallery = (values, onSubmit) => {
  const { addImage, ...updateValues } = values;
  onSubmit(updateValues);
};

const EditListingPhotosPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
    updatePageTitle: UpdatePageTitle,
    intl,
    photoMode = 'gallery',
  } = props;

  const isSlotMode = photoMode === 'slots';
  const FormComponent = isSlotMode ? EditListingPhotosFormSlots : EditListingPhotosForm;

  // Slot mode: stabilize initialValues so React Final Form never reinitializes.
  // RFF uses === on initialValues — a new object every render triggers re-init,
  // which resets fields managed via form.change back to initialValues, breaking
  // the upload-then-remove flow.
  const stableInitialValuesRef = useRef(null);
  const trackedListingIdRef = useRef(undefined);
  const currentListingId = listing?.id?.uuid;
  if (isSlotMode && currentListingId !== trackedListingIdRef.current) {
    trackedListingIdRef.current = currentListingId;
    stableInitialValuesRef.current = getInitialValuesSlots({
      images: listing?.images || [],
      listing,
    });
  }

  const initialValues = isSlotMode
    ? stableInitialValuesRef.current
    : getInitialValuesGallery(props);

  const handleSubmit = values =>
    isSlotMode ? submitSlots(values, onSubmit) : submitGallery(values, onSubmit);

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingPhotosPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingPhotosPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      <FormComponent
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        images={props.images}
        initialValues={initialValues}
        onImageUpload={onImageUpload}
        onSubmit={handleSubmit}
        onRemoveImage={onRemoveImage}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
      />
    </main>
  );
};

export default EditListingPhotosPanel;
