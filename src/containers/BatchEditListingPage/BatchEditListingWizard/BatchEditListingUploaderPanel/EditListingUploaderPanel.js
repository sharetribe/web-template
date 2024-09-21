import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Button, H3 } from '../../../../components';
import css from './EditListingUploaderPanel.module.css';
import { Dashboard } from '@uppy/react';

const EditListingUploaderPanel = props => {
  const { submitButtonText, onSubmit, submitReady, uppy } = props;
  const hasFiles = uppy.getFiles().length > 0;

  return (
    <div className={css.root}>
      <H3 as="h1">
        <FormattedMessage id="BatchEditListingUploaderPanel.title" />
        <p>
          <FormattedMessage id="BatchEditListingUploaderPanel.subtitle" />
        </p>
      </H3>
      <Dashboard uppy={uppy} hideUploadButton={true} />
      <Button
        className={css.submitButton}
        type="button"
        inProgress={false}
        ready={submitReady}
        onClick={onSubmit}
        disabled={!hasFiles}
      >
        {submitButtonText}
      </Button>
    </div>
  );
};

export default EditListingUploaderPanel;
