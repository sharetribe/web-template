import React, { useState } from 'react';
import { bool, func, number, shape, string } from 'prop-types';
import css from './SectionHelpCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import NamedLink from '../NamedLink/NamedLink';

const SectionHelpCard = props => {
  const { title, content, buttonType } = props;

  return (
    <div className={css.root}>
      <div className={css.title}>{title}</div>
      <div className={css.content}>{content}</div>
      <div className={buttonType == 0 ? css.buttonPrimary : css.buttonSecondary}>
        <span>
          <NamedLink name="BlogPage">See all articles</NamedLink>
        </span>
        <FontAwesomeIcon icon={faArrowRight} className={css.fontIcon} />
      </div>
    </div>
  );
};
SectionHelpCard.defaultProps = {
  content: null,
  title: null,
  buttonType: 0,
};

SectionHelpCard.propTypes = {
  title: string,
  content: string,
  buttonType: number,
};

export default SectionHelpCard;
