import React from 'react';
import { Page, LayoutSingleColumn } from '../../components';
import NamedLink from '../../components/NamedLink/NamedLink';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import Slider from 'react-slick';
import css from './ListingDetailPage.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <svg
      width="47"
      height="47"
      viewBox="0 0 47 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{
        position: 'absolute',
        zIndex: 99,
        top: '45%',
        right: 0,
      }}
    >
      <g filter="url(#filter0_b_430_2987)">
        <circle cx="23.5" cy="23.5" r="23.5" fill="#F6FCFC" fill-opacity="0.6" />
        <path
          d="M28.7066 23.2937C29.0973 23.6843 29.0973 24.3187 28.7066 24.7093L22.7066 30.7093C22.316 31.0999 21.6816 31.0999 21.291 30.7093C20.9004 30.3187 20.9004 29.6843 21.291 29.2937L26.5848 23.9999L21.2941 18.7062C20.9035 18.3155 20.9035 17.6812 21.2941 17.2905C21.6848 16.8999 22.3191 16.8999 22.7098 17.2905L28.7098 23.2905L28.7066 23.2937Z"
          fill="black"
        />
      </g>
      <defs>
        <filter
          id="filter0_b_430_2987"
          x="-10"
          y="-10"
          width="67"
          height="67"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_430_2987" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_backgroundBlur_430_2987"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <svg
      width="47"
      height="47"
      viewBox="0 0 47 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{
        position: 'absolute',
        zIndex: 99,
        top: '45%',
      }}
    >
      <g filter="url(#filter0_b_430_2983)">
        <circle
          cx="23.5"
          cy="23.5"
          r="23.5"
          transform="matrix(-1 0 0 1 47 0)"
          fill="#F6FCFC"
          fill-opacity="0.6"
        />
        <path
          d="M18.2934 23.2937C17.9027 23.6843 17.9027 24.3187 18.2934 24.7093L24.2934 30.7093C24.684 31.0999 25.3184 31.0999 25.709 30.7093C26.0996 30.3187 26.0996 29.6843 25.709 29.2937L20.4152 23.9999L25.7059 18.7062C26.0965 18.3155 26.0965 17.6812 25.7059 17.2905C25.3152 16.8999 24.6809 16.8999 24.2902 17.2905L18.2902 23.2905L18.2934 23.2937Z"
          fill="black"
        />
      </g>
      <defs>
        <filter
          id="filter0_b_430_2983"
          x="-10"
          y="-10"
          width="67"
          height="67"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_430_2983" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_backgroundBlur_430_2983"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

