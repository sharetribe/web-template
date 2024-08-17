import React, { useState, useEffect } from 'react';
import { array, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import css from './EditListingUploaderPanel.module.css';

import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import Transloadit from '@uppy/transloadit';

const getInitialValues = params => {
  const { images } = params;
  return { images };
};

function createUppy(userId) {
  return new Uppy({ meta: { userId } }).use(Transloadit, {
    async assemblyOptions(file) {
      // You can send meta data along for use in your template.
      // https://transloadit.com/docs/topics/assembly-instructions/#form-fields-in-instructions
      const body = JSON.stringify({ userId: file.meta.userId });
      const res = await fetch('/transloadit-params', { method: 'POST', body });
      return response.json();
    },
  });
}

const EditListingUploaderPanel = props => {
  const {
    className,
    rootClassName,
    ready,
    listing,
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
  // TODO: resolve to the proper user id
  const userId = '9999';
  const [uppy] = useState(() => createUppy(userId));

  useEffect(() => {
    if (userId) {
      // Adding to global `meta` will add it to every file.
      uppy.setOptions({ meta: { userId } });
    }
  }, [uppy, userId]);

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

      <Dashboard uppy={uppy} />
    </div>
  );
};

EditListingUploaderPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  images: [],
  listing: null,
};

EditListingUploaderPanel.propTypes = {
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

export default EditListingUploaderPanel;
