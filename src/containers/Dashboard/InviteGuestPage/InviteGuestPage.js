import React from 'react';

import {
  Page,
  LayoutSingleColumn,
  DashboardMenu,
  ExperienceCard,
  NamedLink,
} from '../../../components';

import css from './InviteGuestPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

import ImgWorkInProgress from '../../../assets/images/dashboard/work_in_progress.png';

export const InviteGuestPage = props => {
  return (
    <Page title={'Invite Guests'} className={css.page} scrollingDisabled={false}>
      <div className={css.root}>
        <div>
          <ModalPageHeader />
        </div>
        <div className={css.content}>
          <SectionVirtualEscRoom />
          <div className={css.rightContainer}>
            <div className={css.rTitleArea}>
              <div className={css.title}>Invite guests by email</div>
              <div className={css.subtitle}>
                Enter a list of emails, separated by commas or new lines. Invitees will also receive
                a Slack invite.
              </div>
            </div>
            <div className={css.rContentArea}>
              <div className={css.textarea}>
                <textarea className={css.textContent}></textarea>
              </div>
              <div className={css.actions}>
                <div className={css.copyLinkContainer}>
                  <NamedLink className={css.btnCopyLink} name="VirtualEscapeRoomPage">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="16"
                      viewBox="0 0 13 16"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_70_2754)">
                        <path
                          d="M11.1429 10.3438H5.57143C5.31607 10.3438 5.10714 10.1328 5.10714 9.875V2.375C5.10714 2.11719 5.31607 1.90625 5.57143 1.90625H9.63683L11.6071 3.89551V9.875C11.6071 10.1328 11.3982 10.3438 11.1429 10.3438ZM5.57143 11.75H11.1429C12.1672 11.75 13 10.9092 13 9.875V3.89551C13 3.52344 12.852 3.16602 12.5908 2.90234L10.6234 0.913086C10.3623 0.649414 10.0083 0.5 9.63973 0.5H5.57143C4.5471 0.5 3.71429 1.34082 3.71429 2.375V9.875C3.71429 10.9092 4.5471 11.75 5.57143 11.75ZM1.85714 4.25C0.832812 4.25 0 5.09082 0 6.125V13.625C0 14.6592 0.832812 15.5 1.85714 15.5H7.42857C8.4529 15.5 9.28571 14.6592 9.28571 13.625V12.6875H7.89286V13.625C7.89286 13.8828 7.68393 14.0938 7.42857 14.0938H1.85714C1.60179 14.0938 1.39286 13.8828 1.39286 13.625V6.125C1.39286 5.86719 1.60179 5.65625 1.85714 5.65625H2.78571V4.25H1.85714Z"
                          fill="#06C167"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_70_2754">
                          <rect width="13" height="15" fill="white" transform="translate(0 0.5)" />
                        </clipPath>
                      </defs>
                    </svg>
                    <div>Copy link</div>
                  </NamedLink>
                </div>
                <div className={css.btnTestEmail}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2750)">
                      <path
                        d="M0.534609 8.13137C-0.215781 8.53449 -0.146055 9.60949 0.654141 9.92199L5.31254 11.7501V14.9782C5.31254 15.5439 5.7973 16.0001 6.39828 16.0001C6.72035 16.0001 7.02582 15.8657 7.23168 15.6314L9.29027 13.3095L13.4041 14.922C14.0317 15.1689 14.7588 14.7814 14.8618 14.1501L16.9868 1.15012C17.0498 0.771994 16.8739 0.390745 16.5385 0.175119C16.2032 -0.0405055 15.7649 -0.0592555 15.4096 0.131369L0.534609 8.13137ZM2.26449 8.92824L13.6034 2.83137L6.31195 10.5001L6.3518 10.5314L2.26449 8.92824ZM13.3909 13.2939L7.85922 11.122L14.968 3.64387L13.3909 13.2939Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2750">
                        <rect width="17" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <div>Send me a test email</div>
                </div>
                <NamedLink name="RSVPListConfirmedPage" className={css.btnInvite}>
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
                  <div>Invite guests</div>
                </NamedLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default InviteGuestPage;
