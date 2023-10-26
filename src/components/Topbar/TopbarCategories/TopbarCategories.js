import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { AccessRole } from '../../../util/roles';
import { ACCOUNT_SETTINGS_PAGES } from '../../../routing/routeConfiguration';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { propTypes } from '../../../util/types';
import { parse } from '../../../util/urlHelpers';
import { createResourceLocatorString } from '../../../util/routes';

import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';

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

const getItems = () =>
  Array(20)
    .fill(0)
    .map((_, ind) => ({ id: `element-${ind}` }));

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
    categoryTranslate,
  } = props;
  const [mounted, setMounted] = useState(false);
  
  const isAccess = AccessRole(props,'admin');
  // const categoryTranslate = {
  //   translate:0,
  //   showLeftScroll: false,
  //   showRightScroll: false,
  //   categoryIconsWeight: 0,
  //   categoryScrollContainerWidth: 0
  // };


  // start scroller
  const [items, setItems] = React.useState(getItems);
  const [selected, setSelected] = React.useState([]);
  const [position, setPosition] = React.useState(0);

  const isItemSelected = (id) => !!selected.find((el) => el === id);

  const handleClick =
    (id) =>
    ({ getItemById, scrollToItem }) => {
      const itemSelected = isItemSelected(id);

      setSelected((currentSelected) =>
        itemSelected
          ? currentSelected.filter((el) => el !== id)
          : currentSelected.concat(id)
      );
    };

    const LeftArrow = () => {
      const { isFirstItemVisible, scrollPrev } =
        React.useContext(VisibilityContext);
    
      return (
        <Arrow disabled={isFirstItemVisible} onClick={() => scrollPrev()}>
          Left
        </Arrow>
      );
    }
    
    const RightArrow  = () =>  {
      const { isLastItemVisible, scrollNext } = React.useContext(VisibilityContext);
    
      return (
        <Arrow disabled={isLastItemVisible} onClick={() => scrollNext()}>
          Right
        </Arrow>
      );
    }
    
    const Card = ({ onClick, selected, title, itemId }) =>  {
      const visibility = React.useContext(VisibilityContext);
    
      return (
        <div
          onClick={() => onClick(visibility)}
          style={{
            width: '160px',
          }}
          tabIndex={0}
        >
          <div className="card">
            <div>{title}</div>
            <div>visible: {JSON.stringify(!!visibility.isItemVisible(itemId))}</div>
            <div>selected: {JSON.stringify(!!selected)}</div>
          </div>
          <div
            style={{
              height: '200px',
            }}
          />
        </div>
      );
    }
  // end scroller

  







  const scrollRight = ()=>{
    console.log(categoryTranslate);
    if(categoryTranslate.translate + categoryTranslate.categoryContainerWidth <= categoryTranslate.categoryIconsWeight){
      categoryTranslate.translate = categoryTranslate.translate + categoryTranslate.categoryContainerWidth - 40;
    }else{
      categoryTranslate.translate = categoryTranslate.translate + categoryTranslate.categoryContainerWidth - 40;
    }
    categoryLineRef.current.style.transform = 'translateX(-'+categoryTranslate.translate+'px)';

    console.log(categoryLineRef);
  };
  const scrollLeft = ()=>{
    console.log(categoryTranslate);
    if(categoryTranslate.translate - categoryTranslate.categoryContainerWidth >= 0){
      categoryTranslate.translate = categoryTranslate.translate - categoryTranslate.categoryContainerWidth + 40;
    }else{
      categoryTranslate.translate = 0;
    }
    categoryLineRef.current.style.transform = 'translateX(-'+categoryTranslate.translate+'px)';
    console.log(categoryLineRef);
  };

  useEffect(() => {
    setMounted(true);
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
    
    history.push(createResourceLocatorString('Home', routeConfiguration, {}, urlQueryParams));
  }

  const renderLeftNav = (onClick, scrolBar) => {
    console.log('scrolBarLeft');
    console.log(scrolBar);
    return (
      <button className={css.navLeft} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="left" size="small" className={css.arrowHead} />
        </div>
      </button>
    );
  };
  const renderRightNav = (onClick, scrolBar) => {
    console.log('scrolBarRight');
    console.log(scrolBar);
    return (
      <button className={css.navRight} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="right" size="small" className={css.arrowHead} />
        </div>
      </button>
    );
  };

  const categoryImage = (name) => {
    console.log('categoryImage');
    console.log(name);
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

  const categoryRender = () => {
    console.log('categoryLineRef');
    const widthLine = categoryLineRef.current.offsetWidth;
    const widthContainer = categoryContainerRef.current.offsetWidth;
    console.log(categoryLineRef.current.offsetWidth);
    console.log(categoryContainerRef.current.offsetWidth);

    categoryTranslate.categoryContainerWidth = categoryContainerRef.current.offsetWidth;
    categoryTranslate.categoryLineWidth = categoryContainerRef.current.offsetWidth;


    if(widthContainer < widthLine){
      console.log('categoryTranslate.showRightScroll = true');
      categoryTranslate.showRightScroll = true;
      console.log(categoryTranslate);

      console.log('scrollRightButtonref');
      console.log(scrollRightButtonref.current.style.display = 'block');
      console.log('scrollLeftButtonref');
      console.log(scrollLeftButtonref.current.style.display = 'block');
    }else{
      console.log('scrollRightButtonref');
      console.log(scrollRightButtonref.current.style.display = 'none');
      console.log('scrollLeftButtonref');
      console.log(scrollLeftButtonref.current.style.display = 'none');
    }
    
    
    
    
  }

  useEffect(() => {
    // code to run after render goes here
    categoryRender();
  });

  console.log('categoryTranslate.showRightScroll');
  console.log(categoryTranslate.showRightScroll);
  console.log(categoryTranslate);
  const showRight = categoryTranslate.showRightScroll?{'display':'block'}:{'display':'inline'};
  console.log(showRight);

  return (
    <nav className={classes}>
      {/* <NamedLink className={css.createListingLink} name="NewListingPage">
        <span className={css.createListing}>
          <FormattedMessage id="TopbarDesktop.createListing" />
        </span>
      </NamedLink> */}

      {/* style="transform: translateX(-80px);" */}
      
      <div className={css.categoryIconsContainner}>
        <div className={css.scrollerContainerRight} ref={scrollRightButtonref} style={showRight} >{renderRightNav(scrollRight,categoryLineRef)}</div>
        <div className={css.scrollerContainerLeft} ref={scrollLeftButtonref} >{renderLeftNav(scrollLeft,categoryLineRef)}</div>
        
        <div ref={categoryContainerRef} className={css.categoryScrollerContainner}>
          <div className={css.categoryCeneterContainner}>
            <div ref={categoryLineRef} className={css.categoriesList}>
              {categories.map((variant,index) => (
                variant.option !== 'other'?
                (<div key={index} className={css.categoryContainner}>
                  <div onClick={()=>categoryAction(variant.option)} className={css.categoryLabel}>
                    {categoryImage(variant.option)}
                    <div >
                      {variant.label}
                    </div>
                  </div>
                  
                </div>): null
              ))}
            </div>
          </div>
        </div>

        <ScrollMenu LeftArrow={renderLeftNav} RightArrow={renderRightNav}>
          {items.map(({ id }) => (
            <Card
              itemId={id} // NOTE: itemId is required for track items
              title={id}
              key={id}
              onClick={handleClick(id)}
              selected={isItemSelected(id)}
            />
          ))}
        </ScrollMenu>
        
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
