import React from 'react';
import { number, string } from 'prop-types';
import css from './SectionBreadcrumb.module.css';

const SectionBreadcrumb = props => {
  const {
    currentPath,
    middlePath,
    title,
    subTitle,
    secondary
  } = props;

  return (
    <div className={secondary == 1 ? css.background_secondary : css.background}>
      <div className={css.breadcrumb}>
        <div className={css.path}>
          <div>Home</div>
          <div>&gt;</div>
          {middlePath &&
            (<>
            <div>{middlePath}</div>
            <div>&gt;</div>
            </>)
          }
          <div className={css.current}>{currentPath}</div>
        </div>
        <div className={css.title + ' ' + (subTitle ? css.hasSub:"")}>
          {title}
        </div>
        <div className={css.subTitle}>
          {subTitle}
        </div>
      </div>
    </div>
  )
}
SectionBreadcrumb.defaultProps = {
  currentPath: null,
  middlePath: null,
  title: null,
  subTitle: null,
  secondary: 0
};

SectionBreadcrumb.propTypes = {
  currentPath: string,
  middlePath: string,
  title: string,
  subTitle: string,
  secondary: number
};

export default SectionBreadcrumb;
