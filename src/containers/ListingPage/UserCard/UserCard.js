import React, { useEffect, useState } from 'react';
import truncate from 'lodash/truncate';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { richText } from '../../../util/richText';
import { ensureUser, ensureCurrentUser } from '../../../util/data';
import { propTypes } from '../../../util/types';

import { AvatarLarge, NamedLink, InlineTextButton } from '../../../components';

import css from './UserCard.module.css';

// Approximated collapsed size so that there are ~three lines of text
// in the desktop layout in the author section of the ListingPage.
const BIO_COLLAPSED_LENGTH = 170;
const MIN_LENGTH_FOR_LONG_WORDS = 20;

const truncated = s => {
  return truncate(s, {
    length: BIO_COLLAPSED_LENGTH,

    // Allow truncated text end only in specific characters. This will
    // make the truncated text shorter than the length if the original
    // text has to be shortened and the substring ends in a separator.
    //
    // This ensures that the final text doesn't get cut in the middle
    // of a word.
    separator: /\s|,|\.|:|;/,
    omission: '…',
  });
};

const ExpandableBio = props => {
  const [expand, setExpand] = useState(false);
  const { className, bio } = props;
  const bioWithLinks = richText(bio, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });
  const truncatedBio = richText(truncated(bio), {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    breakChars: '/',
  });

  const handleShowMoreClick = () => {
    setExpand(true);
  };
  const showMore = (
    <InlineTextButton rootClassName={css.showMore} onClick={handleShowMoreClick}>
      <FormattedMessage id="UserCard.showFullBioLink" />
    </InlineTextButton>
  );
  return (
    <p className={className}>
      {expand ? bioWithLinks : truncatedBio}
      {bio.length >= BIO_COLLAPSED_LENGTH && !expand ? showMore : null}
    </p>
  );
};

/**
 * The UserCard component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.user | propTypes.currentUser} props.user - The user
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {function} props.onContactUser - The on contact user function
 * @param {boolean} [props.showContact] - Whether to show the contact user button
 * @returns {JSX.Element} user card component
 */
const UserCard = props => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { rootClassName, className, user, currentUser, onContactUser, showContact = true } = props;

  const userIsCurrentUser = user && user.type === 'currentUser';
  const ensuredUser = userIsCurrentUser ? ensureCurrentUser(user) : ensureUser(user);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const isCurrentUser =
    ensuredUser.id && ensuredCurrentUser.id && ensuredUser.id.uuid === ensuredCurrentUser.id.uuid;
  const { displayName, bio } = ensuredUser.attributes.profile;

  const handleContactUserClick = () => {
    onContactUser(user);
  };

  const hasBio = !!bio;
  const classes = classNames(rootClassName || css.root, className);
  const linkClasses = classNames(css.links, {
    [css.withBioMissingAbove]: !hasBio,
  });

  const separator =
    (mounted && isCurrentUser) || !showContact ? null : (
      <span className={css.linkSeparator}>•</span>
    );

  const contact = showContact ? (
    <InlineTextButton
      rootClassName={css.contact}
      onClick={handleContactUserClick}
      enforcePagePreloadFor="SignupPage"
    >
      <FormattedMessage id="UserCard.contactUser" />
    </InlineTextButton>
  ) : null;

  const editProfileMobile = (
    <span className={css.editProfileMobile}>
      <span className={css.linkSeparator}>•</span>
      <NamedLink name="ProfileSettingsPage">
        <FormattedMessage id="ListingPage.editProfileLink" />
      </NamedLink>
    </span>
  );

  const editProfileDesktop =
    mounted && isCurrentUser ? (
      <NamedLink className={css.editProfileDesktop} name="ProfileSettingsPage">
        <FormattedMessage id="ListingPage.editProfileLink" />
      </NamedLink>
    ) : null;

  const links = ensuredUser.id ? (
    <p className={linkClasses}>
      <NamedLink className={css.link} name="ProfilePage" params={{ id: ensuredUser.id.uuid }}>
        <FormattedMessage id="UserCard.viewProfileLink" />
      </NamedLink>
      {separator}
      {mounted && isCurrentUser ? editProfileMobile : contact}
    </p>
  ) : null;

  return (
    <div className={classes}>
      <div className={css.content}>
        <AvatarLarge className={css.avatar} user={user} />
        <div className={css.info}>
          <div className={css.headingRow}>
            <FormattedMessage id="UserCard.heading" values={{ name: displayName }} />
            {editProfileDesktop}
          </div>
          {hasBio ? <ExpandableBio className={css.desktopBio} bio={bio} /> : null}
          {links}
        </div>
      </div>
      {hasBio ? <ExpandableBio className={css.mobileBio} bio={bio} /> : null}
    </div>
  );
};

export default UserCard;
