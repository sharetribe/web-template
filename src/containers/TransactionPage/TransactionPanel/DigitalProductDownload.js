import React from 'react';
import { Button } from 'antd';
import { CloudDownloadOutlined } from '@ant-design/icons';

import { FormattedMessage } from '../../../util/reactIntl';
import { generateDownloadUrls } from '../../../util/api';

import css from './TransactionPanel.module.css';

export default function DigitalProductDownload({
  currentUser,
  transactionId,
  transactionRole,
  processState,
  processStates,
}) {
  async function downloadHanlder() {
    const { filename, url } = await generateDownloadUrls({
      transactionId,
      userId: currentUser.id.uuid,
    });
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    link.rel = 'noreferrer noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  switch (processState) {
    case processStates.COMPLETED:
    case processStates.DELIVERED:
    case processStates.PURCHASED:
    case processStates.RECEIVED:
    case processStates.REVIEWED:
    case processStates.REVIEWED_BY_CUSTOMER:
    case processStates.REVIEWED_BY_PROVIDER:
      return (
        <div className={css.downloadButtonWrapper}>
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            className={css.downloadButton}
            onClick={downloadHanlder}
          >
            <FormattedMessage id="ListingTabs.manageButton" />
          </Button>
        </div>
      );
    default:
      return null;
  }
}
