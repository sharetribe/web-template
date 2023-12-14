import React, { Component, useState } from 'react';
import { array, arrayOf, bool, func, number, object, shape, string } from 'prop-types';
import pickBy from 'lodash/pickBy';
import classNames from 'classnames';

import appSettings from '../../config/settings';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';
import { isMainSearchTypeKeywords, isOriginInUse } from '../../util/search';
import { withViewport } from '../../util/uiHelpers';
import { parse, stringify } from '../../util/urlHelpers';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { propTypes } from '../../util/types';
import {
  Button,
  LimitedAccessBanner,
  LinkedLogo,
  Modal,
  ModalMissingInformation,
  NamedLink,
} from '../../components';

import MenuIcon from './MenuIcon';
import SearchIcon from './SearchIcon';
import TopbarSearchForm from './TopbarSearchForm/TopbarSearchForm';
import TopbarMobileMenu from './TopbarMobileMenu/TopbarMobileMenu';
import TopbarDesktop from './TopbarDesktop/TopbarDesktop';

import css from './Topbar.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 1024;

const redirectToURLWithModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const searchString = `?${stringify({ [modalStateParam]: 'open', ...parse(search) })}`;
  history.push(`${pathname}${searchString}`, state);
};

const redirectToURLWithoutModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const queryParams = pickBy(parse(search), (v, k) => {
    return k !== modalStateParam;
  });
  const stringified = stringify(queryParams);
  const searchString = stringified ? `?${stringified}` : '';
  history.push(`${pathname}${searchString}`, state);
};

const GenericError = props => {
  const { show } = props;
  const classes = classNames(css.genericError, {
    [css.genericErrorVisible]: show,
  });
  return (
    <div className={classes}>
      <div className={css.genericErrorContent}>
        <p className={css.genericErrorText}>
          <FormattedMessage id="Topbar.genericError" />
        </p>
      </div>
    </div>
  );
};

GenericError.propTypes = {
  show: bool.isRequired,
};

