import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './ProfilePage.module.css';

export const ProfilePage = props => {
  return (
    <Page title={'Profile'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={6} hover={0} />
          <div className={css.content}>
            <div className={css.title}>Account</div>
            <div className={css.details}>
              <div className={css.form}>
                <div className={css.nameContainer}>
                  <div className={css.formGroup}>
                    <div className={css.formLabel}>First name</div>
                    <div className={`${css.formInput}`}>John</div>
                  </div>
                  <div className={css.formGroup}>
                    <div className={css.formLabel}>Last name</div>
                    <div className={`${css.formInput} ${css.placeholder}`}>Last name</div>
                  </div>
                </div>
                <div className={css.companyContainer}>
                  <div className={css.formGroup}>
                    <div className={css.formLabel}>Company</div>
                    <div className={`${css.formInput} ${css.w100}`}>XYZ Company</div>
                  </div>
                </div>
                <div className={css.companyContainer}>
                  <div className={css.formGroup}>
                    <div className={css.formLabel}>Email</div>
                    <div className={`${css.formInput}  ${css.placeholder} ${css.w100}`}>
                      john@xyz.com
                    </div>
                  </div>
                </div>
                <div className={css.btnSubmit}>Save Changes</div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ProfilePage;
