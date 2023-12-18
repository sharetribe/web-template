import React from 'react';
import { Page, LayoutSingleColumn, NamedLink } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BookingSuccessPage.module.css';

import BookingImg from '../../assets/images/bookingdetail/goteam.svg';

export const BookingSuccessPage = props => {
  return (
    <Page title={'Blog'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.pagecontainer}>
            <div className={css.pageleft}>
              <div className={css.title}>Go team!</div>
              <div className={css.description}>
                Your experience is pending ⏳. <br />
                We’ll confirm if your host is available.
              </div>
              <div className={css.sendmsg}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="21"
                  viewBox="0 0 20 21"
                  fill="none"
                >
                  <path
                    d="M2.5 4.875C2.15625 4.875 1.875 5.15625 1.875 5.5V6.36328L8.61328 11.8945C9.42188 12.5586 10.582 12.5586 11.3906 11.8945L18.125 6.36328V5.5C18.125 5.15625 17.8438 4.875 17.5 4.875H2.5ZM1.875 8.78906V15.5C1.875 15.8438 2.15625 16.125 2.5 16.125H17.5C17.8438 16.125 18.125 15.8438 18.125 15.5V8.78906L12.5781 13.3438C11.0781 14.5742 8.91797 14.5742 7.42188 13.3438L1.875 8.78906ZM0 5.5C0 4.12109 1.12109 3 2.5 3H17.5C18.8789 3 20 4.12109 20 5.5V15.5C20 16.8789 18.8789 18 17.5 18H2.5C1.12109 18 0 16.8789 0 15.5V5.5Z"
                    fill="#06C167"
                  />
                </svg>
                Send a message to the host
              </div>
              <NamedLink className={css.backbtn} name="ExperiencesPage">
                Back to marketplace
              </NamedLink>
            </div>
            <div className={css.pageright}>
              <img src={BookingImg} />
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default BookingSuccessPage;
