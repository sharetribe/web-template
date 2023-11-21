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
                </div>
                <div className={css.payment}>
                  <div className={css.title}>Payment</div>
                </div>
              </div>
              <div className={css.conversations}>
                <div className={css.submitForm}>
                  <div className={css.title}>Conversations with the host</div>
                  <div className={css.textarea}>Send a message to the host</div>
                  <div className={css.action}><div className={css.submit}>Submit</div></div>
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
