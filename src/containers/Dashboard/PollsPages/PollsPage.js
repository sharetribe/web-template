import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './PollsPage.module.css';

export const PollsPage = props => {
  return (
    <Page title={'Polls'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={3} hover={2} />
          <div className={css.content}>
            <div className={css.title}>Polls</div>
            <div className={css.tableContainer}>
              <div className={css.thead}>
                <div className={css.thGroup}>
                  <div className={`${css.th} ${css.w153}`}>Poll</div>
                  <div className={css.th}>Created</div>
                </div>
                <div className={css.th}>Votes</div>
              </div>
              <div className={css.tr}>
                <div className={css.thGroup}>
                  <div className={`${css.td} ${css.w153}`}>Team activity</div>
                  <div className={`${css.td}`}>14 Oct 2023, 7:30pm SET</div>
                </div>
                <div className={`${css.td} ${css.w110}`}>11</div>
                <div className={`${css.td} ${css.actions}`}>
                  <div className={css.btnSecondary}>Get votes</div>
                  <div className={css.btnDark}>View results</div>
                </div>
              </div>
              <div className={css.tr}>
                <div className={css.thGroup}>
                  <div className={`${css.td} ${css.w153}`}>Team activity</div>
                  <div className={`${css.td}`}>14 Oct 2023, 7:30pm SET</div>
                </div>
                <div className={`${css.td} ${css.w110}`}>11</div>
                <div className={`${css.td} ${css.actions}`}>
                  <div className={css.btnSecondary}>Get votes</div>
                  <div className={css.btnDark}>View results</div>
                </div>
              </div>
              <div className={css.tr}>
                <div className={css.thGroup}>
                  <div className={`${css.td} ${css.w153}`}>Team activity</div>
                  <div className={`${css.td}`}>14 Oct 2023, 7:30pm SET</div>
                </div>
                <div className={`${css.td} ${css.w110}`}>11</div>
                <div className={`${css.td} ${css.actions}`}>
                  <div className={css.btnSecondary}>Get votes</div>
                  <div className={css.btnDark}>View results</div>
                </div>
              </div>
              <div className={css.tr}>
                <div className={css.thGroup}>
                  <div className={`${css.td} ${css.w153}`}>Team activity</div>
                  <div className={`${css.td}`}>14 Oct 2023, 7:30pm SET</div>
                </div>
                <div className={`${css.td} ${css.w110}`}>11</div>
                <div className={`${css.td} ${css.actions}`}>
                  <div className={css.btnSecondary}>Get votes</div>
                  <div className={css.btnDark}>View results</div>
                </div>
              </div>
              <div className={css.tr}>
                <div className={css.thGroup}>
                  <div className={`${css.td} ${css.w153}`}>Team activity</div>
                  <div className={`${css.td}`}>14 Oct 2023, 7:30pm SET</div>
                </div>
                <div className={`${css.td} ${css.w110}`}>11</div>
                <div className={`${css.td} ${css.actions}`}>
                  <div className={css.btnSecondary}>Get votes</div>
                  <div className={css.btnDark}>View results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default PollsPage;
