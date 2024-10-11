import React from 'react';
import { string, oneOfType, bool } from 'prop-types';
import classNames from 'classnames';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import {
  ensureUser,
  ensureCurrentUser,
  userDisplayNameAsString,
  userAbbreviatedName,
} from '../../util/data';
import { isUserAuthorized } from '../../util/userHelpers';

import { ResponsiveImage, IconBannedUser, NamedLink } from '..';

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

export function AvatarComponent(props) {
  const {
    rootClassName,
    className,
    initialsClassName,
    user,
    renderSizes,
    disableProfileLink,
    intl,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const userIsCurrentUser = user && user.type === 'currentUser';
  const avatarUser = userIsCurrentUser ? ensureCurrentUser(user) : ensureUser(user);
  // I.e. the status is active, not pending-approval or banned
  const isUnauthorizedUser = userIsCurrentUser && !isUserAuthorized(user);
  const variant = user?.attributes?.state;
  // 'pending-approval'

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
  }
  if (hasProfileImage && profileLinkEnabled) {
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
  }
  if (hasProfileImage) {
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
  }
  if (profileLinkEnabled) {
    // Placeholder avatar (initials)
    return (
      <NamedLink {...rootProps} {...linkProps}>
        <span className={initialsClassName || css.initials}>{abbreviatedName}</span>
      </NamedLink>
    );
  }
  // Placeholder avatar (initials)
  return (
    <div {...rootProps}>
      <span className={initialsClassName || css.initials}>{abbreviatedName}</span>
    </div>
  );
}

AvatarComponent.defaultProps = {
  className: null,
  rootClassName: null,
  user: null,
  renderSizes: AVATAR_SIZES,
  disableProfileLink: false,
};

AvatarComponent.propTypes = {
  rootClassName: string,
  className: string,
  user: oneOfType([propTypes.user, propTypes.currentUser]),

  renderSizes: string,
  disableProfileLink: bool,

  // from injectIntl
  intl: intlShape.isRequired,
};

const Avatar = injectIntl(AvatarComponent);

export default Avatar;

export function AvatarSmall(props) {
  return (
    <Avatar
      rootClassName={css.smallAvatar}
      initialsClassName={css.initialsSmall}
      renderSizes={AVATAR_SIZES_MEDIUM}
      {...props}
    />
  );
}
AvatarSmall.displayName = 'AvatarSmall';

export function AvatarMedium(props) {
  return (
    <Avatar
      rootClassName={css.mediumAvatar}
      initialsClassName={css.initialsMedium}
      renderSizes={AVATAR_SIZES_MEDIUM}
      {...props}
    />
  );
}
AvatarMedium.displayName = 'AvatarMedium';

export function AvatarLarge(props) {
  return (
    <Avatar
      rootClassName={css.largeAvatar}
      initialsClassName={css.initialsLarge}
      renderSizes={AVATAR_SIZES_LARGE}
      {...props}
    />
  );
}
AvatarLarge.displayName = 'AvatarLarge';
