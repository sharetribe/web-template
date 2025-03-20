import React from 'react';
import { useIntl } from '../../util/reactIntl';
import classNames from 'classnames';
import {
  ensureUser,
  ensureCurrentUser,
  userDisplayNameAsString,
  userAbbreviatedName,
} from '../../util/data';
import { isUserAuthorized } from '../../util/userHelpers';

import { ResponsiveImage, IconBannedUser, NamedLink } from '../../components/';

import css from './Avatar.module.css';

// Responsive image sizes hint
const AVATAR_SIZES = '40px';
const AVATAR_SIZES_MEDIUM = '60px';
const AVATAR_SIZES_LARGE = '96px';

const AVATAR_IMAGE_VARIANTS = [
  // 40x40
  'square-xsmall',

  // 80x80
  'square-xsmall2x',

  // 240x240
  'square-small',

  // 480x480
  'square-small2x',
];

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object?} props.user API entity
 * @param {string} props.renderSizes
 * @param {boolean} props.disableProfileLink
 * @returns {JSX.Element} search icon
 */
export const Avatar = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    initialsClassName,
    user,
    renderSizes = AVATAR_SIZES,
    disableProfileLink,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const userIsCurrentUser = user && user.type === 'currentUser';
  const avatarUser = userIsCurrentUser ? ensureCurrentUser(user) : ensureUser(user);
  // I.e. the status is active, not pending-approval or banned
  const isUnauthorizedUser = userIsCurrentUser && !isUserAuthorized(user);
  const variant = user?.attributes?.state;
  //'pending-approval'

  const isBannedUser = avatarUser.attributes.banned;
  const isDeletedUser = avatarUser.attributes.deleted;

  const defaultUserDisplayName = isBannedUser
    ? intl.formatMessage({ id: 'Avatar.bannedUserDisplayName' })
    : isDeletedUser
    ? intl.formatMessage({ id: 'Avatar.deletedUserDisplayName' })
    : '';

  const defaultUserAbbreviatedName = '';

  const displayName = userDisplayNameAsString(avatarUser, defaultUserDisplayName);
  const abbreviatedName = userAbbreviatedName(avatarUser, defaultUserAbbreviatedName);
  const rootProps = { className: classes, title: displayName };
  const linkProps =
    isUnauthorizedUser && avatarUser.id
      ? {
          name: 'ProfilePageVariant',
          params: { id: avatarUser.id.uuid, variant },
        }
      : avatarUser.id
      ? { name: 'ProfilePage', params: { id: avatarUser.id.uuid } }
      : { name: 'ProfileBasePage' };
  const hasProfileImage = avatarUser.profileImage && avatarUser.profileImage.id;
  const profileLinkEnabled = !disableProfileLink;

  if (isBannedUser || isDeletedUser) {
    return (
      <div {...rootProps}>
        <IconBannedUser className={css.bannedUserIcon} />
      </div>
    );
  } else if (hasProfileImage && profileLinkEnabled) {
    return (
      <NamedLink {...rootProps} {...linkProps}>
        <ResponsiveImage
          rootClassName={css.avatarImage}
          alt={displayName}
          image={avatarUser.profileImage}
          variants={AVATAR_IMAGE_VARIANTS}
          sizes={renderSizes}
        />
      </NamedLink>
    );
  } else if (hasProfileImage) {
    return (
      <div {...rootProps}>
        <ResponsiveImage
          rootClassName={css.avatarImage}
          alt={displayName}
          image={avatarUser.profileImage}
          variants={AVATAR_IMAGE_VARIANTS}
          sizes={renderSizes}
        />
      </div>
    );
  } else if (profileLinkEnabled) {
    // Placeholder avatar (initials)
    return (
      <NamedLink {...rootProps} {...linkProps}>
        <span className={initialsClassName || css.initials}>{abbreviatedName}</span>
      </NamedLink>
    );
  } else {
    // Placeholder avatar (initials)
    return (
      <div {...rootProps}>
        <span className={initialsClassName || css.initials}>{abbreviatedName}</span>
      </div>
    );
  }
};

export default Avatar;

export const AvatarSmall = props => (
  <Avatar
    rootClassName={css.smallAvatar}
    initialsClassName={css.initialsSmall}
    renderSizes={AVATAR_SIZES_MEDIUM}
    {...props}
  />
);
AvatarSmall.displayName = 'AvatarSmall';

export const AvatarMedium = props => (
  <Avatar
    rootClassName={css.mediumAvatar}
    initialsClassName={css.initialsMedium}
    renderSizes={AVATAR_SIZES_MEDIUM}
    {...props}
  />
);
AvatarMedium.displayName = 'AvatarMedium';

export const AvatarLarge = props => (
  <Avatar
    rootClassName={css.largeAvatar}
    initialsClassName={css.initialsLarge}
    renderSizes={AVATAR_SIZES_LARGE}
    {...props}
  />
);
AvatarLarge.displayName = 'AvatarLarge';
