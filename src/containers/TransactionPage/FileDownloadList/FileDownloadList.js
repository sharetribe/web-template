import React from 'react';
import classNames from 'classnames';

import { Heading } from '../../../components';

import css from './FileDownloadList.module.css';

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

  // TODO: REVEAL FILE AND HIDE ON INQUIRY PROCESS

  const classes = classNames(rootClassName || css.container, className);

  return (
    <div className={classes}>
      <Heading as="h3" rootClassName={css.sectionHeading}>
        File(s)
      </Heading>
      <ul className={css.list}>
        <li className={css.item}>
          <a href="" className={css.link}>
            Photo_of_a_rare_bird.jpg
          </a>
        </li>
      </ul>
    </div>
  );
};

export default FileDownloadList;
