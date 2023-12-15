import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './UsersPage.module.css';

export const UsersPage = props => {
  return (
    <Page title={'Users'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={4} hover={2} />
          <div className={css.content}>
            <div className={css.contentHeader}>
              <div className={css.title}>Users</div>
              <div className={css.btnInviteUser}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="22"
                  viewBox="0 0 18 22"
                  fill="none"
                >
                  <path
                    d="M10.2854 3.92829C10.2854 3.21713 9.71088 2.64258 8.99972 2.64258C8.28856 2.64258 7.71401 3.21713 7.71401 3.92829V9.71401H1.92829C1.21713 9.71401 0.642578 10.2886 0.642578 10.9997C0.642578 11.7109 1.21713 12.2854 1.92829 12.2854H7.71401V18.0711C7.71401 18.7823 8.28856 19.3569 8.99972 19.3569C9.71088 19.3569 10.2854 18.7823 10.2854 18.0711V12.2854H16.0711C16.7823 12.2854 17.3569 11.7109 17.3569 10.9997C17.3569 10.2886 16.7823 9.71401 16.0711 9.71401H10.2854V3.92829Z"
                    fill="#06C167"
                  />
                </svg>
                <div>Invite user</div>
              </div>
            </div>
            <div className={css.tableContainer}>
              <div className={css.tableHeader}>
                <div className={`${css.th} ${css.w207}`}>First name</div>
                <div className={`${css.th} ${css.w207}`}>Last name</div>
                <div className={`${css.th} ${css.w169}`}>Email</div>
                <div className={`${css.th} ${css.w160}`}>Status</div>
                <div className={`${css.th} ${css.w261}`}>Spend this month</div>
                <div className={`${css.th} ${css.w86} ${css.alignRight}`}>Role</div>
              </div>
              <div className={css.tr}>
                <div className={`${css.td} ${css.w207}`}>John</div>
                <div className={`${css.td} ${css.w207}`}>Doe</div>
                <div className={`${css.td} ${css.w169}`}>john@gmail.com</div>
                <div className={`${css.td} ${css.w160}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="20"
                    viewBox="0 0 19 20"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.49967 17.9173C13.872 17.9173 17.4163 14.373 17.4163 10.0007C17.4163 5.62828 13.872 2.08398 9.49967 2.08398C5.1273 2.08398 1.58301 5.62828 1.58301 10.0007C1.58301 14.373 5.1273 17.9173 9.49967 17.9173ZM13.7517 7.49503C13.7888 7.45687 13.8177 7.41165 13.8369 7.36205C13.8561 7.31246 13.8651 7.25951 13.8633 7.20636C13.8616 7.15322 13.8491 7.10097 13.8268 7.05274C13.8044 7.0045 13.7725 6.96127 13.7331 6.92562C13.6936 6.88997 13.6474 6.86264 13.5971 6.84525C13.5469 6.82786 13.4936 6.82078 13.4406 6.82441C13.3876 6.82805 13.3358 6.84234 13.2884 6.86643C13.241 6.89052 13.1989 6.92391 13.1647 6.96461L8.42301 12.2043L5.81447 9.71407C5.73856 9.64152 5.63695 9.60211 5.53199 9.60448C5.42702 9.60686 5.3273 9.65083 5.25476 9.72673C5.18222 9.80264 5.1428 9.90425 5.14517 10.0092C5.14755 10.1142 5.19152 10.2139 5.26742 10.2864L8.17047 13.0573L8.46457 13.3383L8.7373 13.0367L13.7517 7.49503Z"
                      fill="#06C167"
                    />
                  </svg>
                  <div>Active</div>
                </div>
                <div className={`${css.td} ${css.w261}`}>$ 123</div>
                <div className={`${css.td} ${css.w86} ${css.alignRight}`}>Admin</div>
              </div>

              <div className={css.tr}>
                <div className={`${css.td} ${css.w207}`}>John</div>
                <div className={`${css.td} ${css.w207}`}>Doe</div>
                <div className={`${css.td} ${css.w169}`}>john@gmail.com</div>
                <div className={`${css.td} ${css.w160}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="20"
                    viewBox="0 0 19 20"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M17.4163 10.0007C17.4163 14.373 13.872 17.9173 9.49967 17.9173C5.1273 17.9173 1.58301 14.373 1.58301 10.0007C1.58301 5.62828 5.1273 2.08398 9.49967 2.08398C13.872 2.08398 17.4163 5.62828 17.4163 10.0007ZM6.42088 13.0794C6.34668 13.0052 6.30499 12.9045 6.30499 12.7996C6.30499 12.6946 6.34668 12.594 6.42088 12.5197L8.93997 10.0007L6.42088 7.48157C6.34878 7.40691 6.30888 7.30692 6.30978 7.20314C6.31068 7.09935 6.35231 7.00007 6.4257 6.92668C6.4991 6.85329 6.59837 6.81166 6.70216 6.81076C6.80595 6.80986 6.90594 6.84975 6.98059 6.92186L9.49967 9.44094L12.0188 6.92186C12.0934 6.84975 12.1934 6.80986 12.2972 6.81076C12.401 6.81166 12.5003 6.85329 12.5736 6.92668C12.647 7.00007 12.6887 7.09935 12.6896 7.20314C12.6905 7.30692 12.6506 7.40691 12.5785 7.48157L10.0594 10.0007L12.5785 12.5197C12.6506 12.5944 12.6905 12.6944 12.6896 12.7982C12.6887 12.9019 12.647 13.0012 12.5736 13.0746C12.5003 13.148 12.401 13.1896 12.2972 13.1905C12.1934 13.1914 12.0934 13.1515 12.0188 13.0794L9.49967 10.5604L6.98059 13.0794C6.90636 13.1536 6.8057 13.1953 6.70074 13.1953C6.59578 13.1953 6.49511 13.1536 6.42088 13.0794Z"
                      fill="#ED6759"
                    />
                  </svg>
                  <div>Disabled</div>
                </div>
                <div className={`${css.td} ${css.w187}`}>$ 123</div>
                <div className={`${css.td} ${css.w160} ${css.alignRight}`}>Team member</div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default UsersPage;
