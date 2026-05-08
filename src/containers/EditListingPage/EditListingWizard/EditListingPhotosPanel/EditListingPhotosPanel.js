import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { deleteMuxAsset } from '../../../../util/api';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import css from './EditListingPhotosPanel.module.css';

const getInitialValues = params => {
  const { images = [], listing, mediaMode } = params;
  const publicData = listing?.attributes?.publicData || {};
  const savedMediaGallery = publicData.mediaGallery;
  const mediaGallery =
    mediaMode && Array.isArray(savedMediaGallery)
      ? savedMediaGallery
      : mediaMode
      ? images.map(image => {
          const imageId = image?.id?.uuid || image?.id;
          return {
            id: `image:${imageId}`,
            type: 'image',
            imageId,
          };
        })
      : [];

  return mediaMode ? { images, mediaGallery } : { images };
};

const getIdString = id => id?.uuid || id;
const imageMediaId = imageId => `image:${getIdString(imageId)}`;

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
            id: `video:${item.assetId}`,
            type: 'video',
            assetId: item.assetId,
            playbackId: item.playbackId,
            name: item.name,
          }
    );

const videoAssetIds = mediaGallery =>
  sanitizeMediaGallery(mediaGallery)
    .filter(item => item.type === 'video' && item.assetId)
    .map(item => item.assetId);

const resolveImageForSubmit = (item, images) => {
  const itemImageId = getIdString(item.imageId);
  return (images || []).find(image => {
    const imageId = getIdString(image.imageId || image.id);
    return imageId === itemImageId;
  });
};

/**
 * The EditListingPhotosPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.errors - The errors object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Array} props.images - The images array
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {Function} props.onImageUpload - The image upload function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @returns {JSX.Element}
 */
const EditListingPhotosPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    images = [],
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
    updatePageTitle: UpdatePageTitle,
    intl,
    mediaMode = false,
    onManageDisableScrolling,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const uploadedVideoAssetIds = React.useRef([]);
  const initialValues = React.useMemo(() => getInitialValues(props), [
    props.images,
    listing?.id?.uuid,
    listing?.attributes?.publicData?.mediaGallery,
    mediaMode,
  ]);
  const initialVideoAssetIds = React.useMemo(() => videoAssetIds(initialValues.mediaGallery), [
    initialValues,
  ]);

  const panelHeadingProps = isPublished
    ? {
        id: mediaMode ? 'EditListingPhotosPanel.mediaTitle' : 'EditListingPhotosPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: mediaMode
          ? 'EditListingPhotosPanel.createListingMediaTitle'
          : 'EditListingPhotosPanel.createListingTitle',
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
      <p>
        <FormattedMessage
          id={
            mediaMode
              ? 'EditListingPhotosPanel.mediaDescription'
              : 'EditListingPhotosPanel.description'
          }
        />
      </p>
      <EditListingPhotosForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={initialValues}
        images={images}
        mediaMode={mediaMode}
        onImageUpload={onImageUpload}
        onSubmit={values => {
          const { mediaGallery, ...rest } = values;
          delete rest.addImage;
          delete rest.addMedia;

          if (!mediaMode) {
            return onSubmit(rest);
          }

          const finalMediaGallery = sanitizeMediaGallery(mediaGallery);
          const mediaImages = finalMediaGallery
            .filter(item => item.type === 'image')
            .map(item => resolveImageForSubmit(item, images))
            .filter(Boolean);
          const finalVideoAssetIds = videoAssetIds(finalMediaGallery);
          const removedVideoAssetIds = Array.from(
            new Set(initialVideoAssetIds.concat(uploadedVideoAssetIds.current))
          ).filter(assetId => !finalVideoAssetIds.includes(assetId));

          const updateValues = {
            ...rest,
            images: mediaImages,
            publicData: {
              mediaGallery: finalMediaGallery,
            },
          };

          return onSubmit(updateValues).then(response => {
            uploadedVideoAssetIds.current = finalVideoAssetIds;
            if (removedVideoAssetIds.length > 0) {
              return Promise.all(
                removedVideoAssetIds.map(assetId =>
                  deleteMuxAsset({ assetId }).catch(e => {
                    console.error('Failed to delete removed Mux asset', e);
                  })
                )
              ).then(() => response);
            }
            return response;
          });
        }}
        onRemoveImage={onRemoveImage}
        onVideoUploaded={assetId => {
          uploadedVideoAssetIds.current = uploadedVideoAssetIds.current.concat(assetId);
        }}
        onManageDisableScrolling={onManageDisableScrolling}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
      />
    </main>
  );
};

export default EditListingPhotosPanel;
