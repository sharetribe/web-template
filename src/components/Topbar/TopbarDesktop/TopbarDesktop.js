import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../routing/routeConfiguration';
import { propTypes } from '../../../util/types';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  Button,
} from '../../../components';

import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';

import css from './TopbarDesktop.module.css';

const TopbarDesktop = props => {
  const {
    className,
    appConfig,
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
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketplaceName = appConfig.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  const search = (
    <TopbarSearchForm
      className={css.searchLink}
      desktopInputRoot={css.topbarSearchWithLeftPadding}
      onSubmit={onSearchSubmit}
      initialValues={initialSearchFormValues}
      appConfig={appConfig}
    />
  );

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

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const profileMenu = authenticatedOnClientSide ? (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        <MenuItem key="ManageListingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, currentPageClass('ManageListingsPage'))}
            name="ManageListingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.yourListingsLink" />
          </NamedLink>
        </MenuItem>

        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.profileSettingsLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.profileSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="FAQS">
          <a
            className={classNames(css.yourListingsLink, currentPageClass('AccountSettingsPage'))}
            name="FAQS"
            href="https://www.rundo.com.ar/p/frequent-asked-questions"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="Preguntas Frecuentes" />
          </a>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;

  const signupLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="SignupPage" className={css.signupLink}>
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );

  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );
  const handleButtonClick = () => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'BtnWspHeader');
      setTimeout(() => {
        window.open('https://wa.me/5492944232664', '_blank');
      }, 300);
    } else {
      console.error('Meta Pixel no está definido');
    }
  };

  const handleCreateListingClick = () => {
    console.log('PublicArticleBtn1'); // Log para verificar
    if (typeof fbq !== 'undefined') {
      fbq('track', 'PublicArticleBtn1');
    } else {
      console.error('Meta Pixel no está definido');
    }
  };

  return (
    <nav className={classes}>
      <LinkedLogo
        className={css.logoLink}
        layout="desktop"
        alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
      />
      {search}
      <div style={{ width: '20%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <button onClick={handleButtonClick} style={{ border: 'none', cursor: 'pointer' }}>
          <img
            src="/static/icons/whatsapp.png"
            alt="WhatsApp"
            style={{ marginLeft: '10%', width: '36.5px', height: '35.5px' }}
          />
        </button>
      </div>
      <button onClick={handleCreateListingClick} style={{ border: 'none' }}>
        <NamedLink onClick={handleCreateListingClick} className={css.createListingLink} name="NewListingPage">
          <span className={css.createListing}>
            <FormattedMessage id="TopbarDesktop.createListing" />
          </span>
        </NamedLink>
      </button>
      {inboxLink}
      {profileMenu}

      {loginLink}
    </nav>
  );
};

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  appConfig: null,
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
  appConfig: object,
};

export default TopbarDesktop;
