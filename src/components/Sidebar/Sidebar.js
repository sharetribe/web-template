import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import css from './Sidebar.module.css';
import NamedLink from '../NamedLink/NamedLink';

const Sidebar = props => {
  const location = useLocation();
  const [currentLocation, setCurrentLocation] = useState(location.pathname);
  const { isAuthenticated, onClickMenu, onLogout } = props;
  return (
    <>
      <div className={css.sectionbody} onClick={onClickMenu}></div>
      <div className={css.sectionsidebar}>
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            top: '25px',
            right: '10px',
          }}
          onClick={onClickMenu}
        >
          <rect width="33.171" height="33.6295" rx="16.5855" fill="white" />
          <path
            d="M20.8995 13.6445C21.2576 13.2685 21.2576 12.658 20.8995 12.282C20.5415 11.906 19.96 11.906 19.6019 12.282L16.5855 15.4522L13.5662 12.285C13.2081 11.909 12.6266 11.909 12.2686 12.285C11.9105 12.661 11.9105 13.2716 12.2686 13.6475L15.2878 16.8148L12.2714 19.985C11.9133 20.361 11.9133 20.9716 12.2714 21.3475C12.6295 21.7235 13.211 21.7235 13.5691 21.3475L16.5855 18.1773L19.6048 21.3445C19.9628 21.7205 20.5443 21.7205 20.9024 21.3445C21.2605 20.9685 21.2605 20.358 20.9024 19.982L17.8831 16.8148L20.8995 13.6445Z"
            fill="black"
          />
        </svg>
        {currentLocation.includes('dashboard') ? (
          <>
            <div className={css.sectioncategory}>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="ExperiencesHomePage">
                  Experiences
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="DashboardFavoriteDetailPage">
                  Favorites
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="DashboardPollsDetailPage">
                  Polls
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="DashboardUsersPage">
                  Users
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="BillingPage">
                  Billing
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.categoryitem} name="DashboardProfilePage">
                  Profile
                </NamedLink>
              </div>
            </div>
            <div className={css.sectionpages}>
              <div onClick={onClickMenu}>
                <NamedLink className={css.pageitem} name="HelpCenterPage">
                  Help Center
                </NamedLink>
              </div>
              <div className={css.pageitem} onClick={onLogout}>
                Logout
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={css.sectioncategory}>
              <div className={css.categoryitem}>In-person</div>
              <div className={css.categoryitem}>Retreats</div>
              <div className={css.categoryitem}>Virtual</div>
              <div className={css.categoryitem}>Venues</div>
            </div>
            <div className={css.sectionpages}>
              <div onClick={onClickMenu}>
                <NamedLink className={css.pageitem} name="BecomeHostPage">
                  Become a Host
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.pageitem} name="BookingPage">
                  About Us
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.pageitem} name="PolicyPage">
                  Resources
                </NamedLink>
              </div>
              <div onClick={onClickMenu}>
                <NamedLink className={css.pageitem} name="HelpCenterPage">
                  Help Center
                </NamedLink>
              </div>
              <div className={css.pageitem} onClick={onLogout}>
                Logout
              </div>
            </div>
            <div className={css.menubtn} onClick={onClickMenu}>
              {isAuthenticated ? (
                <NamedLink className={css.menubtncontainer} name="ExperiencesHomePage">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M0 3.375C0 2.13398 1.00898 1.125 2.25 1.125H15.75C16.991 1.125 18 2.13398 18 3.375V14.625C18 15.866 16.991 16.875 15.75 16.875H2.25C1.00898 16.875 0 15.866 0 14.625V3.375ZM2.25 5.625V14.625H7.875V5.625H2.25ZM15.75 5.625H10.125V14.625H15.75V5.625Z"
                      fill="#06C167"
                    />
                  </svg>
                  <div>Dashboard</div>
                </NamedLink>
              ) : (
                <NamedLink className={css.menubtncontainer} name="LoginPage">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="19"
                    viewBox="0 0 16 19"
                    fill="none"
                  >
                    <g clip-path="url(#clip0_902_845)">
                      <path
                        d="M8 9.5C9.21242 9.5 10.3752 9.02589 11.2325 8.18198C12.0898 7.33807 12.5714 6.19347 12.5714 5C12.5714 3.80653 12.0898 2.66193 11.2325 1.81802C10.3752 0.974106 9.21242 0.5 8 0.5C6.78758 0.5 5.62482 0.974106 4.76751 1.81802C3.9102 2.66193 3.42857 3.80653 3.42857 5C3.42857 6.19347 3.9102 7.33807 4.76751 8.18198C5.62482 9.02589 6.78758 9.5 8 9.5ZM6.36786 11.1875C2.85 11.1875 0 13.993 0 17.4559C0 18.0324 0.475 18.5 1.06071 18.5H14.9393C15.525 18.5 16 18.0324 16 17.4559C16 13.993 13.15 11.1875 9.63214 11.1875H6.36786Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_902_845">
                        <rect width="16" height="18" fill="white" transform="translate(0 0.5)" />
                      </clipPath>
                    </defs>
                  </svg>
                  <div>Sign in</div>
                </NamedLink>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;
