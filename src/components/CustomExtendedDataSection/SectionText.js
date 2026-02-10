import React from 'react';
import classNames from 'classnames';
import { Heading } from '../../components';
import { richText } from '../../util/richText';

import css from './CustomExtendedDataSection.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const SectionText = props => {
  const {
    text,
    heading,
    headingClassName,
    className,
    rootClassName,
    showAsIngress = false,
  } = props;
  const textClass = showAsIngress ? css.ingress : css.text;
  const content = richText(text, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    breakChars: '/',
  });

  const classes = classNames(rootClassName || css.sectionText, className);

  return text ? (
    <section className={classes}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading} className={headingClassName}>
          {heading}
        </Heading>
      ) : null}
      <p className={textClass}>{content}</p>
    </section>
  ) : null;
};

export default SectionText;
