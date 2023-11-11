import React, { useState } from 'react';
import css from './SectionHelpfulQuiz.module.css';
import { number, string } from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

const SectionHelpfulQuiz = props => {
  const {
    quizType,
    bodyText
  } = props;

  return (
    <div className={css.root}>
      {quizType == 1 && <FontAwesomeIcon icon={faCircleCheck} className={css.fontIcon} />}
      <div className={css.bodyText}>{bodyText}</div>
      {quizType == 0 && <div className={css.buttonYN}>Yes</div>}
      {quizType == 0 && <div className={css.buttonYN}>No</div>}
    </div>
  )
}

SectionHelpfulQuiz.defaultProps = {
  quizType: 0,
  bodyText: null
};

SectionHelpfulQuiz.propTypes = {
  quizType: number,
  bodyText: string
};

export default SectionHelpfulQuiz;
