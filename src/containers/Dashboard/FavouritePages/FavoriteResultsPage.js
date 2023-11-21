import React from 'react';

import { Page, LayoutSingleColumn, DashboardMenu, ExperienceCard } from '../../../components';
import TopbarContainer from '../../TopbarContainer/TopbarContainer';
import FooterContainer from '../../FooterContainer/FooterContainer';

import css from './FavoriteResultsPage.module.css';

import ImgFav1 from '../../../assets/images/dashboard/fav1.png';
import ImgFav2 from '../../../assets/images/dashboard/fav2.png';
import ImgFav3 from '../../../assets/images/dashboard/fav3.png';
import ImgFav4 from '../../../assets/images/dashboard/fav4.png';
import SlackIcon from '../../../assets/images/dashboard/slack.png';
import FavouriteCard from '../../../components/FavouriteCard/FavouriteCard';

export const FavoriteResultsPage = props => {
  return (
    <Page title={'Polls'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <DashboardMenu active={3} hover={2} />
          <div className={css.content}>
            <div className={css.top}>
              <div className={css.titleContainer}>
                <div className={css.h4}>See the results.</div>
                <div className={css.p20}>
                  You can see your latest poll results at any time, or you can create a new poll.
                </div>
              </div>
              <div className={css.buttons}>
                <div className={css.leftBtnGroup}>
                  <div className={css.btnDark}>
                    <img src={SlackIcon} />
                    <div>Share to Slack</div>
                  </div>
                  <div className={css.btnDark}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="21"
                      viewBox="0 0 18 21"
                      fill="none"
                    >
                      <path
                        d="M10.2859 3.42829C10.2859 2.71713 9.71137 2.14258 9.00021 2.14258C8.28905 2.14258 7.71449 2.71713 7.71449 3.42829V9.21401H1.92878C1.21762 9.21401 0.643066 9.78856 0.643066 10.4997C0.643066 11.2109 1.21762 11.7854 1.92878 11.7854H7.71449V17.5711C7.71449 18.2823 8.28905 18.8569 9.00021 18.8569C9.71137 18.8569 10.2859 18.2823 10.2859 17.5711V11.7854H16.0716C16.7828 11.7854 17.3574 11.2109 17.3574 10.4997C17.3574 9.78856 16.7828 9.21401 16.0716 9.21401H10.2859V3.42829Z"
                        fill="#06C167"
                      />
                    </svg>
                    <div>Create Poll</div>
                  </div>
                  <div className={css.btnDark}>
                    <div>See Results</div>
                  </div>
                </div>
                <div className={css.rightBtnGroup}>
                  <div className={css.btnSecondary}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="17"
                      viewBox="0 0 18 17"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_72_1593)">
                        <path
                          d="M17.7062 2.20664C18.0969 1.81602 18.0969 1.18164 17.7062 0.791016C17.3156 0.400391 16.6812 0.400391 16.2906 0.791016L10.2906 6.79102L9.20625 5.70664C9.075 5.57539 8.89375 5.50039 8.70625 5.50039C8.31563 5.50039 8 5.81602 8 6.20664V7.11602L11.3844 10.5004H12.2937C12.6844 10.5004 13 10.1848 13 9.79414C13 9.60664 12.925 9.42539 12.7937 9.29414L11.7094 8.20977L17.7094 2.20977L17.7062 2.20664ZM10.6594 11.5441L6.95625 7.84102C5.62188 7.72539 4.29375 8.20664 3.3375 9.16289L3.0875 9.41289C2.39062 10.1098 2 11.0535 2 12.0379C2 12.2504 2.22187 12.3879 2.4125 12.2941L4.00938 11.4973C4.16563 11.4191 4.30625 11.6254 4.17812 11.7441L0.228125 15.2941C0.084375 15.4254 0 15.6129 0 15.8098C0 16.191 0.309375 16.5004 0.690625 16.5004H6.10625C7.31875 16.5004 8.47812 16.0191 9.3375 15.1629C10.2937 14.2066 10.7719 12.8785 10.6594 11.5441Z"
                          fill="#06C167"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_72_1593">
                          <rect width="18" height="16" fill="white" transform="translate(0 0.5)" />
                        </clipPath>
                      </defs>
                    </svg>
                    <div>Clear favorites</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.bottom}>
              <FavouriteCard
                title={'SoHo Skyline Venue'}
                comment={'x Arlo Hotel'}
                price={'From $3,000 / person'}
                background={ImgFav1}
                location={'Location'}
              />
              <FavouriteCard
                title={'SoHo Skyline Venue'}
                comment={'x Arlo Hotel'}
                price={'From $3,000 / person'}
                background={ImgFav2}
                location={'Location'}
              />
              <FavouriteCard
                title={'SoHo Skyline Venue'}
                comment={'x Arlo Hotel'}
                price={'From $3,000 / person'}
                background={ImgFav3}
                location={'Location'}
              />
              <FavouriteCard
                title={'SoHo Skyline Venue'}
                comment={'x Arlo Hotel'}
                price={'From $3,000 / person'}
                background={ImgFav4}
                location={'Location'}
              />
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default FavoriteResultsPage;
