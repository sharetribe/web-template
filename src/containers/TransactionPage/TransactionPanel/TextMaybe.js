import React from 'react';
import classNames from 'classnames';

import { richText } from '../../../util/richText';

import { Heading } from '../../../components';

import css from './TransactionPanel.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

// Functional component as a helper to build ActivityFeed section
const TextMaybe = props => {
  const { className, rootClassName, heading, text, showText, isOwn } = props;
  const classes = classNames(rootClassName || css.fieldContainer, className);
  const fieldMsgClasses = isOwn ? css.ownMessage : css.message;
  const fieldMsgLinkClassMaybe = isOwn ? { linkClass: css.ownMessageContentLink } : {};

  if (showText && text) {
    const textMessage = richText(text, {
      linkify: true,
      ...fieldMsgLinkClassMaybe,
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    });

    return (
      <div className={classes}>
        {heading ? (
          <Heading as="h3" rootClassName={css.fieldLabel}>
            {heading}
          </Heading>
        ) : null}
        <p className={fieldMsgClasses}>{textMessage}</p>
      </div>
    );
  }
  return null;
};

export default TextMaybe;
