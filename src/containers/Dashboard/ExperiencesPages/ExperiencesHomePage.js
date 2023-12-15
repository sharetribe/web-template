import React, { useState } from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, NamedLink } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './ExperiencesHomePage.module.css';
export const ExperiencesHomePage = props => {
  const [category, setCategory] = useState('all');

  return (
    <Page title={'Experiences'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={1} hover={2} />
          <div className={css.container}>
            <div className={css.header}>
              <div className={css.headermenu}>
                <div
                  className={category == 'all' ? css.headermenuitemactive : css.headermenuitem}
                  onClick={() => setCategory('all')}
                >
                  View All
                </div>
                <div
                  className={category == 'upcoming' ? css.headermenuitemactive : css.headermenuitem}
                  onClick={() => setCategory('upcoming')}
                >
                  Upcoming experiences
                </div>
                <div
                  className={category == 'past' ? css.headermenuitemactive : css.headermenuitem}
                  onClick={() => setCategory('past')}
                >
                  Past experiences
                </div>
              </div>
              <div className={css.headeraction}>
                <div className={css.headeractionbtn}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="22"
                    viewBox="0 0 18 22"
                    fill="none"
                  >
                    <path
                      d="M10.2857 3.92829C10.2857 3.21713 9.71119 2.64258 9.00003 2.64258C8.28887 2.64258 7.71431 3.21713 7.71431 3.92829V9.71401H1.9286C1.21744 9.71401 0.642883 10.2886 0.642883 10.9997C0.642883 11.7109 1.21744 12.2854 1.9286 12.2854H7.71431V18.0711C7.71431 18.7823 8.28887 19.3569 9.00003 19.3569C9.71119 19.3569 10.2857 18.7823 10.2857 18.0711V12.2854H16.0715C16.7826 12.2854 17.3572 11.7109 17.3572 10.9997C17.3572 10.2886 16.7826 9.71401 16.0715 9.71401H10.2857V3.92829Z"
                      fill="#06C167"
                    />
                  </svg>
                  <div>Create event</div>
                </div>
              </div>
            </div>
            <div className={css.content}>
              <div className={css.dashboardcontent}>
                <div className={css.contenttext}>
                  Time for your next adventure?
                  <div className={css.contentsubtext}>
                    Book unique + extraordinary experiences from a highly curated selection of
                    creators, brands, and venues.
                  </div>
                </div>
                <NamedLink className={css.contentbtn} name="ExperiencesExplorePage">
                  Explore Experiences
                </NamedLink>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ExperiencesHomePage;
