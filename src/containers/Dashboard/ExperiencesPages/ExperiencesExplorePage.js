import React, { useState } from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import BackgroundImage1 from '../../../assets/images/dashboard/exp1.png';
import BackgroundImage2 from '../../../assets/images/dashboard/exp2.png';
import BackgroundImage3 from '../../../assets/images/dashboard/exp3.png';
import BackgroundImage4 from '../../../assets/images/dashboard/exp4.png';

import css from './ExperiencesExplorePage.module.css';

export const ExperiencesExplorePage = props => {
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
                  <FontAwesomeIcon icon={faPlus} className={css.fontIcon} />
                  <div>Create event</div>
                </div>
              </div>
            </div>
            <div className={css.content}>
              <ExperienceCard
                category="Virtual"
                title="Virtual escape room"
                subtitle="X Game"
                date="October 26, 2023"
                booker="Janay"
                time="01:30 PM SET"
                status="Pending"
                count="7"
                background={BackgroundImage1}
              />
              <ExperienceCard
                category="Venues"
                title="Virtual escape room"
                subtitle="X Game"
                date="October 26, 2023"
                booker="Janay"
                time="01:30 PM SET"
                status="Confirmed"
                count="13"
                background={BackgroundImage2}
              />
              <ExperienceCard
                category="Retreats"
                title="Virtual escape room"
                subtitle="X Game"
                date="October 26, 2023"
                booker="Janay"
                time="01:30 PM SET"
                status="Starting soon"
                count="13"
                background={BackgroundImage3}
              />
              <ExperienceCard
                category="In-person"
                title="Virtual escape room"
                subtitle="X Game"
                date="October 26, 2023"
                booker="Janay"
                time="01:30 PM SET"
                status="Completed"
                count="13"
                background={BackgroundImage4}
              />
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ExperiencesExplorePage;
