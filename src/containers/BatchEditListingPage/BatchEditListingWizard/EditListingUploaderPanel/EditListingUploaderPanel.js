import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
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
    className = null,
    rootClassName = null,
    submitButtonText,
    onSubmit,
    submitReady,
    uppy
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);



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

export default EditListingUploaderPanel;
