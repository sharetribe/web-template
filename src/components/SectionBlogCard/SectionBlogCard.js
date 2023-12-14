import React, { useState } from 'react';
import { string } from 'prop-types';
import css from './SectionBlogCard.module.css';
import NamedLink from '../NamedLink/NamedLink';

const SectionBlogCard = props => {
  const { image, title, description } = props;

  return (
    <div className={css.root}>
      <div>
        <img src={image} className={css.cardimaage} />
      </div>
      <NamedLink className={css.title} name="BlogArticlePage">
        {title}
      </NamedLink>
      <div className={css.description}>{description}</div>
    </div>
  );
};
SectionBlogCard.defaultProps = {
  image: null,
  title: null,
  description: null,
};

SectionBlogCard.propTypes = {
  image: string,
  title: string,
  description: string,
};

export default SectionBlogCard;