class TopbarComponent extends Component {
  constructor(props) {
    super(props);
    this.handleMobileMenuOpen = this.handleMobileMenuOpen.bind(this);
    this.handleMobileMenuClose = this.handleMobileMenuClose.bind(this);
    this.handleMobileSearchOpen = this.handleMobileSearchOpen.bind(this);
    this.handleMobileSearchClose = this.handleMobileSearchClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleMobileMenuOpen() {
    redirectToURLWithModalState(this.props, 'mobilemenu');
  }

  handleMobileMenuClose() {
    redirectToURLWithoutModalState(this.props, 'mobilemenu');
  }

  handleMobileSearchOpen() {
    redirectToURLWithModalState(this.props, 'mobilesearch');
  }

  handleMobileSearchClose() {
    redirectToURLWithoutModalState(this.props, 'mobilesearch');
  }

  handleSubmit(values) {
    const { currentSearchParams } = this.props;
    const { history, config, routeConfiguration } = this.props;

    const topbarSearchParams = () => {
      if (isMainSearchTypeKeywords(config)) {
        return { keywords: values?.keywords };
      }
      // topbar search defaults to 'location' search
      const { search, selectedPlace } = values?.location;
      const { origin, bounds } = selectedPlace;
      const originMaybe = isOriginInUse(config) ? { origin } : {};

      return {
        ...originMaybe,
        address: search,
        bounds,
      };
    };
    const searchParams = {
      ...currentSearchParams,
      ...topbarSearchParams(),
    };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
  }

  handleLogout() {
    const { onLogout, history, routeConfiguration } = this.props;
    onLogout().then(() => {
      const path = pathByRouteName('LandingPage', routeConfiguration);

      // In production we ensure that data is really lost,
      // but in development mode we use stored values for debugging
      if (appSettings.dev) {
        history.push(path);
      } else if (typeof window !== 'undefined') {
        window.location = path;
      }

      console.log('logged out'); // eslint-disable-line
    });
  }

  render() {
    const {
      className,
      rootClassName,
      desktopClassName,
      mobileRootClassName,
      mobileClassName,
      isAuthenticated,
      authScopes,
      authInProgress,
      currentUser,
      currentUserHasListings,
      currentUserHasOrders,
      currentPage,
      notificationCount,
      viewport,
      intl,
      location,
      onManageDisableScrolling,
      onResendVerificationEmail,
      sendVerificationEmailInProgress,
      sendVerificationEmailError,
      showGenericError,
      config,
    } = this.props;

    const { mobilemenu, mobilesearch, keywords, address, origin, bounds } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;

    const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;
    const isMobileMenuOpen = isMobileLayout && mobilemenu === 'open';
    const isMobileSearchOpen = isMobileLayout && mobilesearch === 'open';

    const mobileMenu = (
      <TopbarMobileMenu
        isAuthenticated={isAuthenticated}
        currentUserHasListings={currentUserHasListings}
        currentUser={currentUser}
        onLogout={this.handleLogout}
        notificationCount={notificationCount}
        currentPage={currentPage}
      />
    );

    const topbarSearcInitialValues = () => {
      if (isMainSearchTypeKeywords(config)) {
        return { keywords };
      }

      // Only render current search if full place object is available in the URL params
      const locationFieldsPresent = isOriginInUse(config)
        ? address && origin && bounds
        : address && bounds;
      return {
        location: locationFieldsPresent
          ? {
              search: address,
              selectedPlace: { address, origin, bounds },
            }
          : null,
      };
    };
    const initialSearchFormValues = topbarSearcInitialValues();

    const handleSidebar = () => {
      // if (!isSidebarOpened) document.body.style.overflowY = 'hidden';
      // else document.body.style.overflowY = 'auto';
      // setSidebarOpened(!isSidebarOpened);
    };

    const classes = classNames(rootClassName || css.root, className);

    return (
      <>
        <div className={classes}>
          <LimitedAccessBanner
            isAuthenticated={isAuthenticated}
            authScopes={authScopes}
            currentUser={currentUser}
            onLogout={this.handleLogout}
            currentPage={currentPage}
          />
          <div className={classNames(mobileRootClassName || css.container, mobileClassName)}>
            <LinkedLogo layout={'mobile'} alt={intl.formatMessage({ id: 'Topbar.logoIcon' })} />
            <div className={css.headeraction}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
              >
                <path
                  d="M13.8132 6.90524C13.8132 8.42904 13.3184 9.83664 12.485 10.9787L16.6887 15.1849C17.1038 15.5999 17.1038 16.2738 16.6887 16.6888C16.2736 17.1037 15.5996 17.1037 15.1845 16.6888L10.9808 12.4825C9.83857 13.3191 8.43069 13.8105 6.90659 13.8105C3.09136 13.8105 0 10.7197 0 6.90524C0 3.09076 3.09136 0 6.90659 0C10.7218 0 13.8132 3.09076 13.8132 6.90524ZM6.90659 11.6858C7.5345 11.6858 8.15627 11.5621 8.73638 11.3219C9.3165 11.0816 9.8436 10.7295 10.2876 10.2856C10.7316 9.84168 11.0838 9.31468 11.3241 8.73468C11.5644 8.15467 11.6881 7.53303 11.6881 6.90524C11.6881 6.27745 11.5644 5.6558 11.3241 5.0758C11.0838 4.4958 10.7316 3.96879 10.2876 3.52488C9.8436 3.08096 9.3165 2.72883 8.73638 2.48859C8.15627 2.24834 7.5345 2.12469 6.90659 2.12469C6.27867 2.12469 5.65691 2.24834 5.07679 2.48859C4.49668 2.72883 3.96957 3.08096 3.52557 3.52488C3.08157 3.96879 2.72936 4.4958 2.48907 5.0758C2.24878 5.6558 2.1251 6.27745 2.1251 6.90524C2.1251 7.53303 2.24878 8.15467 2.48907 8.73468C2.72936 9.31468 3.08157 9.84168 3.52557 10.2856C3.96957 10.7295 4.49668 11.0816 5.07679 11.3219C5.65691 11.5621 6.27867 11.6858 6.90659 11.6858Z"
                  fill="black"
                />
              </svg>
              <div className={css.headeractionbar}></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="17"
                viewBox="0 0 14 17"
                fill="none"
                onClick={handleSidebar}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d="M0 3.1875C0 2.5998 0.446875 2.125 1 2.125H13C13.5531 2.125 14 2.5998 14 3.1875C14 3.7752 13.5531 4.25 13 4.25H1C0.446875 4.25 0 3.7752 0 3.1875ZM0 8.5C0 7.9123 0.446875 7.4375 1 7.4375H13C13.5531 7.4375 14 7.9123 14 8.5C14 9.0877 13.5531 9.5625 13 9.5625H1C0.446875 9.5625 0 9.0877 0 8.5ZM14 13.8125C14 14.4002 13.5531 14.875 13 14.875H1C0.446875 14.875 0 14.4002 0 13.8125C0 13.2248 0.446875 12.75 1 12.75H13C13.5531 12.75 14 13.2248 14 13.8125Z"
                  fill="black"
                />
              </svg>
            </div>
          </div>
          <div className={css.desktop}>
            <TopbarDesktop
              className={desktopClassName}
              currentUserHasListings={currentUserHasListings}
              currentUser={currentUser}
              currentPage={currentPage}
              initialSearchFormValues={initialSearchFormValues}
              intl={intl}
              isAuthenticated={isAuthenticated}
              notificationCount={notificationCount}
              onLogout={this.handleLogout}
              onSearchSubmit={this.handleSubmit}
              appConfig={config}
            />
          </div>
          <Modal
            id="TopbarMobileMenu"
            containerClassName={css.modalContainer}
            isOpen={isMobileMenuOpen}
            onClose={this.handleMobileMenuClose}
            usePortal
            onManageDisableScrolling={onManageDisableScrolling}
          >
            {authInProgress ? null : mobileMenu}
          </Modal>
          <Modal
            id="TopbarMobileSearch"
            containerClassName={css.modalContainerSearchForm}
            isOpen={isMobileSearchOpen}
            onClose={this.handleMobileSearchClose}
            usePortal
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <div className={css.searchContainer}>
              <TopbarSearchForm
                onSubmit={this.handleSubmit}
                initialValues={initialSearchFormValues}
                isMobile
                appConfig={config}
              />
              <p className={css.mobileHelp}>
                <FormattedMessage id="Topbar.mobileSearchHelp" />
              </p>
            </div>
          </Modal>
          <ModalMissingInformation
            id="MissingInformationReminder"
            containerClassName={css.missingInformationModal}
            currentUser={currentUser}
            currentUserHasListings={currentUserHasListings}
            currentUserHasOrders={currentUserHasOrders}
            location={location}
            onManageDisableScrolling={onManageDisableScrolling}
            onResendVerificationEmail={onResendVerificationEmail}
            sendVerificationEmailInProgress={sendVerificationEmailInProgress}
            sendVerificationEmailError={sendVerificationEmailError}
          />

          <GenericError show={showGenericError} />
        </div>
        {/* {isSidebarOpened && (
          <Sidebar
            isAuthenticated={isAuthenticated}
            onClickMenu={handleSidebar}
            onLogout={() => {
              onLogout();
              handleSidebar();
            }}
          />
        )} */}
      </>
    );
  }
}

TopbarComponent.defaultProps = {
  className: null,
  rootClassName: null,
  desktopClassName: null,
  mobileRootClassName: null,
  mobileClassName: null,
  notificationCount: 0,
  currentUser: null,
  currentUserHasOrders: null,
  currentPage: null,
  sendVerificationEmailError: null,
  authScopes: [],
};

TopbarComponent.propTypes = {
  className: string,
  rootClassName: string,
  desktopClassName: string,
  mobileRootClassName: string,
  mobileClassName: string,
  isAuthenticated: bool.isRequired,
  authScopes: array,
  authInProgress: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentUserHasListings: bool.isRequired,
  currentUserHasOrders: bool,
  currentPage: string,
  notificationCount: number,
  onLogout: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onResendVerificationEmail: func.isRequired,
  sendVerificationEmailInProgress: bool.isRequired,
  sendVerificationEmailError: propTypes.error,
  showGenericError: bool.isRequired,

  // These are passed from Page to keep Topbar rendering aware of location changes
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedTopbar = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  return (
    <TopbarComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      {...props}
    />
  );
};

const Topbar = withViewport(EnhancedTopbar);
Topbar.displayName = 'Topbar';

export default Topbar;
