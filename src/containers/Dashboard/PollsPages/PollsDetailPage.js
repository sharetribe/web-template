import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './PollsDetailPage.module.css';

export const PollsDetailPage = props => {
  return (
    <Page title={'Polls'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={3} hover={2} />
          <div className={css.content}>
            <div className={css.titleArea}>
              <div className={css.titleRow}>
                <div className={css.title}>Your Polls</div>
                <div className={css.subTitle}>
                  Take your favorited experiences to an anonymous vote by creating a poll. Share
                  polls with your team and view real-time results.
                </div>
              </div>
              <div className={css.btnExplore}>Explore Experiences</div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default PollsDetailPage;
