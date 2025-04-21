import React from 'react';
import { array, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';
import {ImagePlus} from 'lucide-react';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import ModalIframeButton from '../../../../extensions/common/components/ModalIframeButton/ModalIframeButton';

import css from './EditListingPhotosPanel.module.css';

const getInitialValues = params => {
  const { images } = params;
  return { images };
};

const EditListingPhotosPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    location,
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const getImageGeneratorUrl = () => {
    
    // Extract city and state from the full address
    const fullAddress = listing?.attributes?.publicData?.location?.address || '';
    let cityRegion = '';
    
    if (fullAddress) {
      const addressParts = fullAddress.split(',').map(part => part.trim());
      // For an address like "123 Street Rd, Marathon, New York 13803, United States"
      // We want to extract "Marathon, New York"
      if (addressParts.length >= 3) {
        const cityIndex = addressParts.length - 3;
        const stateIndex = addressParts.length - 2;
        
        const city = addressParts[cityIndex];
        // Extract just the state name by removing the zip code
        const state = addressParts[stateIndex];
    
        cityRegion = `${city}, ${state}`;
      }
    }
    
    const params = {
      agentName: listing?.author?.attributes?.profile?.displayName,
      agentAvatar: listing?.author?.profileImage?.attributes?.variants["listing-card-2x"]?.url,
      title: encodeURIComponent(listing?.attributes?.title),
      locationType: listing?.attributes?.publicData?.categoryLevel1,
      buildingType: listing?.attributes?.publicData?.building_type,
      cityRegion: cityRegion,
    }
    const url = `https://agent.vendingvillage.com/image-generator?${new URLSearchParams(params)}`;
    return url;
  };

  const imageGeneratorUrl = getImageGeneratorUrl();

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingPhotosPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPhotosPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      
      {listing?.attributes?.publicData?.listingType === 'sell' && (
        
        <div className={css.generateImageButton}>
          
          <ModalIframeButton 
              iframeUrl={imageGeneratorUrl} 
              buttonLabel={<FormattedMessage id="EditListingPhotosPanel.imageGenerator" />} 
              icon={ImagePlus} 
              buttonClassName="buttonSecondary"
              modalWidth="1100px"
              modalHeight="575px"
            />

        </div>

        

      )}

      <EditListingPhotosForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        onImageUpload={onImageUpload}
        onSubmit={values => {
          const { addImage, ...updateValues } = values;
          onSubmit(updateValues);
        }}
        onRemoveImage={onRemoveImage}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
      />
      
    </div>
  );
};

EditListingPhotosPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  images: [],
  listing: null,
};

EditListingPhotosPanel.propTypes = {
  className: string,
  rootClassName: string,
  errors: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  images: array,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  onImageUpload: func.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  onRemoveImage: func.isRequired,
  listingImageConfig: object.isRequired,
};

export default EditListingPhotosPanel;
