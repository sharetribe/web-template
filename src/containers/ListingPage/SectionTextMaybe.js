import React from 'react';
import { Heading } from '../../components';
import { richText } from '../../util/richText';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const SectionTextMaybe = props => {
  const { text, heading, showAsIngress = false } = props;
  const textClass = showAsIngress ? css.ingress : css.text;
  const content = richText(text, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    breakChars: '/',
  });

  const originalLabel = heading || '';
  const tooltipMatch = originalLabel.match(/\[(.*?)\]/);
  const newLabel = originalLabel.replace(/\[.*?\]/g, '').trim();
  const tooltip = tooltipMatch ? tooltipMatch[1] : '';

  return text ? (
    <section className={css.sectionText}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {newLabel}
          {tooltip && <span className={css.detailTooltip}> {tooltip}</span>}
        </Heading>
      ) : null}
      <p className={textClass}>{content}</p>
    </section>
  ) : null;
};

export default SectionTextMaybe;
