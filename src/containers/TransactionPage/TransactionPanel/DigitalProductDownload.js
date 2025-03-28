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

  const isCustomer = transactionRole === 'customer';
  if (!isCustomer) {
    return null;
  }

  switch (processState) {
    case processStates.PURCHASED:
    case processStates.COMPLETED:
    case processStates.REVIEWED:
      return (
        <div className={css.downloadButtonWrapper}>
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            className={css.downloadButton}
            onClick={downloadHanlder}
          >
            <FormattedMessage id="TransactionPanel.downloadDigitalProductButton" />
          </Button>
        </div>
      );
    default:
      return null;
  }
}