export const ListingDetailPage = props => {
  const slickSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
    ],
  };
  return (
    <Page title={'Listing Detail'} scrollingDisabled={false}>
      <LayoutSingleColumn footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.header}>
            <NamedLink name="LandingPage">
              <div className={css.logo}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="111"
                  height="39"
                  viewBox="0 0 111 39"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 31.2281H6.43505V24.793H6.85171C7.68503 29.3763 10.7405 31.691 16.1108 31.691C23.3329 31.691 27.268 26.9689 27.268 19.6543C27.268 12.247 23.3792 7.57117 16.4349 7.57117C10.9257 7.57117 8.10169 10.4569 7.31467 14.3457H6.9443V0.210205H0V31.2281ZM13.7034 25.3486C9.30537 25.3486 6.9443 23.8208 6.9443 19.7931V19.4228C6.9443 15.3951 9.25907 13.9136 13.7497 13.9136C18.1941 13.9136 20.2311 15.3951 20.2311 19.6543C20.2311 23.8671 18.1941 25.3486 13.7034 25.3486ZM28.5488 19.7005C28.5488 27.9411 33.8265 31.7373 41.5578 31.7373C48.9188 31.7373 53.8261 28.2189 53.8261 23.1727V22.6634H46.8818V23.1264C46.8818 25.1171 45.4466 26.1819 41.3264 26.1819C36.8357 26.1819 35.1691 24.6541 34.9839 21.0894H53.8724C53.887 20.9652 53.9016 20.8457 53.9158 20.7292L53.9158 20.7291C53.9919 20.1067 54.0576 19.569 54.0576 18.8672C54.0576 11.5988 49.0114 7.61743 41.4189 7.61743C33.7802 7.61743 28.5488 12.2933 28.5488 19.7005ZM35.0765 17.432C35.4005 14.4228 37.1598 13.034 41.2801 13.034C45.354 13.034 47.2059 14.3766 47.391 17.432H35.0765ZM71.3768 30.9659H62.8122L52.2568 7.77197H59.9882L66.9325 24.2068H67.3954L74.386 7.77197H81.9784L71.3768 30.9659ZM85.6841 38.7899H89.3196C94.9059 38.7899 97.8764 37.4493 100.005 32.5955L111 7.77198H103.596L99.3838 18.3116L97.6104 23.8125H97.167L95.3049 18.3578L90.6053 7.77198H83.0682L93.9305 31.0238C93.4871 32.0408 92.7778 32.5031 91.1374 32.5031H85.6841V38.7899Z"
                    fill="#111111"
                  />
                </svg>
              </div>
            </NamedLink>
            <div className={css.headeraction}>
              <div className={css.actionitem}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="16"
                  viewBox="0 0 18 16"
                  fill="none"
                >
                  <path
                    d="M7.93828 15.4601L7.85039 15.3792L1.69102 9.6593C0.611719 8.65735 0 7.25109 0 5.77805V5.66203C0 3.18703 1.75781 1.06359 4.19062 0.599531C5.57578 0.332344 6.99258 0.652266 8.12109 1.4468C8.4375 1.6718 8.73281 1.93195 9 2.23078C9.14766 2.06203 9.30586 1.90734 9.47461 1.7632C9.60469 1.6507 9.73828 1.54523 9.87891 1.4468C11.0074 0.652266 12.4242 0.332344 13.8094 0.596016C16.2422 1.06008 18 3.18703 18 5.66203V5.77805C18 7.25109 17.3883 8.65735 16.309 9.6593L10.1496 15.3792L10.0617 15.4601C9.77344 15.7273 9.39375 15.8784 9 15.8784C8.60625 15.8784 8.22656 15.7308 7.93828 15.4601ZM8.40586 4.09758C8.3918 4.08703 8.38125 4.07297 8.3707 4.05891L7.74492 3.35578L7.74141 3.35227C6.9293 2.44172 5.70234 2.02688 4.50703 2.25539C2.86875 2.56828 1.6875 3.99563 1.6875 5.66203V5.77805C1.6875 6.78 2.10586 7.73977 2.84063 8.4218L9 14.1417L15.1594 8.4218C15.8941 7.73977 16.3125 6.78 16.3125 5.77805V5.66203C16.3125 3.99914 15.1312 2.56828 13.4965 2.25539C12.3012 2.02688 11.0707 2.44523 10.2621 3.35227C10.2621 3.35227 10.2621 3.35227 10.2586 3.35578C10.2551 3.3593 10.2586 3.35578 10.2551 3.3593L9.6293 4.06242C9.61875 4.07648 9.60469 4.08703 9.59414 4.10109C9.43594 4.2593 9.22148 4.34719 9 4.34719C8.77852 4.34719 8.56406 4.2593 8.40586 4.10109V4.09758Z"
                    fill="#1B242D"
                  />
                </svg>
              </div>
              <div className={css.actionitem}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                >
                  <path
                    d="M19.4398 10.4194C21.2937 12.2953 21.2937 15.3334 19.4398 17.2094C17.7992 18.8696 15.2136 19.0854 13.3268 17.7207L13.2743 17.6842C12.8018 17.3422 12.6936 16.6781 13.0315 16.2033C13.3695 15.7285 14.0257 15.6156 14.495 15.9576L14.5475 15.9942C15.6007 16.7545 17.0412 16.635 17.9534 15.7086C18.987 14.6627 18.987 12.9694 17.9534 11.9235L14.2718 8.19143C13.2382 7.14553 11.5648 7.14553 10.5312 8.19143C9.61574 9.1178 9.49762 10.5754 10.249 11.6379L10.2851 11.691C10.6231 12.1692 10.5115 12.8332 10.0423 13.1719C9.57309 13.5106 8.91356 13.401 8.57887 12.9262L8.54277 12.8731C7.1909 10.9672 7.40418 8.3508 9.04481 6.69065C10.8987 4.81467 13.9011 4.81467 15.755 6.69065L19.4398 10.4194ZM2.39043 11.1963C0.536523 9.32034 0.536523 6.28225 2.39043 4.40627C4.03105 2.74612 6.61668 2.5303 8.5034 3.89495L8.5559 3.93147C9.0284 4.27346 9.13668 4.93752 8.79871 5.41233C8.46074 5.88713 7.80449 6.00002 7.33527 5.65803L7.28277 5.62151C6.22949 4.86116 4.78902 4.98069 3.87684 5.90705C2.84324 6.95627 2.84324 8.64963 3.87684 9.69553L7.5584 13.4242C8.59199 14.4701 10.2654 14.4701 11.299 13.4242C12.2145 12.4979 12.3326 11.0403 11.5812 9.97444L11.5451 9.92131C11.2071 9.44319 11.3187 8.77913 11.7879 8.44045C12.2571 8.10178 12.9167 8.21135 13.2514 8.68616L13.2875 8.73928C14.6393 10.6485 14.4261 13.2649 12.7854 14.925C10.9315 16.801 7.92918 16.801 6.07527 14.925L2.39043 11.1963Z"
                    fill="black"
                  />
                </svg>
              </div>
              <NamedLink name="ExperiencesPage">
                <div className={css.actionitem}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="21"
                    viewBox="0 0 19 21"
                    fill="none"
                  >
                    <path
                      d="M15.9448 6.24253C16.4656 5.72983 16.4656 4.89722 15.9448 4.38452C15.424 3.87183 14.5781 3.87183 14.0573 4.38452L9.66979 8.70757L5.27813 4.38862C4.75729 3.87593 3.91146 3.87593 3.39062 4.38862C2.86979 4.90132 2.86979 5.73394 3.39062 6.24663L7.78229 10.5656L3.39479 14.8886C2.87396 15.4013 2.87396 16.2339 3.39479 16.7466C3.91563 17.2593 4.76146 17.2593 5.28229 16.7466L9.66979 12.4236L14.0615 16.7425C14.5823 17.2552 15.4281 17.2552 15.949 16.7425C16.4698 16.2298 16.4698 15.3972 15.949 14.8845L11.5573 10.5656L15.9448 6.24253Z"
                      fill="black"
                    />
                  </svg>
                </div>
              </NamedLink>
            </div>
          </div>
          <div className={css.content}>
            <div className={css.contentheader}>
              <div className={css.contentheadertitle}>
                <div className={css.contentheadertitletext}>Fresh Pasta Making</div>x Il Fiorista
                NYC
              </div>
              <div className={css.contentheadertags}>
                <div className={css.tagitem}>NYC</div>
                <div className={css.tagitem}>Marco Team Favorite</div>
                <div className={css.tagitem}>Greatest Hits</div>
              </div>
            </div>
            <div className={css.sectionimages}>
              <Slider {...slickSettings}>
                <div>
                  <div className={css.imageitem1}></div>
                </div>
                <div>
                  <div className={css.imageitem2}></div>
                </div>
                <div>
                  <div className={css.imageitem3}></div>
                </div>
              </Slider>
            </div>
            <div className={css.sectiondetail}>
              <div className={css.leftdetail}>
                <div className={css.detailinfogroup}>
                  <div className={css.detailinforow}>
                    <div className={css.detailinfoitem}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="20"
                        viewBox="0 0 22 20"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_57_1622)">
                          <path
                            d="M21.9924 9.98047C21.9924 10.6836 21.4194 11.2344 20.7701 11.2344H19.5479L19.5747 17.4922C19.5747 17.5977 19.567 17.7031 19.5556 17.8086V18.4375C19.5556 19.3008 18.8719 20 18.0278 20H17.4167C17.3747 20 17.3326 20 17.2906 19.9961C17.2372 20 17.1837 20 17.1302 20H15.8889H14.9722C14.1281 20 13.4444 19.3008 13.4444 18.4375V17.5V15C13.4444 14.3086 12.8983 13.75 12.2222 13.75H9.77778C9.10174 13.75 8.55556 14.3086 8.55556 15V17.5V18.4375C8.55556 19.3008 7.87187 20 7.02778 20H6.11111H4.89271C4.83542 20 4.77812 19.9961 4.72083 19.9922C4.675 19.9961 4.62917 20 4.58333 20H3.97222C3.12812 20 2.44444 19.3008 2.44444 18.4375V14.0625C2.44444 14.0273 2.44444 13.9883 2.44826 13.9531V11.2344H1.22222C0.534722 11.2344 0 10.6875 0 9.98047C0 9.62891 0.114583 9.31641 0.381944 9.04297L10.175 0.3125C10.4424 0.0390625 10.7479 0 11.0153 0C11.2826 0 11.5882 0.078125 11.8174 0.273438L21.5722 9.04297C21.8778 9.31641 22.0306 9.62891 21.9924 9.98047Z"
                            fill="#06C167"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_57_1622">
                            <rect width="22" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.detailinfoitemtitle}>
                        Available in NYC
                        <div className={css.detailinfoitemsubtitle}>Offsite at host venue</div>
                      </div>
                    </div>
                    <div className={css.detailinfoitem}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="24"
                        viewBox="0 0 25 24"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_57_1642)">
                          <path
                            d="M22.6562 12C22.6562 14.5859 21.5862 17.0658 19.6816 18.8943C17.7769 20.7228 15.1936 21.75 12.5 21.75C9.80639 21.75 7.22311 20.7228 5.31845 18.8943C3.41378 17.0658 2.34375 14.5859 2.34375 12C2.34375 9.41414 3.41378 6.93419 5.31845 5.10571C7.22311 3.27723 9.80639 2.25 12.5 2.25C15.1936 2.25 17.7769 3.27723 19.6816 5.10571C21.5862 6.93419 22.6562 9.41414 22.6562 12ZM0 12C0 15.1826 1.31696 18.2348 3.66117 20.4853C6.00537 22.7357 9.18479 24 12.5 24C15.8152 24 18.9946 22.7357 21.3388 20.4853C23.683 18.2348 25 15.1826 25 12C25 8.8174 23.683 5.76516 21.3388 3.51472C18.9946 1.26428 15.8152 0 12.5 0C9.18479 0 6.00537 1.26428 3.66117 3.51472C1.31696 5.76516 0 8.8174 0 12ZM11.3281 5.625V12C11.3281 12.375 11.5234 12.7266 11.8506 12.9375L16.5381 15.9375C17.0752 16.2844 17.8027 16.1437 18.1641 15.6234C18.5254 15.1031 18.3789 14.4094 17.8369 14.0625L13.6719 11.4V5.625C13.6719 5.00156 13.1494 4.5 12.5 4.5C11.8506 4.5 11.3281 5.00156 11.3281 5.625Z"
                            fill="#06C167"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_57_1642">
                            <rect width="25" height="24" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.detailinfoitemtitle}>
                        1 hour
                        <div className={css.detailinfoitemsubtitle}>Duration</div>
                      </div>
                    </div>
                  </div>
                  <div className={css.detailinforow}>
                    <div className={css.detailinfoitem}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="20"
                        viewBox="0 0 25 20"
                        fill="none"
                      >
                        <path
                          d="M2.8125 3.4375C2.8125 2.85734 3.04297 2.30094 3.4532 1.8907C3.86344 1.48047 4.41984 1.25 5 1.25C5.58016 1.25 6.13656 1.48047 6.5468 1.8907C6.95703 2.30094 7.1875 2.85734 7.1875 3.4375C7.1875 4.01766 6.95703 4.57406 6.5468 4.9843C6.13656 5.39453 5.58016 5.625 5 5.625C4.41984 5.625 3.86344 5.39453 3.4532 4.9843C3.04297 4.57406 2.8125 4.01766 2.8125 3.4375ZM2.5 9.59766C2.10938 10.0352 1.875 10.6172 1.875 11.25C1.875 11.8828 2.10938 12.4648 2.5 12.9023V9.59766ZM8.14062 7.67188C6.98047 8.69922 6.25 10.2031 6.25 11.875C6.25 13.2148 6.71875 14.4453 7.5 15.4102V16.25C7.5 16.9414 6.94141 17.5 6.25 17.5H3.75C3.05859 17.5 2.5 16.9414 2.5 16.25V15.2031C1.02344 14.5 0 12.9961 0 11.25C0 8.83203 1.95703 6.875 4.375 6.875H5.625C6.5625 6.875 7.42969 7.16797 8.14062 7.66797V7.67188ZM17.5 16.25V15.4102C18.2812 14.4453 18.75 13.2148 18.75 11.875C18.75 10.2031 18.0195 8.69922 16.8594 7.66797C17.5703 7.16797 18.4375 6.875 19.375 6.875H20.625C23.043 6.875 25 8.83203 25 11.25C25 12.9961 23.9766 14.5 22.5 15.2031V16.25C22.5 16.9414 21.9414 17.5 21.25 17.5H18.75C18.0586 17.5 17.5 16.9414 17.5 16.25ZM17.8125 3.4375C17.8125 2.85734 18.043 2.30094 18.4532 1.8907C18.8634 1.48047 19.4198 1.25 20 1.25C20.5802 1.25 21.1366 1.48047 21.5468 1.8907C21.957 2.30094 22.1875 2.85734 22.1875 3.4375C22.1875 4.01766 21.957 4.57406 21.5468 4.9843C21.1366 5.39453 20.5802 5.625 20 5.625C19.4198 5.625 18.8634 5.39453 18.4532 4.9843C18.043 4.57406 17.8125 4.01766 17.8125 3.4375ZM22.5 9.59766V12.9062C22.8906 12.4648 23.125 11.8867 23.125 11.2539C23.125 10.6211 22.8906 10.0391 22.5 9.60156V9.59766ZM12.5 1.25C13.163 1.25 13.7989 1.51339 14.2678 1.98223C14.7366 2.45107 15 3.08696 15 3.75C15 4.41304 14.7366 5.04893 14.2678 5.51777C13.7989 5.98661 13.163 6.25 12.5 6.25C11.837 6.25 11.2011 5.98661 10.7322 5.51777C10.2634 5.04893 10 4.41304 10 3.75C10 3.08696 10.2634 2.45107 10.7322 1.98223C11.2011 1.51339 11.837 1.25 12.5 1.25ZM9.375 11.875C9.375 12.5078 9.60938 13.0859 10 13.5273V10.2227C9.60938 10.6641 9.375 11.2422 9.375 11.875ZM15 10.2227V13.5312C15.3906 13.0898 15.625 12.5117 15.625 11.8789C15.625 11.2461 15.3906 10.6641 15 10.2266V10.2227ZM17.5 11.875C17.5 13.6211 16.4766 15.125 15 15.8281V17.5C15 18.1914 14.4414 18.75 13.75 18.75H11.25C10.5586 18.75 10 18.1914 10 17.5V15.8281C8.52344 15.125 7.5 13.6211 7.5 11.875C7.5 9.45703 9.45703 7.5 11.875 7.5H13.125C15.543 7.5 17.5 9.45703 17.5 11.875Z"
                          fill="#06C167"
                        />
                      </svg>
                      <div className={css.detailinfoitemtitle}>
                        10 - 25
                        <div className={css.detailinfoitemsubtitle}>Group Size</div>
                      </div>
                    </div>
                    <div className={css.detailinfoitem}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="17"
                        height="22"
                        viewBox="0 0 17 22"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_57_1648)">
                          <path
                            d="M2.83333 0C1.27057 0 0 1.2332 0 2.75V19.25C0 20.7668 1.27057 22 2.83333 22H14.1667C15.7294 22 17 20.7668 17 19.25V2.75C17 1.2332 15.7294 0 14.1667 0H2.83333ZM4.25 2.75H12.75C13.5336 2.75 14.1667 3.36445 14.1667 4.125V5.5C14.1667 6.26055 13.5336 6.875 12.75 6.875H4.25C3.46641 6.875 2.83333 6.26055 2.83333 5.5V4.125C2.83333 3.36445 3.46641 2.75 4.25 2.75ZM5.66667 9.625C5.66667 9.98967 5.51741 10.3394 5.25173 10.5973C4.98606 10.8551 4.62572 11 4.25 11C3.87428 11 3.51394 10.8551 3.24827 10.5973C2.98259 10.3394 2.83333 9.98967 2.83333 9.625C2.83333 9.26033 2.98259 8.91059 3.24827 8.65273C3.51394 8.39487 3.87428 8.25 4.25 8.25C4.62572 8.25 4.98606 8.39487 5.25173 8.65273C5.51741 8.91059 5.66667 9.26033 5.66667 9.625ZM4.25 15.125C3.87428 15.125 3.51394 14.9801 3.24827 14.7223C2.98259 14.4644 2.83333 14.1147 2.83333 13.75C2.83333 13.3853 2.98259 13.0356 3.24827 12.7777C3.51394 12.5199 3.87428 12.375 4.25 12.375C4.62572 12.375 4.98606 12.5199 5.25173 12.7777C5.51741 13.0356 5.66667 13.3853 5.66667 13.75C5.66667 14.1147 5.51741 14.4644 5.25173 14.7223C4.98606 14.9801 4.62572 15.125 4.25 15.125ZM2.83333 17.875C2.83333 17.1145 3.46641 16.5 4.25 16.5H8.5C9.28359 16.5 9.91667 17.1145 9.91667 17.875C9.91667 18.6355 9.28359 19.25 8.5 19.25H4.25C3.46641 19.25 2.83333 18.6355 2.83333 17.875ZM8.5 11C8.12428 11 7.76394 10.8551 7.49827 10.5973C7.23259 10.3394 7.08333 9.98967 7.08333 9.625C7.08333 9.26033 7.23259 8.91059 7.49827 8.65273C7.76394 8.39487 8.12428 8.25 8.5 8.25C8.87572 8.25 9.23606 8.39487 9.50173 8.65273C9.76741 8.91059 9.91667 9.26033 9.91667 9.625C9.91667 9.98967 9.76741 10.3394 9.50173 10.5973C9.23606 10.8551 8.87572 11 8.5 11ZM9.91667 13.75C9.91667 14.1147 9.76741 14.4644 9.50173 14.7223C9.23606 14.9801 8.87572 15.125 8.5 15.125C8.12428 15.125 7.76394 14.9801 7.49827 14.7223C7.23259 14.4644 7.08333 14.1147 7.08333 13.75C7.08333 13.3853 7.23259 13.0356 7.49827 12.7777C7.76394 12.5199 8.12428 12.375 8.5 12.375C8.87572 12.375 9.23606 12.5199 9.50173 12.7777C9.76741 13.0356 9.91667 13.3853 9.91667 13.75ZM12.75 11C12.3743 11 12.0139 10.8551 11.7483 10.5973C11.4826 10.3394 11.3333 9.98967 11.3333 9.625C11.3333 9.26033 11.4826 8.91059 11.7483 8.65273C12.0139 8.39487 12.3743 8.25 12.75 8.25C13.1257 8.25 13.4861 8.39487 13.7517 8.65273C14.0174 8.91059 14.1667 9.26033 14.1667 9.625C14.1667 9.98967 14.0174 10.3394 13.7517 10.5973C13.4861 10.8551 13.1257 11 12.75 11ZM14.1667 13.75C14.1667 14.1147 14.0174 14.4644 13.7517 14.7223C13.4861 14.9801 13.1257 15.125 12.75 15.125C12.3743 15.125 12.0139 14.9801 11.7483 14.7223C11.4826 14.4644 11.3333 14.1147 11.3333 13.75C11.3333 13.3853 11.4826 13.0356 11.7483 12.7777C12.0139 12.5199 12.3743 12.375 12.75 12.375C13.1257 12.375 13.4861 12.5199 13.7517 12.7777C14.0174 13.0356 14.1667 13.3853 14.1667 13.75ZM12.75 19.25C12.3743 19.25 12.0139 19.1051 11.7483 18.8473C11.4826 18.5894 11.3333 18.2397 11.3333 17.875C11.3333 17.5103 11.4826 17.1606 11.7483 16.9027C12.0139 16.6449 12.3743 16.5 12.75 16.5C13.1257 16.5 13.4861 16.6449 13.7517 16.9027C14.0174 17.1606 14.1667 17.5103 14.1667 17.875C14.1667 18.2397 14.0174 18.5894 13.7517 18.8473C13.4861 19.1051 13.1257 19.25 12.75 19.25Z"
                            fill="#06C167"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_57_1648">
                            <rect width="17" height="22" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.detailinfoitemtitle}>
                        3 day
                        <div className={css.detailinfoitemsubtitle}>Lead time</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={css.leftsectionitem}>
                  <div className={css.sectiontitle}>What you'll do</div>
                  <div className={css.sectioncontenttext}>
                    Pasta makes everyone happy, right? We'll explore the art of making and forming
                    your choice of pasta. With a classic Il Fiorista nod to seasonal produce, we'll
                    make pasta filling from delicious and nutritious seasonal produce! You'll be
                    welcomed with an Il Fiorista Alpine spritz upon arrival. Then together you break
                    down the basics of pasta - flour, eggs, and water and build those ingredients
                    into delicious pasta dough. Enjoy the pasta you made with salad to accompany
                    your meal!
                  </div>
                </div>
                <div className={css.leftsectionitem}>
                  <div className={css.sectiontitle}>What you'll do</div>
                  <div className={css.sectionitemlist}>
                    <div className={css.sectionitemsm}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_81_2305)">
                          <path
                            d="M9 1.6875C10.9394 1.6875 12.7994 2.45792 14.1707 3.82928C15.5421 5.20064 16.3125 7.0606 16.3125 9C16.3125 10.9394 15.5421 12.7994 14.1707 14.1707C12.7994 15.5421 10.9394 16.3125 9 16.3125C7.0606 16.3125 5.20064 15.5421 3.82928 14.1707C2.45792 12.7994 1.6875 10.9394 1.6875 9C1.6875 7.0606 2.45792 5.20064 3.82928 3.82928C5.20064 2.45792 7.0606 1.6875 9 1.6875ZM9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18Z"
                            fill="#06C167"
                          />
                          <path
                            d="M12.9729 6.15571C13.3034 6.48267 13.3034 7.01704 12.9729 7.34751L8.47642 11.8475C8.14947 12.178 7.61509 12.178 7.28462 11.8475L5.03462 9.59751C4.70415 9.27056 4.70767 8.73618 5.03462 8.40572C5.36157 8.07525 5.89595 8.07525 6.22642 8.40572L7.87876 10.0581L11.7811 6.15571C12.1081 5.82525 12.6424 5.82876 12.9729 6.15571Z"
                            fill="#227667"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_81_2305">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.sectionitemsmtext}>Item</div>
                    </div>
                    <div className={css.sectionitemsm}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_81_2305)">
                          <path
                            d="M9 1.6875C10.9394 1.6875 12.7994 2.45792 14.1707 3.82928C15.5421 5.20064 16.3125 7.0606 16.3125 9C16.3125 10.9394 15.5421 12.7994 14.1707 14.1707C12.7994 15.5421 10.9394 16.3125 9 16.3125C7.0606 16.3125 5.20064 15.5421 3.82928 14.1707C2.45792 12.7994 1.6875 10.9394 1.6875 9C1.6875 7.0606 2.45792 5.20064 3.82928 3.82928C5.20064 2.45792 7.0606 1.6875 9 1.6875ZM9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18Z"
                            fill="#06C167"
                          />
                          <path
                            d="M12.9729 6.15571C13.3034 6.48267 13.3034 7.01704 12.9729 7.34751L8.47642 11.8475C8.14947 12.178 7.61509 12.178 7.28462 11.8475L5.03462 9.59751C4.70415 9.27056 4.70767 8.73618 5.03462 8.40572C5.36157 8.07525 5.89595 8.07525 6.22642 8.40572L7.87876 10.0581L11.7811 6.15571C12.1081 5.82525 12.6424 5.82876 12.9729 6.15571Z"
                            fill="#227667"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_81_2305">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.sectionitemsmtext}>Item</div>
                    </div>
                    <div className={css.sectionitemsm}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_81_2305)">
                          <path
                            d="M9 1.6875C10.9394 1.6875 12.7994 2.45792 14.1707 3.82928C15.5421 5.20064 16.3125 7.0606 16.3125 9C16.3125 10.9394 15.5421 12.7994 14.1707 14.1707C12.7994 15.5421 10.9394 16.3125 9 16.3125C7.0606 16.3125 5.20064 15.5421 3.82928 14.1707C2.45792 12.7994 1.6875 10.9394 1.6875 9C1.6875 7.0606 2.45792 5.20064 3.82928 3.82928C5.20064 2.45792 7.0606 1.6875 9 1.6875ZM9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18Z"
                            fill="#06C167"
                          />
                          <path
                            d="M12.9729 6.15571C13.3034 6.48267 13.3034 7.01704 12.9729 7.34751L8.47642 11.8475C8.14947 12.178 7.61509 12.178 7.28462 11.8475L5.03462 9.59751C4.70415 9.27056 4.70767 8.73618 5.03462 8.40572C5.36157 8.07525 5.89595 8.07525 6.22642 8.40572L7.87876 10.0581L11.7811 6.15571C12.1081 5.82525 12.6424 5.82876 12.9729 6.15571Z"
                            fill="#227667"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_81_2305">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.sectionitemsmtext}>Item</div>
                    </div>
                    <div className={css.sectionitemsm}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_81_2305)">
                          <path
                            d="M9 1.6875C10.9394 1.6875 12.7994 2.45792 14.1707 3.82928C15.5421 5.20064 16.3125 7.0606 16.3125 9C16.3125 10.9394 15.5421 12.7994 14.1707 14.1707C12.7994 15.5421 10.9394 16.3125 9 16.3125C7.0606 16.3125 5.20064 15.5421 3.82928 14.1707C2.45792 12.7994 1.6875 10.9394 1.6875 9C1.6875 7.0606 2.45792 5.20064 3.82928 3.82928C5.20064 2.45792 7.0606 1.6875 9 1.6875ZM9 18C11.3869 18 13.6761 17.0518 15.364 15.364C17.0518 13.6761 18 11.3869 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.3869 0 9 0C6.61305 0 4.32387 0.948212 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18Z"
                            fill="#06C167"
                          />
                          <path
                            d="M12.9729 6.15571C13.3034 6.48267 13.3034 7.01704 12.9729 7.34751L8.47642 11.8475C8.14947 12.178 7.61509 12.178 7.28462 11.8475L5.03462 9.59751C4.70415 9.27056 4.70767 8.73618 5.03462 8.40572C5.36157 8.07525 5.89595 8.07525 6.22642 8.40572L7.87876 10.0581L11.7811 6.15571C12.1081 5.82525 12.6424 5.82876 12.9729 6.15571Z"
                            fill="#227667"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_81_2305">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div className={css.sectionitemsmtext}>Item</div>
                    </div>
                  </div>
                </div>
                <div className={css.leftsectionitem}>
                  <div className={css.sectiontitle}>where you'll be</div>
                  <div className={css.sectionmap}></div>
                  <div className={css.mapdescription}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="25"
                      viewBox="0 0 18 25"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_57_1762)">
                        <path
                          d="M10.1109 23.9C12.5156 20.8906 18 13.5969 18 9.5C18 4.53125 13.9688 0.5 9 0.5C4.03125 0.5 0 4.53125 0 9.5C0 13.5969 5.48438 20.8906 7.88906 23.9C8.46562 24.6172 9.53438 24.6172 10.1109 23.9ZM9 6.5C9.79565 6.5 10.5587 6.81607 11.1213 7.37868C11.6839 7.94129 12 8.70435 12 9.5C12 10.2956 11.6839 11.0587 11.1213 11.6213C10.5587 12.1839 9.79565 12.5 9 12.5C8.20435 12.5 7.44129 12.1839 6.87868 11.6213C6.31607 11.0587 6 10.2956 6 9.5C6 8.70435 6.31607 7.94129 6.87868 7.37868C7.44129 6.81607 8.20435 6.5 9 6.5Z"
                          fill="#06C167"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_57_1762">
                          <rect width="18" height="24" fill="white" transform="translate(0 0.5)" />
                        </clipPath>
                      </defs>
                    </svg>
                    <div className={css.locationinfo}>
                      Available in NYC
                      <div className={css.locationinfosubtitle}>Lead time</div>
                    </div>
                  </div>
                </div>
                <div className={css.leftsectionitem}>
                  <div className={css.sectiontitle}>How it works</div>
                  <div className={css.sectionitemlist}>
                    <div className={css.sectionitemmd}>
                      <div className={css.itemno}>01</div>
                      <div className={css.itemmdcontent}>
                        <div className={css.itemmdcontenttitle}>Build a quote</div>
                        <div className={css.itemmdcontenttext}>
                          Choose options and estimate headcount to get an instant quote for your
                          team.
                        </div>
                      </div>
                    </div>
                    <div className={css.sectionitemmd}>
                      <div className={css.itemno}>02</div>
                      <div className={css.itemmdcontent}>
                        <div className={css.itemmdcontenttitle}>Book a time</div>
                        <div className={css.itemmdcontenttext}>
                          Choose your preferred date and time and reserve it in seconds with a
                          deposit.
                        </div>
                      </div>
                    </div>
                    <div className={css.sectionitemmd}>
                      <div className={css.itemno}>03</div>
                      <div className={css.itemmdcontent}>
                        <div className={css.itemmdcontenttitle}>Get ready</div>
                        <div className={css.itemmdcontenttext}>
                          Send invites, manage RSVP's, and pay based on final headcount with our
                          all-in-one platform.
                        </div>
                      </div>
                    </div>
                    <div className={css.sectionitemmd}>
                      <div className={css.itemno}>04</div>
                      <div className={css.itemmdcontent}>
                        <div className={css.itemmdcontenttitle}>Enjoy the show</div>
                        <div className={css.itemmdcontenttext}>
                          Share key info with a personalized landing page, and meet on location for
                          the big day.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={css.leftsectionitem}>
                  <div className={css.sectiontitle}>Meet your hosts</div>
                  <div className={css.hostcontent}>
                    <div className={css.hostitem}>
                      <div className={css.hostavatar1}></div>
                      <div className={css.hostdescription}>
                        <div className={css.hostname}>Chef Leenah Huong</div>
                        <div className={css.hosttext}>
                          Originally born and raised in Vietnam, Chef Leenah spent eight years in
                          the Philippines and five years in Thailand, where she honed her skills in
                          South East Asian Cuisines. Inspired by her mother who used to be the Head
                          Chef at the Embassies, Chef Leenah continued
                        </div>
                      </div>
                    </div>
                    <div className={css.hostitem}>
                      <div className={css.hostavatar2}></div>
                      <div className={css.hostdescription}>
                        <div className={css.hostname}>Chef Leenah Huong</div>
                        <div className={css.hosttext}>
                          Originally born and raised in Vietnam, Chef Leenah spent eight years in
                          the Philippines and five years in Thailand, where she honed her skills in
                          South East Asian Cuisines. Inspired by her mother who used to be the Head
                          Chef at the Embassies, Chef Leenah continued
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={css.leftsectionitem} style={{ paddingBottom: '70px' }}>
                  <div className={css.groupcount}>
                    <div className={css.groupcounttitle}>
                      How many people?
                      <div className={css.groupcountsubtitle}>Guestimates encouraged.</div>
                    </div>
                    <div className={css.groupcountcontent}>
                      <input className={css.groupcountinput} placeholder="16" />
                      <div className={css.groupcountcheck}>Check Availability</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={css.rightdetail}>
                <div className={css.sectionprice}>
                  <div className={css.priceleft}>
                    <div className={css.pricetext}>$223</div>
                    <div className={css.priceper}>per person</div>
                  </div>
                  <NamedLink name="BookingDatetimePage">
                    <div className={css.instantbooking}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="8"
                        height="11"
                        viewBox="0 0 8 11"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_57_1665)">
                          <path
                            d="M0 5.5L0.59375 0.601562C0.635417 0.257812 0.91875 0 1.25625 0H4.76875C5.08125 0 5.33333 0.259961 5.33333 0.582227C5.33333 0.650977 5.32083 0.721875 5.29792 0.786328L4.33333 3.4375H7.23542C7.65625 3.4375 8 3.78984 8 4.22598C8 4.38496 7.95417 4.53965 7.86667 4.6707L3.8625 10.7078C3.73958 10.8926 3.5375 11.0021 3.32292 11.0021H3.2625C2.93542 11.0021 2.66875 10.7271 2.66875 10.3898C2.66875 10.3404 2.675 10.291 2.6875 10.2416L3.66667 6.1875H0.666667C0.297917 6.1875 0 5.88027 0 5.5Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_57_1665">
                            <rect width="8" height="11" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <div style={{ textDecoration: 'none' }}>Instant Book</div>
                    </div>
                  </NamedLink>
                </div>
                <div className={css.sectiontotalcount}>
                  <div className={css.totalcounttitle}>
                    How many people?
                    <div className={css.totalcountsubtitle}>Guestimates encouraged.</div>
                  </div>
                  <input className={css.totalcountcontent} value="16" />
                  <div className={css.totalcountcheck}>Check Availability</div>
                </div>
                <div className={css.sectionquestion}>
                  <div className={css.questiontitle}>
                    Questions?
                    <div className={css.questionsubtitle}>Get expert help.</div>
                  </div>
                  <div className={css.questionbutton}>Ask a question</div>
                </div>
                <div className={css.sectionvideo}>
                  Activity presentation video
                  <div className={css.sectionvideocontent}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="70"
                      height="69"
                      viewBox="0 0 70 69"
                      fill="none"
                    >
                      <g filter="url(#filter0_b_62_1788)">
                        <rect
                          x="0.5"
                          width="69"
                          height="69"
                          rx="34.5"
                          fill="white"
                          fillOpacity="0.8"
                        />
                        <path
                          d="M30.8021 23.3623C30.0312 22.8952 29.0625 22.8798 28.276 23.3161C27.4896 23.7524 27 24.5737 27 25.4668V43.535C27 44.4282 27.4896 45.2495 28.276 45.6858C29.0625 46.1221 30.0312 46.1016 30.8021 45.6396L45.8021 36.6055C46.5469 36.1589 47 35.3633 47 34.5009C47 33.6386 46.5469 32.8481 45.8021 32.3964L30.8021 23.3623Z"
                          fill="#ED6759"
                        />
                      </g>
                      <defs>
                        <filter
                          id="filter0_b_62_1788"
                          x="-9.5"
                          y="-10"
                          width="89"
                          height="89"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feGaussianBlur in="BackgroundImageFix" stdDeviation="5" />
                          <feComposite
                            in2="SourceAlpha"
                            operator="in"
                            result="effect1_backgroundBlur_62_1788"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_backgroundBlur_62_1788"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ListingDetailPage;
