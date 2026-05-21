import React from 'react';
import classNames from 'classnames';

import { Heading, FileName } from '../../../components';

import { IconDownload } from '../Message/IconDownload';

import css from './FileDownloadList.module.css';

const FileDownloadItem = ({ file }) => (
  <li className={css.item}>
    <span className={css.fileAttachmentIcon}>
      <IconDownload />
    </span>
    <FileName className={css.link} name={file}></FileName>
  </li>
);

const FileDownloadList = props => {
  const {
    className,
    rootClassName,
    isDownloadProcess,
    isProblemReported,
    isCustomerRole,
    stateData,
  } = props;

  if (!isDownloadProcess || (isProblemReported && isCustomerRole)) {
    return null;
  }

  const classes = classNames(rootClassName || css.container, className);

  const listOfFiles = ['Photo_of_a_rare_bird.jpg', 'Photo_of_a_rare_dog.jpg', 'rare_dogbird.jpg'];

  return (
    <div className={classes}>
      <Heading as="h3" rootClassName={css.sectionHeading}>
        File(s)
      </Heading>
      <ul className={css.list}>
        {listOfFiles.map(file => (
          <FileDownloadItem key={file} file={file} />
        ))}
      </ul>
    </div>
  );
};

export default FileDownloadList;
