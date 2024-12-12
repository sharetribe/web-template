import React from 'react';
import classNames from 'classnames';

import css from './NotificationBadge.module.css';

/**
 * Small badge/dot with number inside.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {number} props.count the number of notifications
 * @returns {JSX.Element} badge component that shows how many notifications should be shown.
 */
const NotificationBadge = props => {
  const { className, rootClassName, count } = props;
  const classes = classNames(rootClassName || css.root, className);

  return <span className={classes}>{count}</span>;
};

export default NotificationBadge;
