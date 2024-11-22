import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Button, H3 } from '../../../../components';
import css from './EditListingUploaderPanel.module.css';
import { Dashboard } from '@uppy/react';
import { Skeleton, Space } from 'antd';

const EditListingUploaderPanel = props => {
  const { onSubmit, submitReady, uppy } = props;
  const hasFiles = uppy ? uppy.getFiles().length > 0 : uppy;

  return (
    <div className={css.root}>
      <H3 as="h1">
        <FormattedMessage id="BatchEditListingUploaderPanel.title" />
        <p>
          <FormattedMessage id="BatchEditListingUploaderPanel.subtitle" />
        </p>
      </H3>
      {uppy ? (
        <>
          <Dashboard uppy={uppy} hideUploadButton={true} />
          <Button
            className={css.submitButton}
            type="button"
            inProgress={false}
            ready={submitReady}
            onClick={onSubmit}
            disabled={!hasFiles}
          >
            <FormattedMessage id="BatchEditListingWizard.new.saveUpload"></FormattedMessage>
          </Button>
        </>
      ) : (
        <Space direction="vertical" size="large">
          <Skeleton.Node active style={{ width: 750, height: 550 }} />
          <Skeleton.Button active style={{ width: 220, height: 60 }} />
        </Space>
      )}
    </div>
  );
};

export default EditListingUploaderPanel;
