import React from 'react';
import { richText } from '../../util/richText';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const SectionTextMaybe = props => {
  const { text, heading } = props;
  return text ? (
    <div className={css.sectionText}>
      <h2 className={css.textHeading}>{heading}</h2>
      <p className={css.text}>
        {richText(text, {
          longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
          longWordClass: css.longWord,
        })}
      </p>
    </div>
  ) : null;
};

export default SectionTextMaybe;
