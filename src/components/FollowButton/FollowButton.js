import React from 'react';
import { func, bool, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { PrimaryButton, SecondaryButton } from '../Button/Button';

import css from './FollowButton.module.css';

const FollowButton = props => {
  const {
    className,
    rootClassName,
    isFollowing,
    onFollow,
    onUnfollow,
    followInProgress,
    unfollowInProgress,
    disabled,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const inProgress = followInProgress || unfollowInProgress;

  if (isFollowing) {
    return (
      <SecondaryButton
        className={classes}
        onClick={onUnfollow}
        inProgress={unfollowInProgress}
        disabled={disabled || inProgress}
      >
        <FormattedMessage id="FollowButton.unfollow" />
      </SecondaryButton>
    );
  }

  return (
    <PrimaryButton
      className={classes}
      onClick={onFollow}
      inProgress={followInProgress}
      disabled={disabled || inProgress}
    >
      <FormattedMessage id="FollowButton.follow" />
    </PrimaryButton>
  );
};

FollowButton.defaultProps = {
  className: null,
  rootClassName: null,
  isFollowing: false,
  followInProgress: false,
  unfollowInProgress: false,
  disabled: false,
};

FollowButton.propTypes = {
  className: string,
  rootClassName: string,
  isFollowing: bool,
  onFollow: func.isRequired,
  onUnfollow: func.isRequired,
  followInProgress: bool,
  unfollowInProgress: bool,
  disabled: bool,
};

export default FollowButton; 