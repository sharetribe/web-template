import React, { useState } from 'react';

import { Page, LayoutSingleColumn, NamedLink } from '../../components';
import FooterContainer from '../FooterContainer/FooterContainer';
import DateTimeModal from '../../components/DateTimeModal/DateTimeModal';

import css from './BookingDatetimePage.module.css';

export const BookingDatetimePage = props => {
  const [isTimeZoneDropdownOpened, setTimeZoneDropdownOpened] = useState(false);
  const [isGuestEditable, setGuestEditable] = useState(true);
  const [isDateModalOpened, setDateModalOpened] = useState(false);
  const [isDateRegistered, setDateRegistered] = useState(false);

  const onClickDateTime = () => {
    if (!isDateModalOpened) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    setDateModalOpened(!isDateModalOpened);
  };

  const onDateRegistered = () => {
    setDateRegistered(true);
    document.body.style.overflow = 'auto';
    setDateModalOpened(false);
  };

  return (
    <>
      {isDateModalOpened && (
        <div className={css.filtermodalcontainer}>
          <div className={css.overlay} onClick={() => onClickDateTime()}></div>
          <DateTimeModal onContinue={onDateRegistered} />
        </div>
      )}
      <Page title={'Booking Detail'} scrollingDisabled={false}>
        <LayoutSingleColumn footer={<FooterContainer />}>
          <div className={css.root}>
            <div className={css.header}>
              <NamedLink name="ListingDetailPage">
                <svg
                  width="47"
                  height="47"
                  viewBox="0 0 47 47"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_b_62_2112)">
                    <circle
                      cx="23.5"
                      cy="23.5"
                      r="23.5"
                      transform="matrix(-1 0 0 1 47 0)"
                      fill="white"
                    />
                    <path
                      d="M18.2934 23.2937C17.9027 23.6843 17.9027 24.3187 18.2934 24.7093L24.2934 30.7093C24.684 31.0999 25.3184 31.0999 25.709 30.7093C26.0996 30.3187 26.0996 29.6843 25.709 29.2937L20.4152 23.9999L25.7059 18.7062C26.0965 18.3155 26.0965 17.6812 25.7059 17.2905C25.3152 16.8999 24.6809 16.8999 24.2902 17.2905L18.2902 23.2905L18.2934 23.2937Z"
                      fill="black"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_b_62_2112"
                      x="-10"
                      y="-10"
                      width="67"
                      height="67"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
                      <feComposite
                        in2="SourceAlpha"
                        operator="in"
                        result="effect1_backgroundBlur_62_2112"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_backgroundBlur_62_2112"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </NamedLink>
              <div className={css.headertab}>
                <div className={css.datetime}>Date + Time</div>
                <div className={css.payment}>Payment</div>
              </div>
              <div className={css.headeraction}>
                <div className={css.gethelp}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_62_2194)">
                      <path
                        d="M4.21348 13.9154C5.38887 14.8484 6.87969 15.4062 8.5 15.4062C10.1203 15.4062 11.6111 14.8484 12.7865 13.9154L10.117 11.2459C9.64219 11.5248 9.0877 11.6875 8.49668 11.6875C7.90566 11.6875 7.35117 11.5281 6.87637 11.2459L4.20684 13.9154H4.21348ZM1.95234 13.9221C0.733789 12.4479 0 10.5619 0 8.5C0 6.43809 0.733789 4.55215 1.95234 3.07793L1.56055 2.68945C1.24844 2.37734 1.24844 1.87266 1.56055 1.56387C1.87266 1.25508 2.37734 1.25176 2.68613 1.56387L3.07793 1.95234C4.55215 0.733789 6.43809 0 8.5 0C10.5619 0 12.4479 0.733789 13.9221 1.95234L14.3105 1.56055C14.6227 1.24844 15.1273 1.24844 15.4361 1.56055C15.7449 1.87266 15.7482 2.37734 15.4361 2.68613L15.0477 3.07793C16.2662 4.55215 17 6.43809 17 8.5C17 10.5619 16.2662 12.4479 15.0477 13.9221L15.4395 14.3105C15.7516 14.6227 15.7516 15.1273 15.4395 15.4361C15.1273 15.7449 14.6227 15.7482 14.3139 15.4361L13.9221 15.0443C12.4479 16.2662 10.5619 17 8.5 17C6.43809 17 4.55215 16.2662 3.07793 15.0477L2.68945 15.4395C2.37734 15.7516 1.87266 15.7516 1.56387 15.4395C1.25508 15.1273 1.25176 14.6227 1.56387 14.3139L1.95566 13.9221H1.95234ZM3.08457 12.7898L5.7541 10.1203C5.47519 9.64551 5.3125 9.09102 5.3125 8.5C5.3125 7.90898 5.47187 7.35449 5.7541 6.87969L3.08457 4.21016C2.15156 5.38887 1.59375 6.87969 1.59375 8.5C1.59375 10.1203 2.15156 11.6111 3.08457 12.7865V12.7898ZM4.21348 3.08457L6.88301 5.7541C7.35781 5.4752 7.9123 5.3125 8.50332 5.3125C9.09434 5.3125 9.64883 5.47188 10.1236 5.7541L12.7865 3.08457C11.6111 2.15156 10.1203 1.59375 8.5 1.59375C6.87969 1.59375 5.38887 2.15156 4.21348 3.08457ZM11.2459 10.1203L13.9154 12.7865C14.8484 11.6111 15.4062 10.1203 15.4062 8.5C15.4062 6.87969 14.8484 5.38887 13.9154 4.21348L11.2459 6.88301C11.5248 7.35781 11.6875 7.9123 11.6875 8.50332C11.6875 9.09434 11.5281 9.64883 11.2459 10.1236V10.1203ZM10.0938 8.5C10.0938 8.07731 9.92584 7.67193 9.62695 7.37305C9.32807 7.07416 8.92269 6.90625 8.5 6.90625C8.07731 6.90625 7.67193 7.07416 7.37305 7.37305C7.07416 7.67193 6.90625 8.07731 6.90625 8.5C6.90625 8.92269 7.07416 9.32807 7.37305 9.62695C7.67193 9.92584 8.07731 10.0938 8.5 10.0938C8.92269 10.0938 9.32807 9.92584 9.62695 9.62695C9.92584 9.32807 10.0938 8.92269 10.0938 8.5Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_62_2194">
                        <rect
                          width="17"
                          height="17"
                          fill="white"
                          transform="matrix(-1 0 0 1 17 0)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                  Get help
                </div>
                <div className={css.sharequote}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="15"
                    viewBox="0 0 13 15"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_62_2182)">
                      <path
                        d="M7.1558 0.757324C6.79308 0.415527 6.20402 0.415527 5.84129 0.757324L2.12701 4.25732C1.76429 4.59912 1.76429 5.1542 2.12701 5.496C2.48973 5.83779 3.07879 5.83779 3.44152 5.496L5.57143 3.48896V9.25029C5.57143 9.73428 5.98638 10.1253 6.5 10.1253C7.01362 10.1253 7.42857 9.73428 7.42857 9.25029V3.48896L9.55848 5.496C9.9212 5.83779 10.5103 5.83779 10.873 5.496C11.2357 5.1542 11.2357 4.59912 10.873 4.25732L7.15871 0.757324H7.1558ZM1.85714 10.1253C1.85714 9.64131 1.44219 9.25029 0.928571 9.25029C0.414955 9.25029 0 9.64131 0 10.1253V11.8753C0 13.3245 1.24777 14.5003 2.78571 14.5003H10.2143C11.7522 14.5003 13 13.3245 13 11.8753V10.1253C13 9.64131 12.585 9.25029 12.0714 9.25029C11.5578 9.25029 11.1429 9.64131 11.1429 10.1253V11.8753C11.1429 12.3593 10.7279 12.7503 10.2143 12.7503H2.78571C2.2721 12.7503 1.85714 12.3593 1.85714 11.8753V10.1253Z"
                        fill="#06C167"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_62_2182">
                        <rect width="13" height="14" fill="white" transform="translate(0 0.5)" />
                      </clipPath>
                    </defs>
                  </svg>
                  Share quote
                </div>
              </div>
            </div>
            <div className={css.headermobile}>
              <NamedLink name="ListingDetailPage">
                <svg
                  width="47"
                  height="47"
                  viewBox="0 0 47 47"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_b_62_2112)">
                    <circle
                      cx="23.5"
                      cy="23.5"
                      r="23.5"
                      transform="matrix(-1 0 0 1 47 0)"
                      fill="white"
                    />
                    <path
                      d="M18.2934 23.2937C17.9027 23.6843 17.9027 24.3187 18.2934 24.7093L24.2934 30.7093C24.684 31.0999 25.3184 31.0999 25.709 30.7093C26.0996 30.3187 26.0996 29.6843 25.709 29.2937L20.4152 23.9999L25.7059 18.7062C26.0965 18.3155 26.0965 17.6812 25.7059 17.2905C25.3152 16.8999 24.6809 16.8999 24.2902 17.2905L18.2902 23.2905L18.2934 23.2937Z"
                      fill="black"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_b_62_2112"
                      x="-10"
                      y="-10"
                      width="67"
                      height="67"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
                      <feComposite
                        in2="SourceAlpha"
                        operator="in"
                        result="effect1_backgroundBlur_62_2112"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_backgroundBlur_62_2112"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </NamedLink>
              <svg
                width="201"
                height="5"
                viewBox="0 0 201 5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="100.5" height="5" rx="2.5" fill="#227667" />
                <rect
                  x="100.5"
                  width="100.5"
                  height="5"
                  rx="2.5"
                  fill="white"
                  fill-opacity="0.85"
                />
              </svg>
              <svg
                width="47"
                height="47"
                viewBox="0 0 47 47"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_b_1081_5847)">
                  <circle
                    cx="23.5"
                    cy="23.5"
                    r="23.5"
                    transform="matrix(-1 0 0 1 47 0)"
                    fill="white"
                  />
                  <g clip-path="url(#clip0_1081_5847)">
                    <path
                      d="M25.1558 16.2573C24.7931 15.9155 24.204 15.9155 23.8413 16.2573L20.127 19.7573C19.7643 20.0991 19.7643 20.6542 20.127 20.996C20.4897 21.3378 21.0788 21.3378 21.4415 20.996L23.5714 18.989V24.7503C23.5714 25.2343 23.9864 25.6253 24.5 25.6253C25.0136 25.6253 25.4286 25.2343 25.4286 24.7503V18.989L27.5585 20.996C27.9212 21.3378 28.5103 21.3378 28.873 20.996C29.2357 20.6542 29.2357 20.0991 28.873 19.7573L25.1587 16.2573H25.1558ZM19.8571 25.6253C19.8571 25.1413 19.4422 24.7503 18.9286 24.7503C18.415 24.7503 18 25.1413 18 25.6253V27.3753C18 28.8245 19.2478 30.0003 20.7857 30.0003H28.2143C29.7522 30.0003 31 28.8245 31 27.3753V25.6253C31 25.1413 30.585 24.7503 30.0714 24.7503C29.5578 24.7503 29.1429 25.1413 29.1429 25.6253V27.3753C29.1429 27.8593 28.7279 28.2503 28.2143 28.2503H20.7857C20.2721 28.2503 19.8571 27.8593 19.8571 27.3753V25.6253Z"
                      fill="#06C167"
                    />
                  </g>
                </g>
                <defs>
                  <filter
                    id="filter0_b_1081_5847"
                    x="-10"
                    y="-10"
                    width="67"
                    height="67"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
                    <feComposite
                      in2="SourceAlpha"
                      operator="in"
                      result="effect1_backgroundBlur_1081_5847"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_backgroundBlur_1081_5847"
                      result="shape"
                    />
                  </filter>
                  <clipPath id="clip0_1081_5847">
                    <rect width="13" height="14" fill="white" transform="translate(18 16)" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className={css.content}>
              <div className={css.leftcontent}>
                <div className={css.lefttitle}>
                  Choose a date
                  <div className={css.subtitle}>
                    We'll confirm availability with your host within 48 hours. You can change this
                    later.
                  </div>
                </div>
                <div className={css.leftform}>
                  <div
                    className={css.formitem}
                    onClick={() => {
                      setTimeZoneDropdownOpened(!isTimeZoneDropdownOpened);
                    }}
                  >
                    <div className={css.formitemtext}>Time Zone</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 19 19"
                      fill="none"
                    >
                      <path
                        d="M8.66216 15.0885C9.12603 15.5524 9.87935 15.5524 10.3432 15.0885L17.4682 7.96353C17.9321 7.49966 17.9321 6.74634 17.4682 6.28247C17.0043 5.8186 16.251 5.8186 15.7872 6.28247L9.50083 12.5688L3.2145 6.28618C2.75063 5.82231 1.99731 5.82231 1.53345 6.28618C1.06958 6.75005 1.06958 7.50337 1.53345 7.96724L8.65845 15.0922L8.66216 15.0885Z"
                        fill="#227667"
                      />
                    </svg>
                  </div>
                  {isTimeZoneDropdownOpened && (
                    <>
                      <div className={css.formitemsub}>
                        <div className={css.formitemtext}>Eastern Time</div>
                        <div className={css.bookingdetailtag}>GMT - 04:00</div>
                      </div>
                      <div className={css.formitemsub}>
                        <div className={css.formitemtext}>Pacific Time</div>
                        <div className={css.bookingdetailtag}>GMT - 07:00</div>
                      </div>
                      <div className={css.formitemsub}>
                        <div className={css.formitemtext}>Eastern Time</div>
                        <div className={css.bookingdetailtag}>GMT - 04:00</div>
                      </div>
                      <div className={css.formitemsub}>
                        <div className={css.formitemtext}>Mountain Time</div>
                        <div className={css.bookingdetailtag}>GMT - 06:00</div>
                      </div>
                      <div className={css.formitemsub}>
                        <div className={css.formitemtext}>Central Time</div>
                        <div className={css.bookingdetailtag}>GMT - 05:00</div>
                      </div>
                    </>
                  )}
                  {!isTimeZoneDropdownOpened && !isDateRegistered && (
                    <div className={css.formitem} onClick={onClickDateTime}>
                      <div className={css.formitemtext}>Choose Date</div>
                      <div className={css.formitemicon}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                        >
                          <path
                            d="M5.5 1.42308C5.5 0.9125 5.94688 0.5 6.5 0.5C7.05312 0.5 7.5 0.9125 7.5 1.42308V5.57692H12C12.5531 5.57692 13 5.98942 13 6.5C13 7.01058 12.5531 7.42308 12 7.42308H7.5V11.5769C7.5 12.0875 7.05312 12.5 6.5 12.5C5.94688 12.5 5.5 12.0875 5.5 11.5769V7.42308H1C0.446875 7.42308 0 7.01058 0 6.5C0 5.98942 0.446875 5.57692 1 5.57692H5.5V1.42308Z"
                            fill="#06C167"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  {!isTimeZoneDropdownOpened && isDateRegistered && (
                    <div className={css.registereddate}>
                      <div className={css.leftside}>
                        <div className={css.date}>Mon, Oct 23</div>
                        <div className={css.time}>5:30pm - 7:30pm</div>
                      </div>
                      <div className={css.rightside}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="16"
                          viewBox="0 0 15 16"
                          fill="none"
                        >
                          <path
                            d="M6.83813 12.4124C7.20435 12.7786 7.79907 12.7786 8.16528 12.4124L13.7903 6.78735C14.1565 6.42114 14.1565 5.82642 13.7903 5.46021C13.4241 5.09399 12.8293 5.09399 12.4631 5.46021L7.50024 10.4231L2.53735 5.46313C2.17114 5.09692 1.57642 5.09692 1.21021 5.46313C0.843994 5.82935 0.843994 6.42407 1.21021 6.79028L6.83521 12.4153L6.83813 12.4124Z"
                            fill="#06C167"
                          />
                        </svg>
                        Preferred
                      </div>
                    </div>
                  )}
                  <NamedLink className={css.continuebtn} name="BookingPaymentPage">
                    Continue
                  </NamedLink>
                </div>
              </div>
              <div className={css.rightcontent}>
                <div className={css.bookingdetail}>
                  <div className={css.bookingdetailcontent}>
                    <div className={css.bookingdetailtitle}>Authentic Asian Dumplings</div>
                    <div className={css.bookingdetailtags}>
                      <div className={css.bookingdetailtag}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_65_1551)">
                            <path
                              d="M10.9962 5.49023C10.9962 5.8418 10.7097 6.11719 10.3851 6.11719H9.77396L9.78733 9.24609C9.78733 9.29883 9.78351 9.35156 9.77778 9.4043V9.71875C9.77778 10.1504 9.43594 10.5 9.01389 10.5H8.70833C8.68733 10.5 8.66632 10.5 8.64531 10.498C8.61858 10.5 8.59184 10.5 8.5651 10.5H7.94444H7.48611C7.06406 10.5 6.72222 10.1504 6.72222 9.71875V9.25V8C6.72222 7.6543 6.44913 7.375 6.11111 7.375H4.88889C4.55087 7.375 4.27778 7.6543 4.27778 8V9.25V9.71875C4.27778 10.1504 3.93594 10.5 3.51389 10.5H3.05556H2.44635C2.41771 10.5 2.38906 10.498 2.36042 10.4961C2.3375 10.498 2.31458 10.5 2.29167 10.5H1.98611C1.56406 10.5 1.22222 10.1504 1.22222 9.71875V7.53125C1.22222 7.51367 1.22222 7.49414 1.22413 7.47656V6.11719H0.611111C0.267361 6.11719 0 5.84375 0 5.49023C0 5.31445 0.0572917 5.1582 0.190972 5.02148L5.0875 0.65625C5.22118 0.519531 5.37396 0.5 5.50764 0.5C5.64132 0.5 5.7941 0.539062 5.90868 0.636719L10.7861 5.02148C10.9389 5.1582 11.0153 5.31445 10.9962 5.49023Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_65_1551">
                              <rect
                                width="11"
                                height="10"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        Bahamas
                      </div>
                      <div className={css.bookingdetailtag}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_65_1555)">
                            <path
                              d="M11.7812 6.5C11.7812 7.79293 11.2248 9.03291 10.2344 9.94715C9.24398 10.8614 7.90067 11.375 6.5 11.375C5.09933 11.375 3.75602 10.8614 2.76559 9.94715C1.77517 9.03291 1.21875 7.79293 1.21875 6.5C1.21875 5.20707 1.77517 3.96709 2.76559 3.05285C3.75602 2.13861 5.09933 1.625 6.5 1.625C7.90067 1.625 9.24398 2.13861 10.2344 3.05285C11.2248 3.96709 11.7812 5.20707 11.7812 6.5ZM0 6.5C0 8.0913 0.68482 9.61742 1.90381 10.7426C3.12279 11.8679 4.77609 12.5 6.5 12.5C8.22391 12.5 9.87721 11.8679 11.0962 10.7426C12.3152 9.61742 13 8.0913 13 6.5C13 4.9087 12.3152 3.38258 11.0962 2.25736C9.87721 1.13214 8.22391 0.5 6.5 0.5C4.77609 0.5 3.12279 1.13214 1.90381 2.25736C0.68482 3.38258 0 4.9087 0 6.5ZM5.89062 3.3125V6.5C5.89062 6.6875 5.99219 6.86328 6.1623 6.96875L8.5998 8.46875C8.8791 8.64219 9.25742 8.57187 9.44531 8.31172C9.6332 8.05156 9.55703 7.70469 9.2752 7.53125L7.10938 6.2V3.3125C7.10938 3.00078 6.8377 2.75 6.5 2.75C6.1623 2.75 5.89062 3.00078 5.89062 3.3125Z"
                              fill="#06C167"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_65_1555">
                              <rect
                                width="13"
                                height="12"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        2 hours
                      </div>
                    </div>
                  </div>
                  <div className={css.bookingdetailimage}></div>
                </div>
                {isGuestEditable && (
                  <div className={css.bookingpersons}>
                    16 guests
                    <div
                      className={css.bookingpersonicon}
                      onClick={() => {
                        setGuestEditable(false);
                      }}
                    >
                      <svg
                        width="53"
                        height="53"
                        viewBox="0 0 53 53"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="53" height="53" rx="26.5" fill="#EAF6F6" />
                        <g clip-path="url(#clip0_65_776)">
                          <path
                            d="M33.2063 21.7939C33.5969 22.1846 33.5969 22.8189 33.2063 23.2096L25.2063 31.2096C24.8156 31.6002 24.1813 31.6002 23.7906 31.2096L19.7906 27.2096C19.4 26.8189 19.4 26.1846 19.7906 25.7939C20.1813 25.4033 20.8156 25.4033 21.2063 25.7939L24.5 29.0846L31.7938 21.7939C32.1844 21.4033 32.8188 21.4033 33.2094 21.7939H33.2063Z"
                            fill="black"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_65_776">
                            <rect
                              width="14"
                              height="16"
                              fill="white"
                              transform="translate(19.5 18.5)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                )}
                {!isGuestEditable && (
                  <div className={css.bookingpersons}>
                    <input className={css.guesteditbox} defaultValue={16} />
                    <div
                      className={css.bookingpersonicon}
                      onClick={() => {
                        setGuestEditable(true);
                      }}
                    >
                      <svg
                        width="53"
                        height="53"
                        viewBox="0 0 53 53"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="53" height="53" rx="26.5" fill="#1B242D" />
                        <g clip-path="url(#clip0_62_2273)">
                          <path
                            d="M33.2063 21.7939C33.5969 22.1846 33.5969 22.8189 33.2063 23.2096L25.2063 31.2096C24.8156 31.6002 24.1813 31.6002 23.7906 31.2096L19.7906 27.2096C19.4 26.8189 19.4 26.1846 19.7906 25.7939C20.1813 25.4033 20.8156 25.4033 21.2063 25.7939L24.5 29.0846L31.7938 21.7939C32.1844 21.4033 32.8188 21.4033 33.2094 21.7939H33.2063Z"
                            fill="#06C167"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_62_2273">
                            <rect
                              width="14"
                              height="16"
                              fill="white"
                              transform="translate(19.5 18.5)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                )}
                <div className={css.totalinvoice}>
                  <div className={css.invoiceitems}>
                    <div className={css.invoicetitle}>Total</div>
                    <div className={css.invoiceitem}>$89.00 x 16 guests</div>
                    <div className={css.invoiceitem}>3% payment processing fee</div>
                    <div className={css.invoiceitem}>
                      Taxes, host and service costs, and domestic shipping.
                    </div>
                  </div>
                  <div className={css.invoicevalues}>
                    <div className={css.invoicetitle}>$1,466.72</div>
                    <div className={css.invoiceitem}>$1,424.00</div>
                    <div className={css.invoiceitem}>$42.72</div>
                    <div className={css.invoiceitem}>Included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LayoutSingleColumn>
      </Page>
    </>
  );
};

export default BookingDatetimePage;
