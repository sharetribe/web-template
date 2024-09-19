import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';

import css from './CustomKeys.module.css';

const CustomKeys = ({ detail, publicData }) => {
  return (
    <div className={css.detailValue}>
      <span className={css.detailLabel}>{detail.label}</span>
      {detail.key === 'phone' ? (
        <>
          <span className={css.colon}>:</span>
          <a href={`tel:${detail.value}`} className={css.phoneLink}>
            <FontAwesomeIcon icon={faPhone} className={css.phoneIcon} />
            {detail.value}
          </a>
        </>
      ) : (
        <>
          <span className={css.colon}>:</span>
          <span>{detail.value}</span>
        </>
      )}
    </div>
  );
};

export default CustomKeys;
