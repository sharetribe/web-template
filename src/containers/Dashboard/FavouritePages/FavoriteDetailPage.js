import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './FavoriteDetailPage.module.css';

export const FavoriteDetailPage = props => {
  return (
    <Page title={'Favourites'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={1} hover={0} />
          <div className={css.content}>
            <div className={css.titleArea}>
              <div className={css.titleRow}>
                <div className={css.title}>Your Favorites</div>
                <div className={css.subTitle}>
                  Save your favorite experiences by clicking the ❤️ on the explore or experience
                  page.
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

export default FavoriteDetailPage;
