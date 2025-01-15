import React from 'react';
import classNames from 'classnames';
import { propTypes } from '../../util/types';

/**
 * A component that renders a user's display name.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {propTypes.user|propTypes.currentUser} props.user - The user object
 * @param {string} [props.deletedUserDisplayName] - The display name for deleted users
 * @param {string} [props.bannedUserDisplayName] - The display name for banned users
 * @returns {JSX.Element} User display name component
 */
const UserDisplayName = props => {
  const {
    rootClassName,
    className,
    user,
    intl,
    deletedUserDisplayName,
    bannedUserDisplayName,
  } = props;
  const hasAttributes = user && user.attributes;
  const userIsDeleted = hasAttributes && user.attributes.deleted;
  const userIsBanned = hasAttributes && user.attributes.banned;
  const userHasProfile = hasAttributes && user.attributes.profile;
  const userDisplayName = userHasProfile && user.attributes.profile.displayName;

  const deletedUserDisplayNameInUse = deletedUserDisplayName
    ? deletedUserDisplayName
    : intl.formatMessage({
        id: 'UserDisplayName.deleted',
      });

  const bannedUserDisplayNameInUse = bannedUserDisplayName
    ? bannedUserDisplayName
    : intl.formatMessage({
        id: 'UserDisplayName.banned',
      });

  const displayName = userDisplayName
    ? userDisplayName
    : userIsDeleted
    ? deletedUserDisplayNameInUse
    : userIsBanned
    ? bannedUserDisplayNameInUse
    : null;

  const classes = classNames(rootClassName, className);
  return <span className={classes}>{displayName}</span>;
};

export default UserDisplayName;
