import React, { useState } from 'react';
import CustomListingCard from '../CustomListingCard/CustomListingCard';
import css from './SectionListingByFilter.module.css';

const SectionListingByFilter = () => {
  return (
    <div className={css.sectionbody}>
      <div className={css.sectionfilter}>
        <div className={css.filteritemactive}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="15"
            viewBox="0 0 11 15"
            fill="none"
          >
            <g clipPath="url(#clip0_52_227)">
              <path
                d="M6.17891 14.15C7.64844 12.3945 11 8.13984 11 5.75C11 2.85156 8.53646 0.5 5.5 0.5C2.46354 0.5 0 2.85156 0 5.75C0 8.13984 3.35156 12.3945 4.82109 14.15C5.17344 14.5684 5.82656 14.5684 6.17891 14.15ZM5.5 4C5.98623 4 6.45255 4.18437 6.79636 4.51256C7.14018 4.84075 7.33333 5.28587 7.33333 5.75C7.33333 6.21413 7.14018 6.65925 6.79636 6.98744C6.45255 7.31563 5.98623 7.5 5.5 7.5C5.01377 7.5 4.54745 7.31563 4.20364 6.98744C3.85982 6.65925 3.66667 6.21413 3.66667 5.75C3.66667 5.28587 3.85982 4.84075 4.20364 4.51256C4.54745 4.18437 5.01377 4 5.5 4Z"
                fill="#06C167"
              />
            </g>
            <defs>
              <clipPath id="clip0_52_227">
                <rect width="11" height="14" fill="white" transform="translate(0 0.5)" />
              </clipPath>
            </defs>
          </svg>
          Location
        </div>
        <div className={css.filteritem}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="19"
            viewBox="0 0 14 19"
            fill="none"
          >
            <path
              d="M7 9.5C8.06087 9.5 9.07828 9.10491 9.82843 8.40165C10.5786 7.69839 11 6.74456 11 5.75C11 4.75544 10.5786 3.80161 9.82843 3.09835C9.07828 2.39509 8.06087 2 7 2C5.93913 2 4.92172 2.39509 4.17157 3.09835C3.42143 3.80161 3 4.75544 3 5.75C3 6.74456 3.42143 7.69839 4.17157 8.40165C4.92172 9.10491 5.93913 9.5 7 9.5ZM5.57188 10.9062C2.49375 10.9062 0 13.2441 0 16.1299C0 16.6104 0.415625 17 0.928125 17H13.0719C13.5844 17 14 16.6104 14 16.1299C14 13.2441 11.5063 10.9062 8.42813 10.9062H5.57188Z"
              fill="#06C167"
            />
          </svg>
          Group size
        </div>
        <div className={css.filteritem}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="17"
            viewBox="0 0 16 17"
            fill="none"
          >
            <path
              d="M0 2.65636V7.62023C0 8.18468 0.239286 8.72589 0.667857 9.12433L6.95357 14.9681C7.84643 15.7982 9.29286 15.7982 10.1857 14.9681L14.9536 10.5355C15.8464 9.70538 15.8464 8.36066 14.9536 7.53058L8.66786 1.68683C8.23929 1.28839 7.65714 1.06593 7.05 1.06593H1.71429C0.767857 1.06261 0 1.77648 0 2.65636ZM4 3.71886C4.3031 3.71886 4.59379 3.8308 4.80812 4.03006C5.02245 4.22932 5.14286 4.49957 5.14286 4.78136C5.14286 5.06315 5.02245 5.3334 4.80812 5.53266C4.59379 5.73192 4.3031 5.84386 4 5.84386C3.6969 5.84386 3.4062 5.73192 3.19188 5.53266C2.97755 5.3334 2.85714 5.06315 2.85714 4.78136C2.85714 4.49957 2.97755 4.22932 3.19188 4.03006C3.4062 3.8308 3.6969 3.71886 4 3.71886Z"
              fill="#06C167"
            />
          </svg>
          Budget
        </div>
        <div className={css.filteritem}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="17"
            viewBox="0 0 13 17"
            fill="none"
          >
            <g clipPath="url(#clip0_52_233)">
              <path
                d="M6.5 1.59375C6.5 1.17106 6.6712 0.765685 6.97595 0.466799C7.2807 0.167912 7.69402 0 8.125 0C8.55597 0 8.9693 0.167912 9.27405 0.466799C9.57879 0.765685 9.75 1.17106 9.75 1.59375C9.75 2.01644 9.57879 2.42182 9.27405 2.7207C8.9693 3.01959 8.55597 3.1875 8.125 3.1875C7.69402 3.1875 7.2807 3.01959 6.97595 2.7207C6.6712 2.42182 6.5 2.01644 6.5 1.59375ZM8.23672 7.65996L7.5901 10.1934L9.27265 11.8436C9.57734 12.1424 9.75 12.5475 9.75 12.9691V15.9375C9.75 16.5252 9.26588 17 8.66667 17C8.06745 17 7.58333 16.5252 7.58333 15.9375V13.1916L5.08151 10.7379C4.54661 10.2133 4.32995 9.45625 4.50937 8.73574L5.2 5.94668C5.48099 4.81445 6.64557 4.12383 7.79661 4.40605C8.43984 4.56543 9.00182 4.95059 9.36745 5.4918L10.3289 6.90625H11.375V6.10938C11.375 5.66777 11.7372 5.3125 12.1875 5.3125C12.6378 5.3125 13 5.66777 13 6.10938V7.96211C13 7.96543 13 7.96875 13 7.96875V7.97539V16.2031C13 16.6447 12.6378 17 12.1875 17C11.7372 17 11.375 16.6447 11.375 16.2031V9.03125H10.0411C9.49948 9.03125 8.99167 8.76562 8.69036 8.3207L8.2401 7.65664L8.23672 7.65996ZM2.74557 15.6686L3.97109 11.0898C4.07265 11.2293 4.18776 11.3621 4.31302 11.485L5.73151 12.8762L4.83776 16.2064C4.68541 16.7742 4.09297 17.1129 3.51406 16.9635C2.93515 16.8141 2.58984 16.233 2.74219 15.6652L2.74557 15.6686ZM4.62448 4.18027L3.43281 8.84863C3.33125 9.25039 2.92838 9.50937 2.51198 9.44297L0.890363 9.17734C0.416404 9.10098 0.115102 8.63613 0.240363 8.18125L1.07995 5.14648C1.40156 3.99102 2.47135 3.1875 3.69349 3.1875H3.83568C4.3638 3.1875 4.75312 3.67559 4.62448 4.17695V4.18027Z"
                fill="#06C167"
              />
            </g>
            <defs>
              <clipPath id="clip0_52_233">
                <rect width="13" height="17" fill="white" />
              </clipPath>
            </defs>
          </svg>
          Experience Type
        </div>
        <div className={css.filteritem}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="17"
            viewBox="0 0 19 17"
            fill="none"
          >
            <path
              d="M12.6667 15.9375H14.25C14.626 15.9375 14.9724 15.7383 15.1604 15.4096L18.8549 9.03457C19.0462 8.70586 19.0462 8.30078 18.8582 7.96875C18.6701 7.63672 18.3238 7.4375 17.9444 7.4375H4.75C4.37396 7.4375 4.0276 7.63672 3.83958 7.96543L1.58333 11.8568V3.1875C1.58333 2.89531 1.82083 2.65625 2.11111 2.65625H5.98698C6.12552 2.65625 6.26076 2.7127 6.35972 2.8123L7.23385 3.69219C7.92656 4.38945 8.86667 4.78125 9.84635 4.78125H13.7222C14.0125 4.78125 14.25 5.02031 14.25 5.3125V6.375H15.8333V5.3125C15.8333 4.14043 14.8866 3.1875 13.7222 3.1875H9.84635C9.28559 3.1875 8.74792 2.96504 8.35208 2.5666L7.47795 1.6834C7.08212 1.28496 6.54444 1.0625 5.98368 1.0625H2.11111C0.946701 1.0625 0 2.01543 0 3.1875V13.8125C0 14.9846 0.946701 15.9375 2.11111 15.9375H2.89288H12.6667Z"
              fill="#06C167"
            />
          </svg>
          Category
        </div>
      </div>
      <div className={css.sectioncontent}>
        <div className={css.totalcount}>63 experiences</div>
        <div className={css.cardgroup}>
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature1.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature2.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature3.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
        </div>
        <div className={css.cardgroup}>
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
        </div>
        <div className={css.schedulebody}>
          <div className={css.schedulecontent}>
            <div className={css.scheduledescription}>
              <div className={css.scheduledescriptioncontent}>
                <div className={css.scheduledescriptiontitle}>Gather Together</div>
                <div className={css.scheduledescriptiontext}>
                  On-site, outside, or in-office, the most distinctive Carribean experiences
                </div>
              </div>
              <div className={css.scheduleaction}>Schedule a call</div>
            </div>
          </div>
        </div>
        <div className={css.cardgroup}>
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
          <CustomListingCard
            title={'SoHo Skyline Venue'}
            location={'location'}
            isFavourite={true}
            hotel={'X Arlo Hotel'}
            background={'../../assets/images/home/feature4.png'}
            price={'From $3,000 / person'}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionListingByFilter;
