import React, { useState } from 'react';
import { number, string } from 'prop-types';
import css from './ModalPageHeader.module.css';
import NamedLink from '../NamedLink/NamedLink';

const ModalPageHeader = () => {
  return (
    <div className={css.root}>
      <NamedLink className={css.btnBack} name="ExperiencesExplorePage">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="16"
          viewBox="0 0 10 16"
          fill="none"
          className={css.iconBack}
        >
          <path
            d="M0.293359 7.29414C-0.0972652 7.68477 -0.0972652 8.31914 0.293359 8.70977L6.29336 14.7098C6.68398 15.1004 7.31836 15.1004 7.70898 14.7098C8.09961 14.3191 8.09961 13.6848 7.70898 13.2941L2.41523 8.00039L7.70586 2.70664C8.09648 2.31602 8.09648 1.68164 7.70586 1.29102C7.31523 0.900391 6.68086 0.900391 6.29023 1.29102L0.290234 7.29102L0.293359 7.29414Z"
            fill="black"
          />
        </svg>
      </NamedLink>
      <NamedLink className={css.btnClose} name="ExperiencesExplorePage">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="11"
          viewBox="0 0 10 11"
          fill="none"
          className={css.iconClose}
        >
          <path
            d="M9.31403 2.33007C9.67211 1.95409 9.67211 1.34351 9.31403 0.967529C8.95596 0.591553 8.37445 0.591553 8.01638 0.967529L4.99997 4.13776L1.9807 0.970537C1.62263 0.59456 1.04112 0.59456 0.683044 0.970537C0.324972 1.34651 0.324972 1.9571 0.683044 2.33308L3.70232 5.5003L0.685909 8.67054C0.327836 9.04651 0.327836 9.6571 0.685909 10.0331C1.04398 10.4091 1.62549 10.4091 1.98357 10.0331L4.99997 6.86284L8.01924 10.0301C8.37732 10.406 8.95883 10.406 9.3169 10.0301C9.67497 9.65409 9.67497 9.04351 9.3169 8.66753L6.29763 5.5003L9.31403 2.33007Z"
            fill="black"
          />
        </svg>
      </NamedLink>
    </div>
  );
};

export default ModalPageHeader;
