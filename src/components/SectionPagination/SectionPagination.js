import React, { useState } from 'react';
import { number } from 'prop-types';
import css from './SectionPagination.module.css';

const SectionPagination = props => {
  const {
    total,
    current
  } = props;

  return (
    <div className={css.root}>
      <div className={css.pagebutton}>Prev</div>
      <div className={css.pagebutton_active}>1</div>
      <div className={css.pagebutton}>2</div>
      <div className={css.pagebutton}>3</div>
      <div className={css.pagebutton}>4</div>
      <div className={css.pagebutton}>Next</div>
    </div>
  )
}
SectionPagination.defaultProps = {
  total: 1,
  current: 1
};

SectionPagination.propTypes = {
  total: number,
  current: number
};

export default SectionPagination;
