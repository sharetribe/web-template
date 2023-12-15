import React from 'react';

import {
  Page,
  LayoutSingleColumn,
  DashboardMenu,
  ExperienceCard,
  NamedLink,
} from '../../../components';

import SlackIcon from '../../../assets/images/dashboard/slack.png';

import css from './RSVPListPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

export const RSVPListPage = props => {
  return (
    <Page title={'RSVP List'} className={css.page} scrollingDisabled={false}>
      <div className={css.root}>
        <div>
          <ModalPageHeader />
        </div>
        <div className={css.content}>
          <SectionVirtualEscRoom />
          <div className={css.rightContainer}>
            <div className={css.rTitleArea}>
              <div className={css.rTitle}>RSVP List</div>
              <div className={css.rTitleButtons}>
                <div className={css.buttonSlack}>
                  <img src={SlackIcon} />
                  <div>Invite with Slack</div>
                </div>
                <NamedLink name="InviteGuestPage" className={css.buttonInvite}>
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
                </NamedLink>
              </div>
            </div>
            <div className={css.rListArea}>
              <div className={css.rListRow}>
                <div className={css.listCols}>&nbsp;</div>
                <div className={css.rListInfo}>15 awaiting response</div>
              </div>
              <div className={css.rListRow}>
                <div className={css.listCols}>
                  <div className={css.nameHeader}>Name</div>
                  <div className={css.emailHeader}>Email</div>
                </div>
                <div className={css.listCol}>Calendar invite</div>
              </div>
              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="18"
                    viewBox="0 0 15 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2395)">
                      <path
                        d="M4.28571 0C4.73103 0 5.08929 0.376172 5.08929 0.84375V2.25H9.91071V0.84375C9.91071 0.376172 10.269 0 10.7143 0C11.1596 0 11.5179 0.376172 11.5179 0.84375V2.25H12.8571C14.0391 2.25 15 3.25898 15 4.5V5.0625V6.75V15.75C15 16.991 14.0391 18 12.8571 18H2.14286C0.960938 18 0 16.991 0 15.75V6.75V5.0625V4.5C0 3.25898 0.960938 2.25 2.14286 2.25H3.48214V0.84375C3.48214 0.376172 3.8404 0 4.28571 0ZM13.3929 6.75H1.60714V15.75C1.60714 16.0594 1.84821 16.3125 2.14286 16.3125H12.8571C13.1518 16.3125 13.3929 16.0594 13.3929 15.75V6.75ZM11.0156 10.4414L7.26562 14.3789C6.95089 14.7094 6.44196 14.7094 6.13058 14.3789L3.98772 12.1289C3.67299 11.7984 3.67299 11.2641 3.98772 10.9371C4.30245 10.6102 4.81138 10.6066 5.12277 10.9371L6.69643 12.5895L9.87723 9.24961C10.192 8.91914 10.7009 8.91914 11.0123 9.24961C11.3237 9.58008 11.327 10.1145 11.0123 10.4414H11.0156Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2395">
                        <rect width="15" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>
              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2422)">
                      <path
                        d="M4.625 0C5.09258 0 5.46875 0.376172 5.46875 0.84375V2.25H10.5312V0.84375C10.5312 0.376172 10.9074 0 11.375 0C11.8426 0 12.2188 0.376172 12.2188 0.84375V2.25H13.625C14.866 2.25 15.875 3.25898 15.875 4.5V5.0625V6.75V15.75C15.875 16.991 14.866 18 13.625 18H2.375C1.13398 18 0.125 16.991 0.125 15.75V6.75V5.0625V4.5C0.125 3.25898 1.13398 2.25 2.375 2.25H3.78125V0.84375C3.78125 0.376172 4.15742 0 4.625 0ZM14.1875 6.75H1.8125V15.75C1.8125 16.0594 2.06562 16.3125 2.375 16.3125H13.625C13.9344 16.3125 14.1875 16.0594 14.1875 15.75V6.75ZM10.8477 9.87891L9.19531 11.5312L10.8477 13.1836C11.1781 13.5141 11.1781 14.0484 10.8477 14.3754C10.5172 14.7023 9.98281 14.7059 9.65586 14.3754L8.00352 12.723L6.35117 14.3754C6.0207 14.7059 5.48633 14.7059 5.15937 14.3754C4.83242 14.0449 4.82891 13.5105 5.15937 13.1836L6.81172 11.5312L5.15937 9.87891C4.82891 9.54844 4.82891 9.01406 5.15937 8.68711C5.48984 8.36016 6.02422 8.35664 6.35117 8.68711L8.00352 10.3395L9.65586 8.68711C9.98633 8.35664 10.5207 8.35664 10.8477 8.68711C11.1746 9.01758 11.1781 9.55195 10.8477 9.87891Z"
                        fill="#ED6759"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2422">
                        <rect width="16" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <div className={css.iconContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="2"
                      viewBox="0 0 10 2"
                      fill="none"
                    >
                      <path
                        d="M0.5 1C0.5 0.734784 0.622916 0.48043 0.841709 0.292893C1.0605 0.105357 1.35725 0 1.66667 0C1.97609 0 2.27283 0.105357 2.49162 0.292893C2.71042 0.48043 2.83333 0.734784 2.83333 1C2.83333 1.26522 2.71042 1.51957 2.49162 1.70711C2.27283 1.89464 1.97609 2 1.66667 2C1.35725 2 1.0605 1.89464 0.841709 1.70711C0.622916 1.51957 0.5 1.26522 0.5 1ZM3.83333 1C3.83333 0.734784 3.95625 0.48043 4.17504 0.292893C4.39383 0.105357 4.69058 0 5 0C5.30942 0 5.60617 0.105357 5.82496 0.292893C6.04375 0.48043 6.16667 0.734784 6.16667 1C6.16667 1.26522 6.04375 1.51957 5.82496 1.70711C5.60617 1.89464 5.30942 2 5 2C4.69058 2 4.39383 1.89464 4.17504 1.70711C3.95625 1.51957 3.83333 1.26522 3.83333 1ZM8.33333 0C8.64275 0 8.9395 0.105357 9.15829 0.292893C9.37708 0.48043 9.5 0.734784 9.5 1C9.5 1.26522 9.37708 1.51957 9.15829 1.70711C8.9395 1.89464 8.64275 2 8.33333 2C8.02391 2 7.72717 1.89464 7.50838 1.70711C7.28958 1.51957 7.16667 1.26522 7.16667 1C7.16667 0.734784 7.28958 0.48043 7.50838 0.292893C7.72717 0.105357 8.02391 0 8.33333 0Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="18"
                    viewBox="0 0 15 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2395)">
                      <path
                        d="M4.28571 0C4.73103 0 5.08929 0.376172 5.08929 0.84375V2.25H9.91071V0.84375C9.91071 0.376172 10.269 0 10.7143 0C11.1596 0 11.5179 0.376172 11.5179 0.84375V2.25H12.8571C14.0391 2.25 15 3.25898 15 4.5V5.0625V6.75V15.75C15 16.991 14.0391 18 12.8571 18H2.14286C0.960938 18 0 16.991 0 15.75V6.75V5.0625V4.5C0 3.25898 0.960938 2.25 2.14286 2.25H3.48214V0.84375C3.48214 0.376172 3.8404 0 4.28571 0ZM13.3929 6.75H1.60714V15.75C1.60714 16.0594 1.84821 16.3125 2.14286 16.3125H12.8571C13.1518 16.3125 13.3929 16.0594 13.3929 15.75V6.75ZM11.0156 10.4414L7.26562 14.3789C6.95089 14.7094 6.44196 14.7094 6.13058 14.3789L3.98772 12.1289C3.67299 11.7984 3.67299 11.2641 3.98772 10.9371C4.30245 10.6102 4.81138 10.6066 5.12277 10.9371L6.69643 12.5895L9.87723 9.24961C10.192 8.91914 10.7009 8.91914 11.0123 9.24961C11.3237 9.58008 11.327 10.1145 11.0123 10.4414H11.0156Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2395">
                        <rect width="15" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2422)">
                      <path
                        d="M4.625 0C5.09258 0 5.46875 0.376172 5.46875 0.84375V2.25H10.5312V0.84375C10.5312 0.376172 10.9074 0 11.375 0C11.8426 0 12.2188 0.376172 12.2188 0.84375V2.25H13.625C14.866 2.25 15.875 3.25898 15.875 4.5V5.0625V6.75V15.75C15.875 16.991 14.866 18 13.625 18H2.375C1.13398 18 0.125 16.991 0.125 15.75V6.75V5.0625V4.5C0.125 3.25898 1.13398 2.25 2.375 2.25H3.78125V0.84375C3.78125 0.376172 4.15742 0 4.625 0ZM14.1875 6.75H1.8125V15.75C1.8125 16.0594 2.06562 16.3125 2.375 16.3125H13.625C13.9344 16.3125 14.1875 16.0594 14.1875 15.75V6.75ZM10.8477 9.87891L9.19531 11.5312L10.8477 13.1836C11.1781 13.5141 11.1781 14.0484 10.8477 14.3754C10.5172 14.7023 9.98281 14.7059 9.65586 14.3754L8.00352 12.723L6.35117 14.3754C6.0207 14.7059 5.48633 14.7059 5.15937 14.3754C4.83242 14.0449 4.82891 13.5105 5.15937 13.1836L6.81172 11.5312L5.15937 9.87891C4.82891 9.54844 4.82891 9.01406 5.15937 8.68711C5.48984 8.36016 6.02422 8.35664 6.35117 8.68711L8.00352 10.3395L9.65586 8.68711C9.98633 8.35664 10.5207 8.35664 10.8477 8.68711C11.1746 9.01758 11.1781 9.55195 10.8477 9.87891Z"
                        fill="#ED6759"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2422">
                        <rect width="16" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <div className={css.iconContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="2"
                      viewBox="0 0 10 2"
                      fill="none"
                    >
                      <path
                        d="M0.5 1C0.5 0.734784 0.622916 0.48043 0.841709 0.292893C1.0605 0.105357 1.35725 0 1.66667 0C1.97609 0 2.27283 0.105357 2.49162 0.292893C2.71042 0.48043 2.83333 0.734784 2.83333 1C2.83333 1.26522 2.71042 1.51957 2.49162 1.70711C2.27283 1.89464 1.97609 2 1.66667 2C1.35725 2 1.0605 1.89464 0.841709 1.70711C0.622916 1.51957 0.5 1.26522 0.5 1ZM3.83333 1C3.83333 0.734784 3.95625 0.48043 4.17504 0.292893C4.39383 0.105357 4.69058 0 5 0C5.30942 0 5.60617 0.105357 5.82496 0.292893C6.04375 0.48043 6.16667 0.734784 6.16667 1C6.16667 1.26522 6.04375 1.51957 5.82496 1.70711C5.60617 1.89464 5.30942 2 5 2C4.69058 2 4.39383 1.89464 4.17504 1.70711C3.95625 1.51957 3.83333 1.26522 3.83333 1ZM8.33333 0C8.64275 0 8.9395 0.105357 9.15829 0.292893C9.37708 0.48043 9.5 0.734784 9.5 1C9.5 1.26522 9.37708 1.51957 9.15829 1.70711C8.9395 1.89464 8.64275 2 8.33333 2C8.02391 2 7.72717 1.89464 7.50838 1.70711C7.28958 1.51957 7.16667 1.26522 7.16667 1C7.16667 0.734784 7.28958 0.48043 7.50838 0.292893C7.72717 0.105357 8.02391 0 8.33333 0Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="18"
                    viewBox="0 0 15 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2395)">
                      <path
                        d="M4.28571 0C4.73103 0 5.08929 0.376172 5.08929 0.84375V2.25H9.91071V0.84375C9.91071 0.376172 10.269 0 10.7143 0C11.1596 0 11.5179 0.376172 11.5179 0.84375V2.25H12.8571C14.0391 2.25 15 3.25898 15 4.5V5.0625V6.75V15.75C15 16.991 14.0391 18 12.8571 18H2.14286C0.960938 18 0 16.991 0 15.75V6.75V5.0625V4.5C0 3.25898 0.960938 2.25 2.14286 2.25H3.48214V0.84375C3.48214 0.376172 3.8404 0 4.28571 0ZM13.3929 6.75H1.60714V15.75C1.60714 16.0594 1.84821 16.3125 2.14286 16.3125H12.8571C13.1518 16.3125 13.3929 16.0594 13.3929 15.75V6.75ZM11.0156 10.4414L7.26562 14.3789C6.95089 14.7094 6.44196 14.7094 6.13058 14.3789L3.98772 12.1289C3.67299 11.7984 3.67299 11.2641 3.98772 10.9371C4.30245 10.6102 4.81138 10.6066 5.12277 10.9371L6.69643 12.5895L9.87723 9.24961C10.192 8.91914 10.7009 8.91914 11.0123 9.24961C11.3237 9.58008 11.327 10.1145 11.0123 10.4414H11.0156Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2395">
                        <rect width="15" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2422)">
                      <path
                        d="M4.625 0C5.09258 0 5.46875 0.376172 5.46875 0.84375V2.25H10.5312V0.84375C10.5312 0.376172 10.9074 0 11.375 0C11.8426 0 12.2188 0.376172 12.2188 0.84375V2.25H13.625C14.866 2.25 15.875 3.25898 15.875 4.5V5.0625V6.75V15.75C15.875 16.991 14.866 18 13.625 18H2.375C1.13398 18 0.125 16.991 0.125 15.75V6.75V5.0625V4.5C0.125 3.25898 1.13398 2.25 2.375 2.25H3.78125V0.84375C3.78125 0.376172 4.15742 0 4.625 0ZM14.1875 6.75H1.8125V15.75C1.8125 16.0594 2.06562 16.3125 2.375 16.3125H13.625C13.9344 16.3125 14.1875 16.0594 14.1875 15.75V6.75ZM10.8477 9.87891L9.19531 11.5312L10.8477 13.1836C11.1781 13.5141 11.1781 14.0484 10.8477 14.3754C10.5172 14.7023 9.98281 14.7059 9.65586 14.3754L8.00352 12.723L6.35117 14.3754C6.0207 14.7059 5.48633 14.7059 5.15937 14.3754C4.83242 14.0449 4.82891 13.5105 5.15937 13.1836L6.81172 11.5312L5.15937 9.87891C4.82891 9.54844 4.82891 9.01406 5.15937 8.68711C5.48984 8.36016 6.02422 8.35664 6.35117 8.68711L8.00352 10.3395L9.65586 8.68711C9.98633 8.35664 10.5207 8.35664 10.8477 8.68711C11.1746 9.01758 11.1781 9.55195 10.8477 9.87891Z"
                        fill="#ED6759"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2422">
                        <rect width="16" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <div className={css.iconContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="2"
                      viewBox="0 0 10 2"
                      fill="none"
                    >
                      <path
                        d="M0.5 1C0.5 0.734784 0.622916 0.48043 0.841709 0.292893C1.0605 0.105357 1.35725 0 1.66667 0C1.97609 0 2.27283 0.105357 2.49162 0.292893C2.71042 0.48043 2.83333 0.734784 2.83333 1C2.83333 1.26522 2.71042 1.51957 2.49162 1.70711C2.27283 1.89464 1.97609 2 1.66667 2C1.35725 2 1.0605 1.89464 0.841709 1.70711C0.622916 1.51957 0.5 1.26522 0.5 1ZM3.83333 1C3.83333 0.734784 3.95625 0.48043 4.17504 0.292893C4.39383 0.105357 4.69058 0 5 0C5.30942 0 5.60617 0.105357 5.82496 0.292893C6.04375 0.48043 6.16667 0.734784 6.16667 1C6.16667 1.26522 6.04375 1.51957 5.82496 1.70711C5.60617 1.89464 5.30942 2 5 2C4.69058 2 4.39383 1.89464 4.17504 1.70711C3.95625 1.51957 3.83333 1.26522 3.83333 1ZM8.33333 0C8.64275 0 8.9395 0.105357 9.15829 0.292893C9.37708 0.48043 9.5 0.734784 9.5 1C9.5 1.26522 9.37708 1.51957 9.15829 1.70711C8.9395 1.89464 8.64275 2 8.33333 2C8.02391 2 7.72717 1.89464 7.50838 1.70711C7.28958 1.51957 7.16667 1.26522 7.16667 1C7.16667 0.734784 7.28958 0.48043 7.50838 0.292893C7.72717 0.105357 8.02391 0 8.33333 0Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="18"
                    viewBox="0 0 15 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2395)">
                      <path
                        d="M4.28571 0C4.73103 0 5.08929 0.376172 5.08929 0.84375V2.25H9.91071V0.84375C9.91071 0.376172 10.269 0 10.7143 0C11.1596 0 11.5179 0.376172 11.5179 0.84375V2.25H12.8571C14.0391 2.25 15 3.25898 15 4.5V5.0625V6.75V15.75C15 16.991 14.0391 18 12.8571 18H2.14286C0.960938 18 0 16.991 0 15.75V6.75V5.0625V4.5C0 3.25898 0.960938 2.25 2.14286 2.25H3.48214V0.84375C3.48214 0.376172 3.8404 0 4.28571 0ZM13.3929 6.75H1.60714V15.75C1.60714 16.0594 1.84821 16.3125 2.14286 16.3125H12.8571C13.1518 16.3125 13.3929 16.0594 13.3929 15.75V6.75ZM11.0156 10.4414L7.26562 14.3789C6.95089 14.7094 6.44196 14.7094 6.13058 14.3789L3.98772 12.1289C3.67299 11.7984 3.67299 11.2641 3.98772 10.9371C4.30245 10.6102 4.81138 10.6066 5.12277 10.9371L6.69643 12.5895L9.87723 9.24961C10.192 8.91914 10.7009 8.91914 11.0123 9.24961C11.3237 9.58008 11.327 10.1145 11.0123 10.4414H11.0156Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2395">
                        <rect width="15" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>

              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_70_2422)">
                      <path
                        d="M4.625 0C5.09258 0 5.46875 0.376172 5.46875 0.84375V2.25H10.5312V0.84375C10.5312 0.376172 10.9074 0 11.375 0C11.8426 0 12.2188 0.376172 12.2188 0.84375V2.25H13.625C14.866 2.25 15.875 3.25898 15.875 4.5V5.0625V6.75V15.75C15.875 16.991 14.866 18 13.625 18H2.375C1.13398 18 0.125 16.991 0.125 15.75V6.75V5.0625V4.5C0.125 3.25898 1.13398 2.25 2.375 2.25H3.78125V0.84375C3.78125 0.376172 4.15742 0 4.625 0ZM14.1875 6.75H1.8125V15.75C1.8125 16.0594 2.06562 16.3125 2.375 16.3125H13.625C13.9344 16.3125 14.1875 16.0594 14.1875 15.75V6.75ZM10.8477 9.87891L9.19531 11.5312L10.8477 13.1836C11.1781 13.5141 11.1781 14.0484 10.8477 14.3754C10.5172 14.7023 9.98281 14.7059 9.65586 14.3754L8.00352 12.723L6.35117 14.3754C6.0207 14.7059 5.48633 14.7059 5.15937 14.3754C4.83242 14.0449 4.82891 13.5105 5.15937 13.1836L6.81172 11.5312L5.15937 9.87891C4.82891 9.54844 4.82891 9.01406 5.15937 8.68711C5.48984 8.36016 6.02422 8.35664 6.35117 8.68711L8.00352 10.3395L9.65586 8.68711C9.98633 8.35664 10.5207 8.35664 10.8477 8.68711C11.1746 9.01758 11.1781 9.55195 10.8477 9.87891Z"
                        fill="#ED6759"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_70_2422">
                        <rect width="16" height="18" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </NamedLink>
              <NamedLink className={css.listContentRow} name="ConfirmationWizardPage">
                <div className={css.listCols}>
                  <div className={css.nameCol}>John Doe</div>
                  <div className={css.emailCol}>JohnDoe@gmail.com</div>
                </div>
                <div className={css.lastCol}>
                  <div className={css.iconContainer}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="2"
                      viewBox="0 0 10 2"
                      fill="none"
                    >
                      <path
                        d="M0.5 1C0.5 0.734784 0.622916 0.48043 0.841709 0.292893C1.0605 0.105357 1.35725 0 1.66667 0C1.97609 0 2.27283 0.105357 2.49162 0.292893C2.71042 0.48043 2.83333 0.734784 2.83333 1C2.83333 1.26522 2.71042 1.51957 2.49162 1.70711C2.27283 1.89464 1.97609 2 1.66667 2C1.35725 2 1.0605 1.89464 0.841709 1.70711C0.622916 1.51957 0.5 1.26522 0.5 1ZM3.83333 1C3.83333 0.734784 3.95625 0.48043 4.17504 0.292893C4.39383 0.105357 4.69058 0 5 0C5.30942 0 5.60617 0.105357 5.82496 0.292893C6.04375 0.48043 6.16667 0.734784 6.16667 1C6.16667 1.26522 6.04375 1.51957 5.82496 1.70711C5.60617 1.89464 5.30942 2 5 2C4.69058 2 4.39383 1.89464 4.17504 1.70711C3.95625 1.51957 3.83333 1.26522 3.83333 1ZM8.33333 0C8.64275 0 8.9395 0.105357 9.15829 0.292893C9.37708 0.48043 9.5 0.734784 9.5 1C9.5 1.26522 9.37708 1.51957 9.15829 1.70711C8.9395 1.89464 8.64275 2 8.33333 2C8.02391 2 7.72717 1.89464 7.50838 1.70711C7.28958 1.51957 7.16667 1.26522 7.16667 1C7.16667 0.734784 7.28958 0.48043 7.50838 0.292893C7.72717 0.105357 8.02391 0 8.33333 0Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </div>
              </NamedLink>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default RSVPListPage;
