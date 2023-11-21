import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';

import css from './RSVPListConfirmedPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

import ImgConfirmed from '../../../assets/images/dashboard/rsvp_confirmed.svg';
import SlackIcon from '../../../assets/images/dashboard/slack.png';

export const RSVPListConfirmedPage = props => {
  return (
    <Page title={'RSVP'} className={css.page} scrollingDisabled={false}>
      <div className={css.root}>
        <div>
          <ModalPageHeader />
        </div>
        <div className={css.content}>
          <SectionVirtualEscRoom />
          <div className={css.rightContainer}>
            <div className={css.title}>RSVP List</div>
            <div className={css.mainContent}>
              <div className={css.workInProgress}>
                <img src={ImgConfirmed} />
              </div>
              <div className={css.descArea}>
                <h5>Great news! Your booking is confirmed.</h5>
                <div className={css.desc}>You can invite your guests </div>
              </div>
              <div className={css.actions}>
                <div className={css.buttonSlack}>
                  <img src={SlackIcon} />
                  <div>Invite with Slack</div>
                </div>
                <div className={css.buttonInvite}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M2 3.5C1.725 3.5 1.5 3.725 1.5 4V4.69063L6.89062 9.11563C7.5375 9.64688 8.46562 9.64688 9.1125 9.11563L14.5 4.69063V4C14.5 3.725 14.275 3.5 14 3.5H2ZM1.5 6.63125V12C1.5 12.275 1.725 12.5 2 12.5H14C14.275 12.5 14.5 12.275 14.5 12V6.63125L10.0625 10.275C8.8625 11.2594 7.13438 11.2594 5.9375 10.275L1.5 6.63125ZM0 4C0 2.89688 0.896875 2 2 2H14C15.1031 2 16 2.89688 16 4V12C16 13.1031 15.1031 14 14 14H2C0.896875 14 0 13.1031 0 12V4Z"
                      fill="#06C167"
                    />
                  </svg>
                  <div>Invite with email</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default RSVPListConfirmedPage;
