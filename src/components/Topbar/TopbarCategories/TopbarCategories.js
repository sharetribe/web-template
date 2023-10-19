import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { AccessRole } from '../../../util/roles';
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
  SecondaryButtonInline,
  IconCategoryBoat,
  IconCategoryTest,
  IconCategoryJewerly,
  IconCategoryOmg,
  IconCategoryPlane,
} from '../..';

// import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';
// import TopbarSearchFormCommission from '../TopbarSearchFormCommission/TopbarSearchFormCommission';

import css from './TopbarCategories.module.css';

const TopbarCategories = props => {
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
    categories,
    searchModalOpen,
  } = props;
  const [mounted, setMounted] = useState(false);
  
  const isAccess = AccessRole(props,'admin');

  console.log('TopbarCategories');
  console.log(categories);
  console.log(searchModalOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketplaceName = appConfig.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;
  const isAuthenticatedAndAccess = isAuthenticated && isAccess;

  const classes = classNames(rootClassName || css.root, className);

  const isCommissionPage = currentPage == 'CommissionPage'? true : false;

  const search = '';

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
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;

  const searchModalLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );

  const categoryImage = (name) => {
    console.log('categoryImage');
    console.log(name);
    switch (name) {
      case 'boat':
        return <IconCategoryBoat  />
        break;
    
      case 'jewelry':
        return <IconCategoryJewerly  />
        break;
    
      case 'omg':
        return <IconCategoryOmg  />
        break;
    
      case 'plane':
        return <IconCategoryPlane  />
        break;
    
      default:
        return <IconCategoryPlane  />
        break;
    }
    
  }

  return (
    <nav className={classes}>
      {/* <NamedLink className={css.createListingLink} name="NewListingPage">
        <span className={css.createListing}>
          <FormattedMessage id="TopbarDesktop.createListing" />
        </span>
      </NamedLink> */}
      <div className={css.categoryIconsContainner}>
        <div className={css.categoriesList}>
            {categories.map((variant,index) => (
              <div key={index} className={css.categoryContainner}>
                <div className={css.categoryLabel}>
                  {categoryImage(variant.option)}
                  <div >
                    {variant.label}
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        </div>
        <div className={css.searchModalButtonContainer}>
            <SecondaryButtonInline
                className={css.searchModalButton}
                type="submit"
                onClick={searchModalOpen}
                // inProgress={submitInProgress}
                // disabled={submitDisabled}
                // ready={pristineSinceLastSubmit}
              >
                {/* filters */}
                <FormattedMessage
                  id="SearchFiltersMobile.filtersButtonLabel"
                  className={css.mapIconText}
                />
              </SecondaryButtonInline>
        </div>

      {/* {searchModalLink} */}
    </nav>
  );
};

TopbarCategories.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  appConfig: null,
};

TopbarCategories.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentPage: string,
  // isAuthenticated: bool.isRequired,
  // onLogout: func.isRequired,
  notificationCount: number,
  // onSearchSubmit: func.isRequired,
  initialSearchFormValues: object,
  intl: intlShape.isRequired,
  appConfig: object,
};

export default TopbarCategories;