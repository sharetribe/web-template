import React from 'react';
import { number, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import css from './FollowerCount.module.css';

const FollowerCount = props => {
  const { className, rootClassName, count } = props;

  const classes = classNames(rootClassName || css.root, className);
  const followerCount = count ?? 0;

  // Debug logging
  console.log('FollowerCount: received count prop =', count, 'calculated followerCount =', followerCount);

  if (followerCount === 0) {
    return (
      <div className={classes}>
        <FormattedMessage id="FollowerCount.noFollowers" />
      </div>
    );
  }

  return (
    <div className={classes}>
      <FormattedMessage
        id="FollowerCount.followersCount"
        values={{
          count: followerCount,
          strong: chunks => <strong>{chunks}</strong>,
        }}
      />
    </div>
  );
};

FollowerCount.defaultProps = {
  className: null,
  rootClassName: null,
  count: 0,
};

FollowerCount.propTypes = {
  className: string,
  rootClassName: string,
  count: number,
};

export default FollowerCount; 