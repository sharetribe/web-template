import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './BillingPage.module.css';

export const BillingPage = props => {
  return (
    <Page title={'Billing'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={5} hover={0} />
          <div className={css.content}>
            <div className={css.title}>Billing</div>
            <div className={css.details}>
              <div className={css.balance}>
                <div className={css.label}>Your credit balance</div>
                <div className={css.value}>$123.1</div>
              </div>
              <div className={css.btnBillingHistory}>Billing and Payment History</div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default BillingPage;
