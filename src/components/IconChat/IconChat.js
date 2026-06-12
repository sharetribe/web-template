import React from 'react';
import classNames from 'classnames';

import css from './IconChat.module.css';

/**
 * Chat bubble icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconChat = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className={css.bubbleBg} cx="24" cy="24" r="24" />
      <rect className={css.bubbleFg} x="10" y="11" width="28" height="18" rx="5" />
      <polygon className={css.bubbleFg} points="16,29 16,36 24,29" />
      <circle className={css.dot} cx="18" cy="20" r="2.2" />
      <circle className={css.dot} cx="24" cy="20" r="2.2" />
      <circle className={css.dot} cx="30" cy="20" r="2.2" />
    </svg>
  );
};

export default IconChat;
