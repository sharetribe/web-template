import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BookingPage.module.css';
import BookingTeamImage from '../../assets/images/booking-team.png';
import SVGCommunity from '../../assets/images/booking-teams.svg';
import SVGCreativity from '../../assets/images/booking-creativity.svg';
import SVGSuccess from '../../assets/images/booking-success.svg';
import BookingAvatar from '../../assets/images/booking-avatar.png';
import SVGMention from '../../assets/images/mention.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

export const BookingPageComponent = props => {
  return (
    <Page title={'About Us'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.slider}>
            <div className={css.slider_caption}>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="186"
                  height="65"
                  viewBox="0 0 186 65"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 51.9218H10.7718V41.1499H11.4693C12.8642 48.8219 17.9789 52.6967 26.9683 52.6967C39.0576 52.6967 45.6447 44.7922 45.6447 32.548C45.6447 20.1487 39.1351 12.3217 27.5108 12.3217C18.2889 12.3217 13.5617 17.1523 12.2442 23.6619H11.6243V0H0V51.9218ZM22.9386 42.0799C15.5765 42.0799 11.6243 39.5225 11.6243 32.7805V32.1605C11.6243 25.4184 15.499 22.9386 23.0161 22.9386C30.4556 22.9386 33.8654 25.4184 33.8654 32.548C33.8654 39.6 30.4556 42.0799 22.9386 42.0799ZM47.7892 32.6247C47.7892 46.4188 56.6236 52.7734 69.5653 52.7734C81.8871 52.7734 90.1016 46.8838 90.1016 38.4368V37.5844H78.4773V38.3593C78.4773 41.6916 76.0749 43.474 69.1779 43.474C61.6608 43.474 58.871 40.9166 58.561 34.9495H90.1791C90.2033 34.7437 90.2275 34.5454 90.2511 34.352L90.2516 34.3482L90.2518 34.3466C90.3791 33.3047 90.489 32.4047 90.489 31.2298C90.489 19.063 82.0421 12.3984 69.3328 12.3984C56.5461 12.3984 47.7892 20.2255 47.7892 32.6247ZM58.716 28.8274C59.2585 23.7902 62.2033 21.4654 69.1004 21.4654C75.9199 21.4654 79.0198 23.7127 79.3297 28.8274H58.716ZM119.48 51.4833H105.144L87.4747 12.6582H100.416L112.041 40.169H112.816L124.517 12.6582H137.227L119.48 51.4833ZM143.429 64.58H149.515C158.866 64.58 163.838 62.336 167.401 54.2111L185.806 12.6582H173.412L166.362 30.3008L163.393 39.509H162.651L159.534 30.3782L151.667 12.6582H139.05L157.233 51.5802C156.491 53.2825 155.303 54.0563 152.558 54.0563H143.429V64.58Z"
                    fill="#111111"
                  />
                </svg>
              </div>
              <div>Experiences</div>
            </div>
          </div>

          <div className={css.content}>
            <div className={css.section_team}>
              <div className={css.section_team_desc}>
                <h2>We make team development fun and engaging.</h2>
                <p>
                  Bevy is the event marketplace for teams of all sizes. We make it easy to find and
                  book events that will help your team connect, collaborate, and thrive. Whether
                  you're looking for a one-time event or an ongoing program, we have a wide variety
                  of options to choose from. We believe that teams that connect and collaborate are
                  more productive, innovative, and successful.{' '}
                </p>
              </div>
              <div className={css.section_team_image}>
                <img src={BookingTeamImage} className={css.team_image} />
              </div>
            </div>
            <div className={css.section_mission}>
              <div className={css.mission_firstline}>
                Our mission is to make it easy for companies to create and{' '}
              </div>
              <div className={css.mission_secondline}>
                book unforgettable events that bring their teams together.
              </div>
            </div>

            <div className={css.section_book_a_demo}>
              <div className={css.section_book_left}>
                <div className={css.book_demo_desc}>
                  Make your company a place where everyone feels connected and valued.
                </div>
                <div className={css.buttnBooking}>Book a demo</div>
              </div>
              <div className={css.section_book_right}>
                <div className={css.section_book_right_col}>
                  <div className={css.section_book_right_col_svg}>
                    <img src={SVGCommunity} />
                  </div>
                  <div className={css.section_booking_right_col_desc}>
                    <div className={css.section_book_right_col_title}>Community</div>
                    <div className={css.section_book_right_col_content}>
                      Bevy is a place where teams come together to collaborate, learn, and grow. We
                      believe that the best results come when people feel connected and supported.
                      That's why we foster a culture of inclusion, respect, and diversity.
                    </div>
                  </div>
                </div>
                <div className={css.section_book_right_col}>
                  <div className={css.section_book_right_col_svg}>
                    <img src={SVGCreativity} />
                  </div>
                  <div className={css.section_booking_right_col_desc}>
                    <div className={css.section_book_right_col_title}>Creativity</div>
                    <div className={css.section_book_right_col_content}>
                      At Bevy, we believe that creativity is essential for success. That's why we're
                      committed to providing a space where teams can come together to have fun and
                      be creative.
                    </div>
                  </div>
                </div>
                <div className={css.section_book_right_col}>
                  <div className={css.section_book_right_col_svg}>
                    <img src={SVGSuccess} />
                  </div>
                  <div className={css.section_booking_right_col_desc}>
                    <div className={css.section_book_right_col_title}>Success</div>
                    <div className={css.section_book_right_col_content}>
                      At Bevy, we believe that everyone deserves to be successful. That's why we're
                      committed to providing teams with the events and resources they need to learn,
                      grow, and develop the skills they need to succeed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.section_teams_together}>
              <div className={css.section_teams_together_l}></div>
              <div className={css.section_teams_together_r}>
                <div className={css.section_teams_together_r_title}>
                  Extraordinary experiences that bring teams together
                </div>
                <div className={css.section_teams_together_r_content}>
                  Whether you're thinking of hosting an offsite for the company, need unique
                  culture-building activities for your remote team, or to let loose with with your
                  squad, Bevy Experiences has something for you.
                </div>
              </div>
            </div>

            <div className={css.section_more_reasons}>
              <div className={css.section_more_reasons_l}>
                <h2>More Reasons to Trust in Bevy Experiences</h2>
                <div className={css.section_more_reasons_l_list}>
                  <div className={css.section_more_reasons_l_list_item}>
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className={css.section_more_reasions_l_icon}
                    />
                    <div>100% Money Back Guarantee</div>
                  </div>
                  <div className={css.section_more_reasons_l_list_item}>
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className={css.section_more_reasions_l_icon}
                    />
                    <div>Our team knows the best experience hosts</div>
                  </div>
                </div>
              </div>
              <div className={css.section_more_reasons_r}>
                <div className={css.section_more_reasons_r_l}>
                  <div className={css.section_more_reasons_r_l_title}>
                    Leveraging years of experience in Events, Marketing & Management
                  </div>
                  <div className={css.section_more_reasons_r_l_avatar}>
                    <img src={BookingAvatar} className={css.section_more_reasons_r_l_avatar_img} />
                    <div className={css.section_more_reasons_r_l_avatar_text}>
                      <div className={css.avatar_name}>Janay Symonette</div>
                      <div className={css.avatar_position}>Founder</div>
                    </div>
                  </div>
                </div>
                <div>
                  <img src={SVGMention} className={css.iconMention} />
                </div>
              </div>
            </div>

            <div className={css.section_live_demo}>
              <div>
                <div className={css.section_live_demo_title}>Book A Live Demo and get</div>
                <div className={css.section_live_demo_discount}>15% off any booking. </div>
              </div>
              <div>
                <div className={css.section_live_demo_desc}>
                  Want to learn more? Our pleasure! Book a demo with our founder and dedicate
                  experience coordinators and get 15% off your first booking.
                </div>
              </div>
              <div className={css.section_live_demo_button_container}>
                <div className={css.section_live_demo_button}>Give it a try</div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

BookingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const BookingPage = compose(connect(mapStateToProps))(BookingPageComponent);

export default BookingPage;
