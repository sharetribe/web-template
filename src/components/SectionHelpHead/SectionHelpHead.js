import React, { useState } from 'react';
import { bool, func, number, shape, string } from 'prop-types';
import css from './SectionHelpHead.module.css';

const SectionHelpHead = props => {
  const {
    title,
    subTitle
  } = props;

  return (
    <div className={css.background}>
      <div className={css.breadcrumb}>
        <div className={css.subTitle}>
          {subTitle}
        </div>
        <div className={css.title + ' ' + (subTitle ? css.hasSub : "")}>
          {title}
        </div>
      </div>
    </div>
  )
}
SectionHelpHead.defaultProps = {
  subTitle: null,
  title: null,
};

SectionHelpHead.propTypes = {
  title: string,
  subTitle: string
};

export default SectionHelpHead;
