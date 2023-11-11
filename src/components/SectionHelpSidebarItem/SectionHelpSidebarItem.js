import React, { useState } from 'react';
import { string, boolean } from 'prop-types';
import css from './SectionHelpSidebarItem.module.css';

const SectionHelpSidebarItem = props => {
  const {
    title,
    active
  } = props;

  return (
    <div className={active ? css.root_active : css.root}>
      <span className={css.text}>{title}</span>
    </div>
  )
}
SectionHelpSidebarItem.defaultProps = {
  title: null,
  active: false
};

SectionHelpSidebarItem.propTypes = {
  title: string,
  active: boolean
};

export default SectionHelpSidebarItem;
