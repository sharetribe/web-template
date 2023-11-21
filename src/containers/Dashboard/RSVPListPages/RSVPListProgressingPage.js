import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';

import css from './RSVPListProgressingPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

import ImgWorkInProgress from '../../../assets/images/dashboard/work_in_progress.png';

export const RSVPListProgressingPage = props => {
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
                <img src={ImgWorkInProgress} />
              </div>
              <div className={css.description}>
                You will be able to see RSVPs and invite guests as soon as you your booking is
                confirmed
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default RSVPListProgressingPage;
