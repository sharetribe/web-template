import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import Switch from "react-switch";

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { AccessRole } from '../../../util/roles';
import { ACCOUNT_SETTINGS_PAGES } from '../../../routing/routeConfiguration';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { propTypes } from '../../../util/types';
import { parse } from '../../../util/urlHelpers';
import { createResourceLocatorString } from '../../../util/routes';

import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import './styles.css';
// NOTE: for hide scrollbar
import "./hideScrollBar.css";

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
  IconCategoryUrn,
  IconCategoryArt,
  IconArrowHead,
  
} from '../..';

// import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';
// import TopbarSearchFormCommission from '../TopbarSearchFormCommission/TopbarSearchFormCommission';

import css from './TopbarCategories.module.css';

export const validUrlQueryParamsFromProps = props => {
  const { history } = props;

  const { ...searchInURL } = parse(history.location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  return { ...searchInURL };
};

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
    history,
    handleShowMap,
    isMapShow,
  } = props;

  console.log('categories');
  console.log(categories);
  
  const [mounted, setMounted] = useState(false);
  const isAccess = AccessRole(props,'admin');

  // start scroller
  const [categoryActionActive,setCategoryActionActive] = useState(false);
  const urlQueryParams = validUrlQueryParamsFromProps(props);

    const Card = ({ onClick, variant, index }) =>  {
      const active = variant.option == urlQueryParams.pub_category ? classNames( css.categoryContainner, css.active) : css.categoryContainner ;

      return variant.option !== 'other'?
      (<div key={index} className={active}>
        <div onClick={onClick} className={css.categoryLabel}>
          {categoryImage(variant.option)}
          <div >
            {variant.label}
          </div>
        </div>
        
      </div>): null
    }
  // end scroller

  useEffect(() => {
    setMounted(true);
    // categoryRender();
  }, []);

  const marketplaceName = appConfig.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;
  const isAuthenticatedAndAccess = isAuthenticated && isAccess;
  const categoryLineRef = React.createRef();
  const categoryContainerRef = React.createRef();
  const scrollRightButtonref = React.createRef();
  const scrollLeftButtonref = React.createRef();

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

  const routeConfiguration = useRouteConfiguration();

  const categoryAction = (name) => {
    const urlQueryParams = validUrlQueryParamsFromProps(props);
    urlQueryParams.pub_category = name;
    setCategoryActionActive(name);
    
    history.push(createResourceLocatorString('Home', routeConfiguration, {}, urlQueryParams));
  }

  const renderLeftNav = (onClick, scrolBar) => {
    const { isFirstItemVisible, scrollPrev } =
    React.useContext(VisibilityContext);
    const show = isFirstItemVisible ?{'display':'none'}:{'display':'block'};

    return (
      <div className={css.scrollerContainerLeft} style={show} >
        <button className={css.navLeft} onClick={() => scrollPrev()}>
          <div className={css.navArrowWrapper}>
            <IconArrowHead direction="left" size="small" className={css.arrowHead} />
          </div>
        </button>
      </div>
    );
  };
  const renderRightNav = (onClick, scrolBar) => {
    const { isLastItemVisible, scrollNext } = React.useContext(VisibilityContext);
    const show = isLastItemVisible ?{'display':'none'}:{'display':'block'};

    return (
      <div className={css.scrollerContainerRight} style={show} >
        <button disabled={isLastItemVisible} className={css.navRight} onClick={() => scrollNext()}>
          <div className={css.navArrowWrapper}>
            <IconArrowHead direction="right" size="small" className={css.arrowHead} />
          </div>
        </button>
      </div>
    );
  };

  const categoryImage = (name) => {
    switch (name) {
      case 'boat':
        return <IconCategoryBoat />
        break;
    
      case 'jewelry':
        return <IconCategoryJewerly />
        break;
    
      case 'omg':
        return <IconCategoryOmg />
        break;
    
      case 'plane':
        return <IconCategoryPlane />
        break;
    
      case 'urn':
        return <IconCategoryUrn />
        break;
    
      case 'art':
        return <IconCategoryArt />
        break;
    
      default:
        return <IconCategoryPlane />
        break;
    }
    
  }

  const labelShowMApSwitcher = (isMapShow)=>{
    if(isMapShow){
      return 'Hide map';
    }else{
      return 'Show map';
    }
  }


  return (
    <nav className={classes}>
      <div className={css.categoryIconsContainner}>
        
        <div ref={categoryContainerRef} className={css.categoryScrollerContainner}>
          <div ref={categoryLineRef} >
            <ScrollMenu LeftArrow={renderLeftNav} RightArrow={renderRightNav}>
              {categories.map((variant,index) => (

                <Card
                  variant={variant}
                  key={index}
                  onClick={()=>categoryAction(variant.option)}
                  index={index}
                />
              ))}
            </ScrollMenu>
          </div>
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
      <div className={css.searchModalButtonContainer}>
        <label className={css.showMapSwitcher}>
          <span>{labelShowMApSwitcher(isMapShow)}</span>
          <span className={css.mapSwitcherContainer}>
            <Switch width={44} height={20} onColor={'#0095cd'} uncheckedIcon={false} checkedIcon={false} onChange={handleShowMap} checked={isMapShow} />
          </span>
        </label>
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
