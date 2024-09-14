import React from 'react';
import { array, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { Button, H3 } from '../../../../components';
import css from './EditListingUploaderPanel.module.css';
import { Dashboard } from '@uppy/react';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { useUppy } from '../../../../hooks/useUppy';

const { UUID } = sdkTypes;

const getInitialValues = params => {
  const { images } = params;
  return { images };
};

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
    submitReady,
    currentUser,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  const { uuid: userId } = currentUser.id;
  const uppy = useUppy({ userId });

  uppy.on('complete', info => {
    console.log('complete', info);
  });

  uppy.on('file-added', info => {
    console.log('file-added', uppy.getFiles());
  });

  return (
    <div className={classes}>
      <H3 as="h1">
        <FormattedMessage id="EditListingUploaderPanel.title" />
        <p>
          <FormattedMessage id="EditListingUploaderPanel.subtitle" />
        </p>
      </H3>
      <Dashboard uppy={uppy} hideUploadButton={true} />
      <Button
        className={css.submitButton}
        type="button"
        inProgress={false}
        ready={submitReady}
        onClick={onSubmit}
      >
        {submitButtonText}
      </Button>
    </div>
  );
};

EditListingUploaderPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  images: [],
  listing: null,
  currentUser: null,
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
  currentUser: propTypes.currentUser,
};

export default EditListingUploaderPanel;
