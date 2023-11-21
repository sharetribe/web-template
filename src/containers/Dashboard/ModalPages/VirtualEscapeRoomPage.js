import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';

import css from './VirtualEscapeRoomPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

import ImgConfirmed from '../../../assets/images/dashboard/rsvp_confirmed.svg';
import SlackIcon from '../../../assets/images/dashboard/slack.png';

export const VirtualEscapeRoomPage = props => {
  return (
    <Page title={'Virtual Escape Room'} className={css.page} scrollingDisabled={false}>
      <div className={css.root}>
        <div>
          <ModalPageHeader />
        </div>
        <div className={css.content}>
          <SectionVirtualEscRoom />
        </div>
      </div>
    </Page>
  );
};

export default VirtualEscapeRoomPage;
