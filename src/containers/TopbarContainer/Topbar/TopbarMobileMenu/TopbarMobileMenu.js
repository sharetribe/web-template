/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { ensureCurrentUser } from '../../../../util/data';
import { FormattedMessage } from '../../../../util/reactIntl';
import {
  isCreativeSellerApproved,
  isCommunityUser,
  isStudioUser,
} from '../../../../util/userHelpers';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
} from '../../../../components';
import { BASE_CREATE_LISTING_SEARCH_QUERY_PARAMS } from '../TopbarDesktop/CustomLinksMenu/PriorityLinks';
import {
  communityLinkConfig,
  studioLinkConfig,
} from '../TopbarDesktop/CustomLinksMenu/CustomLinksMenu';

import css from './TopbarMobileMenu.module.css';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { group, text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  // Note: if the config contains 'route' keyword,
  // then in-app linking config has been resolved already.
  if (type === 'internal' && route) {
    // Internal link
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.navigationLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated
 * @param {string?} props.currentPage
 * @param {boolean} props.currentUserHasListings
 * @param {Object?} props.currentUser API entity
 * @param {number} props.notificationCount
 * @param {Array<Object>} props.customLinks Contains object like { group, text, type, href, route }
 * @param {Function} props.onLogout
 * @param {Object} props.intl
 * @returns {JSX.Element} search icon
 */
const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    inboxTab,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
    intl,
  } = props;

  const user = ensureCurrentUser(currentUser);
  const userProfile = currentUser?.attributes?.profile || {};
  const isSeller = isCreativeSellerApproved(userProfile);
  const showCommunityLink = isCommunityUser(userProfile);
  const showStudioLink = isStudioUser(userProfile);
  const parsedCustomLinks = [
    ...customLinks,
    ...(showCommunityLink
      ? [communityLinkConfig(intl.formatMessage({ id: 'TopbarMobileMenu.communityLink' }))]
      : []),
    ...(showStudioLink
      ? [studioLinkConfig(intl.formatMessage({ id: 'TopbarMobileMenu.studioLink' }))]
      : []),
  ];

  const extraLinks = parsedCustomLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

  if (!isAuthenticated) {
    const signup = (
      <NamedLink name="SignupPage" className={css.signupLink}>
        <FormattedMessage id="TopbarMobileMenu.signupLink" />
      </NamedLink>
    );

    const login = (
      <NamedLink name="LoginPage" className={css.loginLink}>
        <FormattedMessage id="TopbarMobileMenu.loginLink" />
      </NamedLink>
    );

    const signupOrLogin = (
      <span className={css.authenticationLinks}>
        <FormattedMessage id="TopbarMobileMenu.signupOrLogin" values={{ signup, login }} />
      </span>
    );
    return (
      <div className={css.root}>
        <div className={css.content}>
          <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div>
          <div className={css.customLinksWrapper}>{extraLinks}</div>
          <div className={css.spacer} />
        </div>
      </div>
    );
  }

  const notificationCountBadge =
    notificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={notificationCount} />
    ) : null;

  const displayName = user.attributes.profile.firstName;
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  return (
    <div className={css.root}>
      <AvatarLarge className={css.avatar} user={currentUser} />
      <div className={css.content}>
        <span className={css.greeting}>
          <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
        </span>
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>

        <div className={css.accountLinksWrapper}>
          <NamedLink
            className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}
            name="InboxPage"
            params={{ tab: inboxTab }}
          >
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {notificationCountBadge}
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('FavoriteListingsPage'))}
            name="FavoriteListingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.favoriteListings" />
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ReferralProgramPage'))}
            name="ReferralProgramPage"
          >
            <FormattedMessage id="TopbarMobileMenu.referralProgram" />
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
          </NamedLink>
        </div>
        <div className={css.customLinksWrapper}>{extraLinks}</div>
        <div className={css.spacer} />
      </div>

      {isSeller && (
        <div className={css.footer}>
          <NamedLink
            name="ManageListingsPage"
            to={{ search: BASE_CREATE_LISTING_SEARCH_QUERY_PARAMS }}
            className={css.createNewListingLink}
          >
            <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
          </NamedLink>
        </div>
      )}
    </div>
  );
};

export default TopbarMobileMenu;
