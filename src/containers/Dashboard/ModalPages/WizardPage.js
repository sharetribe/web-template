import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';

import css from './WizardPage.module.css';
import ModalPageHeader from '../../../components/ModalPageHeader/ModalPageHeader';
import SectionVirtualEscRoom from '../../../components/SectionVirtualEscRoom/SectionVirtualEscRoom';

import IconPending from '../../../assets/images/dashboard/pending.png';
import IconConfirmed from '../../../assets/images/dashboard/confirmed.png';
import IconUpcoming from '../../../assets/images/dashboard/upcoming.png';
import IconCompleted from '../../../assets/images/dashboard/completed.png';

export const WizardPage = props => {
  return (
    <Page title={'Confirmation Wizard'} className={css.page} scrollingDisabled={false}>
      <div className={css.root}>
        <div>
          <ModalPageHeader />
        </div>
        <div className={css.content}>
          <SectionVirtualEscRoom actions={true} />
          <div className={css.rightContainer}>
            <div className={css.h5}>
              We’re confirming availability with your host. We will email you within 2 days to
              confirm your time.
            </div>
            <div className={css.wizards}>
              <div className={css.stepBaseline}></div>
              <div className={css.steps}>
                <div className={css.icon}>
                  <img src={IconPending} />
                </div>
                <div className={css.step}>Pending</div>
              </div>
              <div className={css.steps}>
                <div className={css.icon}>
                  <img src={IconConfirmed} />
                </div>
                <div className={css.step}>Confirmed</div>
              </div>
              <div className={css.steps}>
                <div className={css.icon}>
                  <img src={IconUpcoming} />
                </div>
                <div className={css.step}>Upcoming</div>
              </div>
              <div className={css.steps}>
                <div className={css.icon}>
                  <img src={IconCompleted} />
                </div>
                <div className={css.step}>Completed</div>
              </div>
            </div>

            {/** Bottom */}
            <div className={css.bottom}>
              <div className={css.balance}>
                <div className={css.guests}>
                  <div className={css.title}>Guests</div>
                  <div className={css.guestcontent}>
                    <div className={css.guestestimats}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="16"
                        viewBox="0 0 14 16"
                        fill="none"
                      >
                        <g clip-path="url(#clip0_71_1396)">
                          <path
                            d="M4.75 0.75C4.75 0.334375 4.41563 0 4 0C3.58437 0 3.25 0.334375 3.25 0.75V2H2C0.896875 2 0 2.89687 0 4V4.5V6V14C0 15.1031 0.896875 16 2 16H12C13.1031 16 14 15.1031 14 14V6V4.5V4C14 2.89687 13.1031 2 12 2H10.75V0.75C10.75 0.334375 10.4156 0 10 0C9.58438 0 9.25 0.334375 9.25 0.75V2H4.75V0.75ZM1.5 6H4V7.75H1.5V6ZM1.5 9.25H4V11.25H1.5V9.25ZM5.5 9.25H8.5V11.25H5.5V9.25ZM10 9.25H12.5V11.25H10V9.25ZM12.5 7.75H10V6H12.5V7.75ZM12.5 12.75V14C12.5 14.275 12.275 14.5 12 14.5H10V12.75H12.5ZM8.5 12.75V14.5H5.5V12.75H8.5ZM4 12.75V14.5H2C1.725 14.5 1.5 14.275 1.5 14V12.75H4ZM8.5 7.75H5.5V6H8.5V7.75Z"
                            fill="#227667"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_71_1396">
                            <rect width="14" height="16" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      Estimated guests
                    </div>
                    7 guests
                  </div>
                  <div className={css.guestbtn}>Manage guests</div>
                </div>
                <div className={css.payment}>
                  <div className={css.title}>Payment</div>
                  <div className={css.paymentcontent}>
                    <div className={css.paymentbtn}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <g clip-path="url(#clip0_71_1433)">
                          <path
                            d="M1.75781 1.75781L0.960938 0.960938C0.607031 0.607031 0 0.857813 0 1.35703V3.9375C0 4.24922 0.250781 4.5 0.5625 4.5H3.14297C3.64453 4.5 3.89531 3.89297 3.54141 3.53906L2.81953 2.81719C3.63281 2.00391 4.75781 1.5 6 1.5C8.48438 1.5 10.5 3.51562 10.5 6C10.5 8.48438 8.48438 10.5 6 10.5C5.04375 10.5 4.15781 10.2023 3.42891 9.69375C3.08906 9.45703 2.62266 9.53906 2.38359 9.87891C2.14453 10.2188 2.22891 10.6852 2.56875 10.9242C3.54375 11.6016 4.72734 12 6 12C9.31406 12 12 9.31406 12 6C12 2.68594 9.31406 0 6 0C4.34297 0 2.84297 0.672656 1.75781 1.75781ZM6 3C5.68828 3 5.4375 3.25078 5.4375 3.5625V6C5.4375 6.15 5.49609 6.29297 5.60156 6.39844L7.28906 8.08594C7.50938 8.30625 7.86562 8.30625 8.08359 8.08594C8.30156 7.86562 8.30391 7.50938 8.08359 7.29141L6.56016 5.76797V3.5625C6.56016 3.25078 6.30937 3 5.99766 3H6Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_71_1433">
                            <rect width="12" height="12" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      Pending
                    </div>
                    $123.1
                  </div>
                </div>
              </div>
              <div className={css.conversations}>
                <div className={css.submitForm}>
                  <div className={css.title}>Conversations with the host</div>
                  <textarea
                    className={css.textarea}
                    placeholder="Send a message to the host"
                  ></textarea>
                  <div className={css.action}>
                    <div className={css.submit}>Submit</div>
                  </div>
                </div>
                <div className={css.list}>
                  <div className={css.row}>
                    <div className={css.avatar}></div>
                    <div className={css.conversation}></div>
                  </div>
                </div>
                <div className={css.btnLoadMore}>
                  <div>Load more</div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="13"
                    viewBox="0 0 11 13"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_309_5167)">
                      <path
                        d="M6.25 2.375C6.25 1.96016 5.91484 1.625 5.5 1.625C5.08516 1.625 4.75 1.96016 4.75 2.375V5.75H1.375C0.960156 5.75 0.625 6.08516 0.625 6.5C0.625 6.91484 0.960156 7.25 1.375 7.25H4.75V10.625C4.75 11.0398 5.08516 11.375 5.5 11.375C5.91484 11.375 6.25 11.0398 6.25 10.625V7.25H9.625C10.0398 7.25 10.375 6.91484 10.375 6.5C10.375 6.08516 10.0398 5.75 9.625 5.75H6.25V2.375Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_309_5167">
                        <rect
                          width="10.5"
                          height="12"
                          fill="white"
                          transform="translate(0.25 0.5)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default WizardPage;
