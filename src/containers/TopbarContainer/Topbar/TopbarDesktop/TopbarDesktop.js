import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom'; // Import withRouter
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { propTypes } from '../../../../util/types';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
} from '../../../../components';

import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';
import CustomLinksMenu from './CustomLinksMenu/CustomLinksMenu';

import css from './TopbarDesktop.module.css';
import SocialBar from '../../../../components/SocialBar/SocialBar';

function SignupLink() {
  return (
    <NamedLink name="SignupPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );
}

function LoginLink() {
  return (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );
}

function InboxLink({ notificationCount, currentUserHasListings }) {
  const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;
  return (
    <NamedLink
      className={css.topbarLink}
      name="InboxPage"
      params={{ tab: currentUserHasListings ? 'sales' : 'orders' }}
    >
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.inbox" />
        {notificationDot}
      </span>
    </NamedLink>
  );
}

function ProfileMenu({ currentPage, currentUser, onLogout, userRole }) {
  const currentPageClass = (page) => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  return (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        <MenuItem key="CMSPage">
          {userRole === 'provider' && (
            <NamedLink
              className={classNames(css.menuLink, currentPageClass('CMSPage'))}
              name="CMSPage"
              params={{ pageId: 'overview' }}
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.overview" />
            </NamedLink>
          )}
        </MenuItem>
        <MenuItem key="ManageListingsPage">
          {userRole === 'provider' && (
            <NamedLink
              className={classNames(css.menuLink, currentPageClass('ManageListingsPage'))}
              name="ManageListingsPage"
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.yourListingsLink" />
            </NamedLink>
          )}
        </MenuItem>
        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.menuLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.profileSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.menuLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function TopbarDesktop(props) {
  const {
    className,
    config,
    customLinks,
    currentUser,
    currentPage,
    rootClassName,
    currentUserHasListings,
    notificationCount,
    intl,
    isAuthenticated,
    onLogout,
    onSearchSubmit,
    initialSearchFormValues,
    searchParams,
    location, // Destructure location prop provided by withRouter
  } = props;

  const [mounted, setMounted] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [language, setLanguage] = useState('it'); // State for managing language

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolling(true);
      } else {
        setScrolling(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);

    // Redirect to the appropriate domain based on language
    if (selectedLanguage === 'en') {
      window.location.href = 'https://clubjoy.co'; // Redirect to English version
    } else {
      window.location.href = 'https://clubjoy.it'; // Redirect to Italian version
    }
  };

  const classes = classNames(rootClassName || css.root, className, {
    [css.scrolling]: scrolling,
    [css.whiteBackground]: scrolling,
  });

  const { marketplaceName } = config;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;
  const userRole = currentUser?.attributes?.profile?.publicData?.role;
  // Determine if the current page is the landing page based on the pathname
  const isLandingPage = location.pathname === '/';

  // const search = !isLandingPage ? <LandingSearchBarForm onSearchSubmit={onSearchSubmit} /> : null; // Only render TopbarSearchForm if not on landing page

  const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;
  const inboxLink = authenticatedOnClientSide ? (
    <NamedLink
      className={css.inboxLink}
      name="InboxPage"
      params={{ tab: currentUserHasListings ? 'sales' : 'orders' }}
    >
      <span className={css.inbox}>
        <FormattedMessage id="TopbarDesktop.inbox" />
        {notificationDot}
      </span>
    </NamedLink>
  ) : null;

  const currentPageClass = (page) => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const inboxLinkMaybe = authenticatedOnClientSide ? (
    <InboxLink
      notificationCount={notificationCount}
      currentUserHasListings={currentUserHasListings}
    />
  ) : null;

  const profileMenuMaybe = authenticatedOnClientSide ? (
    <ProfileMenu
      currentPage={currentPage}
      currentUser={currentUser}
      onLogout={onLogout}
      userRole={userRole}
    />
  ) : null;
  const signupLinkMaybe = isAuthenticatedOrJustHydrated ? null : <SignupLink />;
  const loginLinkMaybe = isAuthenticatedOrJustHydrated ? null : <LoginLink />;

  const signupBusinessLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="bSignupPage" className={css.loginLink}>
      <span className={css.login}>Business</span>
    </NamedLink>
  );

  return (
    <nav className={classes}>
      {isLandingPage ? (
        <>
          <div className={css.leftContent}>
            <LinkedLogo
              className={css.logoLink}
              layout="desktop"
              logoSettings={{ format: 'image', height: 60 }}
              alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
            />
          </div>
          <div className={css.rightContent}>
            {userRole === 'provider' && (
              <NamedLink className={css.createListingLink} name="NewListingPage">
                <span className={css.createListing}>
                  <FormattedMessage id="TopbarDesktop.createListing" />
                </span>
              </NamedLink>
            )}
            <SocialBar />
            <NamedLink className={css.createListingLink} name="GiftCardsPage">
              <span className={css.createListing}>Gift cards</span>
            </NamedLink>

            <CustomLinksMenu
              currentPage={currentPage}
              customLinks={customLinks}
              intl={intl}
              hasClientSideContentReady={
                authenticatedOnClientSide || !isAuthenticatedOrJustHydrated
              }
            />
            {inboxLinkMaybe}
            {profileMenuMaybe}
            <div className={css.authLinks}>
              {signupBusinessLink}
              {signupLinkMaybe}
              {loginLinkMaybe}
            </div>

            <select
              className={css.languageSelector}
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="it">IT</option>
              <option value="en">EN</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div className={css.leftContent}>
            <LinkedLogo
              className={css.logoLink}
              logoSettings={{ format: 'image', height: 60 }}
              layout="desktop"
              alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
            />
            {/* search */}
          </div>
          <div className={css.rightContent}>
            <NamedLink className={css.createListingLink} name="GiftCardsPage">
              <span className={css.createListing}>Gift cards</span>
            </NamedLink>
            {userRole === 'provider' && (
              <NamedLink className={css.createListingLink} name="NewListingPage">
                <span className={css.createListing}>
                  <FormattedMessage id="TopbarDesktop.createListing" />
                </span>
              </NamedLink>
            )}
            {inboxLinkMaybe}
            {profileMenuMaybe}
            <div className={css.authLinks}>
              {signupBusinessLink}
              {signupLinkMaybe}
              {loginLinkMaybe}
            </div>

            <select
              className={classNames(css.languageSelector, css.smallLanguageSelector)} // Add a new class here
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="it">IT</option>
              <option value="en">EN</option>
            </select>
          </div>
        </>
      )}
    </nav>
  );
}

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  config: null,
};

TopbarDesktop.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentPage: string,
  isAuthenticated: bool.isRequired,
  onLogout: func.isRequired,
  notificationCount: number,
  onSearchSubmit: func.isRequired,
  initialSearchFormValues: object,
  intl: intlShape.isRequired,
  config: object,
  location: object.isRequired,
};

// Wrap TopbarDesktop with withRouter to get access to the location prop
export default withRouter(TopbarDesktop);