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
} from '../..';

import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';
import Sidebar from '../../Sidebar/Sidebar';
import css from './TopbarMobile.module.css';

const TopbarMobile = props => {
  const [activeMenu, setActiveMenu] = useState('');
  const {
    className,
    appConfig,
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

  const [isSidebarOpened, setSidebarOpened] = useState(false);

  const handleSidebar = () => {
    if (!isSidebarOpened) document.body.style.overflowY = 'hidden';
    else document.body.style.overflowY = 'auto';
    setSidebarOpened(!isSidebarOpened);
  };

  return (
    <>
      <nav className={classes}>
        <LinkedLogo layout={'mobile'} alt={intl.formatMessage({ id: 'Topbar.logoIcon' })} />
        <div className={css.headerdashboardcontent}>
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
      </nav>
      {isSidebarOpened && (
        <Sidebar
          isAuthenticated={isAuthenticated}
          onClickMenu={handleSidebar}
          onLogout={() => {
            onLogout();
            handleSidebar();
          }}
        />
      )}
    </>
  );
};

TopbarMobile.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  appConfig: null,
};

TopbarMobile.propTypes = {
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

export default TopbarMobile;
