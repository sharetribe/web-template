import React, { useState } from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import CustomListingCard from '../../components/CustomListingCard/CustomListingCard';
import ExperienceFilter from '../../components/ExperienceFilter/ExperienceFilter';

import css from './Experiences.module.css';

export const ExperiencesComponent = props => {
  const [activeFilterItem, setActiveFilterItem] = useState('in-person');
  const [modalShow, setModalShow] = useState(false);

  const onClickFilterItem = filterItem => {
    setActiveFilterItem(filterItem);
  };

  const onClickFilterBtn = () => {
    if (!modalShow) document.body.style.overflowY = 'hidden';
    else document.body.style.overflowY = 'auto';

    setModalShow(!modalShow);
  };

  return (
    <Page title={'Experiences'} scrollingDisabled={false}>
      {modalShow && (
        <div className={css.filtermodalcontainer}>
          <div className={css.overlay} onClick={() => onClickFilterBtn()}></div>
          <ExperienceFilter className={css.experiencefilter} />
        </div>
      )}
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <div className={css.header}>
              <div className={css.title}>Gather Together</div>
              On-site, outside, or in-office, the most distinctive Carribean experiences
            </div>
            <div className={css.sectionbody}>
              <div className={css.sectionfiltercontainer}>
                <div className={css.sectionfiltercontet}>
                  <div className={css.desktopfilter}>
                    <div className={css.sectionfilter}>
                      <div
                        className={
                          activeFilterItem == 'in-person' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('in-person')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="17"
                          viewBox="0 0 10 17"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_56_4805)">
                            <path
                              d="M3.50011 2C3.50011 1.60218 3.65815 1.22064 3.93945 0.93934C4.22076 0.658035 4.60229 0.5 5.00011 0.5C5.39794 0.5 5.77947 0.658035 6.06077 0.93934C6.34208 1.22064 6.50011 1.60218 6.50011 2C6.50011 2.39782 6.34208 2.77936 6.06077 3.06066C5.77947 3.34196 5.39794 3.5 5.00011 3.5C4.60229 3.5 4.22076 3.34196 3.93945 3.06066C3.65815 2.77936 3.50011 2.39782 3.50011 2ZM4.75011 11.5V15.5C4.75011 16.0531 4.30324 16.5 3.75011 16.5C3.19699 16.5 2.75011 16.0531 2.75011 15.5V8.52812L1.85636 10.0156C1.57199 10.4875 0.95636 10.6406 0.484485 10.3562C0.01261 10.0719 -0.140515 9.45625 0.14386 8.98438L1.96574 5.95312C2.50949 5.05 3.48449 4.49688 4.53761 4.49688H5.46574C6.51886 4.49688 7.49386 5.05 8.03761 5.95312L9.85949 8.98438C10.1439 9.45625 9.99074 10.0719 9.51886 10.3562C9.04699 10.6406 8.43136 10.4875 8.14699 10.0156L7.25011 8.52812V15.5C7.25011 16.0531 6.80324 16.5 6.25011 16.5C5.69699 16.5 5.25011 16.0531 5.25011 15.5V11.5H4.75011Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_56_4805">
                              <rect
                                width="10"
                                height="16"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        In-person
                      </div>
                      <div
                        className={
                          activeFilterItem == 'venues' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('venues')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="17"
                          viewBox="0 0 20 17"
                          fill="none"
                        >
                          <path
                            d="M17.75 3.25C17.75 2.78587 17.5656 2.34075 17.2374 2.01256C16.9092 1.68437 16.4641 1.5 16 1.5C15.5359 1.5 15.0908 1.68437 14.7626 2.01256C14.4344 2.34075 14.25 2.78587 14.25 3.25C14.25 3.71413 14.4344 4.15925 14.7626 4.48744C15.0908 4.81563 15.5359 5 16 5C16.4641 5 16.9092 4.81563 17.2374 4.48744C17.5656 4.15925 17.75 3.71413 17.75 3.25ZM18 8.17812C18.3125 8.52812 18.5 8.99375 18.5 9.5C18.5 10.0063 18.3125 10.4719 18 10.8219V8.17812ZM13.4875 6.6375C14.4156 7.45937 15 8.6625 15 10C15 11.0719 14.625 12.0562 14 12.8281V13.5C14 14.0531 14.4469 14.5 15 14.5H17C17.5531 14.5 18 14.0531 18 13.5V12.6625C19.1812 12.1 20 10.8969 20 9.5C20 7.56563 18.4344 6 16.5 6H15.5C14.75 6 14.0563 6.23438 13.4875 6.63438V6.6375ZM6 13.5V12.8281C5.375 12.0562 5 11.0719 5 10C5 8.6625 5.58437 7.45937 6.5125 6.63438C5.94375 6.23438 5.25 6 4.5 6H3.5C1.56562 6 0 7.56563 0 9.5C0 10.8969 0.81875 12.1 2 12.6625V13.5C2 14.0531 2.44687 14.5 3 14.5H5C5.55313 14.5 6 14.0531 6 13.5ZM5.75 3.25C5.75 2.78587 5.56563 2.34075 5.23744 2.01256C4.90925 1.68437 4.46413 1.5 4 1.5C3.53587 1.5 3.09075 1.68437 2.76256 2.01256C2.43438 2.34075 2.25 2.78587 2.25 3.25C2.25 3.71413 2.43438 4.15925 2.76256 4.48744C3.09075 4.81563 3.53587 5 4 5C4.46413 5 4.90925 4.81563 5.23744 4.48744C5.56563 4.15925 5.75 3.71413 5.75 3.25ZM2 8.17812V10.825C1.6875 10.4719 1.5 10.0094 1.5 9.50313C1.5 8.99688 1.6875 8.53125 2 8.18125V8.17812ZM10 1.5C9.46957 1.5 8.96086 1.71071 8.58579 2.08579C8.21071 2.46086 8 2.96957 8 3.5C8 4.03043 8.21071 4.53914 8.58579 4.91421C8.96086 5.28929 9.46957 5.5 10 5.5C10.5304 5.5 11.0391 5.28929 11.4142 4.91421C11.7893 4.53914 12 4.03043 12 3.5C12 2.96957 11.7893 2.46086 11.4142 2.08579C11.0391 1.71071 10.5304 1.5 10 1.5ZM12.5 10C12.5 10.5063 12.3125 10.9688 12 11.3219V8.67813C12.3125 9.03125 12.5 9.49375 12.5 10ZM8 8.67813V11.325C7.6875 10.9719 7.5 10.5094 7.5 10.0031C7.5 9.49688 7.6875 9.03125 8 8.68125V8.67813ZM6 10C6 11.3969 6.81875 12.6 8 13.1625V14.5C8 15.0531 8.44687 15.5 9 15.5H11C11.5531 15.5 12 15.0531 12 14.5V13.1625C13.1813 12.6 14 11.3969 14 10C14 8.06563 12.4344 6.5 10.5 6.5H9.5C7.56563 6.5 6 8.06563 6 10Z"
                            fill="#06C167"
                          />
                        </svg>
                        Venues
                      </div>
                      <div
                        className={
                          activeFilterItem == 'retreats' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('retreats')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_56_4809)">
                            <path
                              d="M9.60938 0C8.7041 0 7.96875 0.735352 7.96875 1.64062V13.3594C7.96875 14.2646 8.7041 15 9.60938 15C10.4561 15 11.1533 14.3584 11.2412 13.5322C11.3936 13.5732 11.5547 13.5938 11.7188 13.5938C12.7529 13.5938 13.5938 12.7529 13.5938 11.7188C13.5938 11.502 13.5557 11.291 13.4883 11.0977C14.373 10.7637 15 9.9082 15 8.90625C15 7.97168 14.4521 7.16309 13.6582 6.78809C13.9131 6.46875 14.0625 6.06445 14.0625 5.625C14.0625 4.72559 13.4297 3.97559 12.5859 3.79102C12.6328 3.62988 12.6562 3.45703 12.6562 3.28125C12.6562 2.40527 12.0527 1.66699 11.2412 1.46191C11.1533 0.641602 10.4561 0 9.60938 0ZM5.39062 0C4.54395 0 3.84961 0.641602 3.75879 1.46191C2.94434 1.66699 2.34375 2.40234 2.34375 3.28125C2.34375 3.45703 2.36719 3.62988 2.41406 3.79102C1.57031 3.97266 0.9375 4.72559 0.9375 5.625C0.9375 6.06445 1.08691 6.46875 1.3418 6.78809C0.547852 7.16309 0 7.97168 0 8.90625C0 9.9082 0.626953 10.7637 1.51172 11.0977C1.44434 11.291 1.40625 11.502 1.40625 11.7188C1.40625 12.7529 2.24707 13.5938 3.28125 13.5938C3.44531 13.5938 3.60645 13.5732 3.75879 13.5322C3.84668 14.3584 4.54395 15 5.39062 15C6.2959 15 7.03125 14.2646 7.03125 13.3594V1.64062C7.03125 0.735352 6.2959 0 5.39062 0Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_56_4809">
                              <rect
                                width="15"
                                height="15"
                                fill="white"
                                transform="matrix(-1 0 0 1 15 0)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Retreats
                      </div>
                      <div
                        className={
                          activeFilterItem == 'virtual' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('virtual')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="17"
                          height="13"
                          viewBox="0 0 17 13"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_56_4811)">
                            <path
                              d="M13.6 0.8125C14.5377 0.8125 15.3 1.54121 15.3 2.4375V8.9375H13.6V2.4375H3.4V8.9375H1.7V2.4375C1.7 1.54121 2.46234 0.8125 3.4 0.8125H13.6ZM16.49 9.75C16.7716 9.75 17 9.96836 17 10.2375C17 11.3141 16.0862 12.1875 14.96 12.1875H2.04C0.91375 12.1875 0 11.3141 0 10.2375C0 9.96836 0.228437 9.75 0.51 9.75H16.49Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_56_4811">
                              <rect
                                width="17"
                                height="13"
                                fill="white"
                                transform="matrix(-1 0 0 1 17 0)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Virtual
                      </div>
                    </div>
                    <div className={css.sectionfilterbtn} onClick={() => onClickFilterBtn()}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="15"
                        viewBox="0 0 14 15"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_56_4813)">
                          <path
                            d="M0 11.875C0 12.359 0.391016 12.75 0.875 12.75H2.3707C2.70703 13.5238 3.47813 14.0625 4.375 14.0625C5.27187 14.0625 6.04297 13.5238 6.3793 12.75H13.125C13.609 12.75 14 12.359 14 11.875C14 11.391 13.609 11 13.125 11H6.3793C6.04297 10.2262 5.27187 9.6875 4.375 9.6875C3.47813 9.6875 2.70703 10.2262 2.3707 11H0.875C0.391016 11 0 11.391 0 11.875ZM3.5 11.875C3.5 11.6429 3.59219 11.4204 3.75628 11.2563C3.92038 11.0922 4.14294 11 4.375 11C4.60706 11 4.82962 11.0922 4.99372 11.2563C5.15781 11.4204 5.25 11.6429 5.25 11.875C5.25 12.1071 5.15781 12.3296 4.99372 12.4937C4.82962 12.6578 4.60706 12.75 4.375 12.75C4.14294 12.75 3.92038 12.6578 3.75628 12.4937C3.59219 12.3296 3.5 12.1071 3.5 11.875ZM8.75 7.5C8.75 7.26794 8.84219 7.04538 9.00628 6.88128C9.17038 6.71719 9.39294 6.625 9.625 6.625C9.85706 6.625 10.0796 6.71719 10.2437 6.88128C10.4078 7.04538 10.5 7.26794 10.5 7.5C10.5 7.73206 10.4078 7.95462 10.2437 8.11872C10.0796 8.28281 9.85706 8.375 9.625 8.375C9.39294 8.375 9.17038 8.28281 9.00628 8.11872C8.84219 7.95462 8.75 7.73206 8.75 7.5ZM9.625 5.3125C8.72812 5.3125 7.95703 5.85117 7.6207 6.625H0.875C0.391016 6.625 0 7.01602 0 7.5C0 7.98398 0.391016 8.375 0.875 8.375H7.6207C7.95703 9.14883 8.72812 9.6875 9.625 9.6875C10.5219 9.6875 11.293 9.14883 11.6293 8.375H13.125C13.609 8.375 14 7.98398 14 7.5C14 7.01602 13.609 6.625 13.125 6.625H11.6293C11.293 5.85117 10.5219 5.3125 9.625 5.3125ZM5.25 4C5.01794 4 4.79538 3.90781 4.63128 3.74372C4.46719 3.57962 4.375 3.35706 4.375 3.125C4.375 2.89294 4.46719 2.67038 4.63128 2.50628C4.79538 2.34219 5.01794 2.25 5.25 2.25C5.48206 2.25 5.70462 2.34219 5.86872 2.50628C6.03281 2.67038 6.125 2.89294 6.125 3.125C6.125 3.35706 6.03281 3.57962 5.86872 3.74372C5.70462 3.90781 5.48206 4 5.25 4ZM7.2543 2.25C6.91797 1.47617 6.14687 0.9375 5.25 0.9375C4.35313 0.9375 3.58203 1.47617 3.2457 2.25H0.875C0.391016 2.25 0 2.64102 0 3.125C0 3.60898 0.391016 4 0.875 4H3.2457C3.58203 4.77383 4.35313 5.3125 5.25 5.3125C6.14687 5.3125 6.91797 4.77383 7.2543 4H13.125C13.609 4 14 3.60898 14 3.125C14 2.64102 13.609 2.25 13.125 2.25H7.2543Z"
                            fill="#06C167"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_56_4813">
                            <rect
                              width="14"
                              height="14"
                              fill="white"
                              transform="translate(0 0.5)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                      Filter
                    </div>
                  </div>
                  <div className={css.mobilefilter}>
                    <div className={css.sectionfilter}>
                      <div
                        className={
                          activeFilterItem == 'location' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('location')}
                      >
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
                              <rect
                                width="11"
                                height="14"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Location
                      </div>
                      <div
                        className={
                          activeFilterItem == 'groupsize' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('groupsize')}
                      >
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
                      <div
                        className={
                          activeFilterItem == 'budget' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('budget')}
                      >
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
                      <div
                        className={
                          activeFilterItem == 'exptype' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('exptype')}
                      >
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
                      <div
                        className={
                          activeFilterItem == 'category' ? css.filteritemactive : css.filteritem
                        }
                        onClick={() => onClickFilterItem('category')}
                      >
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
                  </div>
                </div>
                <div className={css.totalcount}>63 experiences</div>
              </div>

              <div className={css.sectioncontent}>
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
                      <div className={css.scheduleaction}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="19"
                          viewBox="0 0 18 19"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_79_2259)">
                            <path
                              d="M12.2027 1.3649C12.4734 0.710998 13.1871 0.362951 13.8691 0.549279L16.9629 1.39303C17.5746 1.56178 18 2.11725 18 2.75006C18 11.4477 10.9477 18.5001 2.25 18.5001C1.61719 18.5001 1.06172 18.0747 0.892968 17.463L0.049218 14.3692C-0.13711 13.6872 0.210937 12.9735 0.864843 12.7028L4.23984 11.2965C4.81289 11.0575 5.47734 11.2227 5.86758 11.7044L7.28789 13.4376C9.76289 12.2669 11.7668 10.263 12.9375 7.78795L11.2043 6.37115C10.7227 5.9774 10.5574 5.31647 10.7965 4.74342L12.2027 1.36842V1.3649Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_79_2259">
                              <rect
                                width="18"
                                height="18"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Schedule a call
                      </div>
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
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

ExperiencesComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const Experiences = compose(connect(mapStateToProps))(ExperiencesComponent);

export default Experiences;
