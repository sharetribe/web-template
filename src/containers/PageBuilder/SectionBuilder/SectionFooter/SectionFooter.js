import React from 'react';
import { arrayOf, bool, func, node, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import { LinkedLogo, NamedLink } from '../../../../components';

import Field from '../../Field';
import BlockBuilder from '../../BlockBuilder';

import SectionContainer from '../SectionContainer';
import css from './SectionFooter.module.css';

// The number of columns (numberOfColumns) affects styling

const GRID_CONFIG = [
  { contentCss: css.contentCol1, gridCss: css.gridCol1 },
  { contentCss: css.contentCol2, gridCss: css.gridCol2 },
  { contentCss: css.contentCol3, gridCss: css.gridCol3 },
  { contentCss: css.contentCol4, gridCss: css.gridCol4 },
];

const getIndex = numberOfColumns => numberOfColumns - 1;

const getContentCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.contentCss : GRID_CONFIG[0].contentCss;
};

const getGridCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.gridCss : GRID_CONFIG[0].gridCss;
};

// Section component that's able to show blocks in multiple different columns (defined by "numberOfColumns" prop)
const SectionFooter = props => {
  const {
    sectionId,
    className,
    rootClassName,
    numberOfColumns,
    socialMediaLinks,
    slogan,
    appearance,
    copyright,
    blocks,
    options,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };
  const linksWithBlockId = socialMediaLinks?.map(sml => {
    return {
      ...sml,
      blockId: sml.link.platform,
    };
  });

  const showSocialMediaLinks = socialMediaLinks?.length > 0;

  // use block builder instead of mapping blocks manually

  return (
    <div className={css.sectionbody}>
      <div className={css.sectioncontent}>
        <div className={css.sectioncontent1}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="86"
            height="30"
            viewBox="0 0 86 30"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 24.0319H4.98572V19.0462H5.30854C5.95417 22.5972 8.3215 24.3906 12.4822 24.3906C18.0777 24.3906 21.1266 20.732 21.1266 15.0648C21.1266 9.32582 18.1136 5.70309 12.7333 5.70309C8.46497 5.70309 6.27699 7.9389 5.66723 10.9519H5.38028V0H0V24.0319ZM10.6171 19.4766C7.20957 19.4766 5.38028 18.2929 5.38028 15.1724V14.8854C5.38028 11.7649 7.1737 10.6171 10.653 10.6171C14.0963 10.6171 15.6745 11.7649 15.6745 15.0648C15.6745 18.3288 14.0963 19.4766 10.6171 19.4766ZM22.1187 15.1005C22.1187 21.4851 26.2077 24.4263 32.1978 24.4263C37.9009 24.4263 41.7029 21.7003 41.7029 17.7906V17.3961H36.3227V17.7548C36.3227 19.2971 35.2107 20.1221 32.0184 20.1221C28.5392 20.1221 27.2479 18.9384 27.1044 16.1765H41.7388C41.75 16.0811 41.7613 15.9891 41.7722 15.8994L41.7724 15.8981L41.7725 15.8975V15.8975C41.8314 15.4152 41.8823 14.9987 41.8823 14.4549C41.8823 8.8235 37.9726 5.73881 32.0902 5.73881C26.1719 5.73881 22.1187 9.36153 22.1187 15.1005ZM27.1762 13.3429C27.4273 11.0115 28.7903 9.93542 31.9826 9.93542C35.139 9.93542 36.5737 10.9756 36.7172 13.3429H27.1762ZM55.3014 23.829H48.6657L40.4877 5.8589H46.4778L51.858 18.5922H52.2167L57.6329 5.8589H63.5153L55.3014 23.829ZM66.3862 29.8908H69.2029C73.531 29.8908 75.8325 28.8522 77.4813 25.0916L86.0002 5.8589H80.2637L77.0004 14.0247L75.6264 18.2867H75.2829L73.8402 14.0606L70.1991 5.8589H64.3595L72.7753 23.8739C72.4318 24.6618 71.8822 25.02 70.6113 25.02H66.3862V29.8908Z"
              fill="white"
            />
          </svg>
          <div className={css.sectioncontent1main}>
            <div className={css.sectioncontent1menu}>
              <div className={css.sectioncontent1leftmenu}>
                <div className={css.sectioncontent1menucontainer}>
                  <div className={css.sectionmenuitem}>In-person</div>
                  <div className={css.sectionmenuitem}>Venues</div>
                </div>
              </div>
              <div className={css.sectioncontent1rightmenu}>
                <div className={css.sectioncontent1menucontainer}>
                  <NamedLink name="BookingPage" className={css.sectionmenuitem}>
                    About us
                  </NamedLink>
                  <NamedLink name="BecomeHostPage" className={css.sectionmenuitem}>
                    Become a host
                  </NamedLink>
                  <NamedLink name="BlogPage" className={css.sectionmenuitem}>
                    Blog
                  </NamedLink>
                  <NamedLink name="BlogPage" className={css.sectionmenuitem}>
                    Career
                  </NamedLink>
                  <NamedLink name="HelpCenterPage" className={css.sectionmenuitem}>
                    Help
                  </NamedLink>
                </div>
              </div>
            </div>
            <div className={css.sectioncontent1contactus}>
              <div className={css.sectioncontent1contactustitle}>
                <div className={css.sectioncontent1contactustitle1}>Join our community</div>
                <div className={css.sectioncontent1contactustitle2}>
                  Get exclusive perks + fresh experiences.
                </div>
              </div>
              <div className={css.emailcontainer}>
                <input type="text" placeholder="Your email" className={css.emailedit} />
                <div className={css.emailenter}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="17"
                    viewBox="0 0 14 17"
                    fill="none"
                  >
                    <path
                      d="M13.7063 9.59531C14.0969 9.20469 14.0969 8.57031 13.7063 8.17969L8.70625 3.17969C8.31563 2.78906 7.68125 2.78906 7.29063 3.17969C6.9 3.57031 6.9 4.20469 7.29063 4.59531L10.5875 7.88906H1C0.446875 7.88906 0 8.33594 0 8.88906C0 9.44219 0.446875 9.88906 1 9.88906H10.5844L7.29375 13.1828C6.90313 13.5734 6.90313 14.2078 7.29375 14.5984C7.68438 14.9891 8.31875 14.9891 8.70938 14.5984L13.7094 9.59844L13.7063 9.59531Z"
                      fill="#1B242D"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={css.sectioncontent2}>
          <div className={css.sectioncontent2text}>Copyright All Rights Reserved</div>
          <div className={css.sectionsocial}>
            <div className={css.sectionsocialitemhover}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
              >
                <path
                  d="M10.9121 5.64394C8.08042 5.64394 5.79638 7.90316 5.79638 10.7041C5.79638 13.505 8.08042 15.7642 10.9121 15.7642C13.7438 15.7642 16.0278 13.505 16.0278 10.7041C16.0278 7.90316 13.7438 5.64394 10.9121 5.64394ZM10.9121 13.9938C9.0822 13.9938 7.58622 12.5185 7.58622 10.7041C7.58622 8.88964 9.07775 7.41432 10.9121 7.41432C12.7465 7.41432 14.238 8.88964 14.238 10.7041C14.238 12.5185 12.742 13.9938 10.9121 13.9938ZM17.4303 5.43695C17.4303 6.09314 16.896 6.61721 16.2371 6.61721C15.5737 6.61721 15.0439 6.08873 15.0439 5.43695C15.0439 4.78517 15.5782 4.2567 16.2371 4.2567C16.896 4.2567 17.4303 4.78517 17.4303 5.43695ZM20.8186 6.63482C20.7429 5.05381 20.3778 3.65336 19.2068 2.49952C18.0403 1.34569 16.6245 0.98457 15.0261 0.9053C13.3787 0.812817 8.44106 0.812817 6.7937 0.9053C5.19977 0.980166 3.78392 1.34129 2.61296 2.49512C1.442 3.64895 1.08136 5.04941 1.00122 6.63042C0.907717 8.25988 0.907717 13.1438 1.00122 14.7733C1.07691 16.3543 1.442 17.7548 2.61296 18.9086C3.78392 20.0624 5.19531 20.4236 6.7937 20.5028C8.44106 20.5953 13.3787 20.5953 15.0261 20.5028C16.6245 20.428 18.0403 20.0668 19.2068 18.9086C20.3733 17.7548 20.7384 16.3543 20.8186 14.7733C20.912 13.1438 20.912 8.26428 20.8186 6.63482ZM18.6903 16.5217C18.3431 17.3848 17.6708 18.0498 16.7936 18.3977C15.4802 18.913 12.3636 18.7941 10.9121 18.7941C9.46065 18.7941 6.33956 18.9086 5.03058 18.3977C4.15792 18.0542 3.48562 17.3892 3.13388 16.5217C2.61296 15.2225 2.73317 12.1397 2.73317 10.7041C2.73317 9.26838 2.61741 6.18122 3.13388 4.88646C3.48117 4.02329 4.15347 3.35829 5.03058 3.01038C6.34401 2.49512 9.46065 2.61403 10.9121 2.61403C12.3636 2.61403 15.4847 2.49952 16.7936 3.01038C17.6663 3.35389 18.3386 4.01888 18.6903 4.88646C19.2113 6.18562 19.091 9.26838 19.091 10.7041C19.091 12.1397 19.2113 15.2269 18.6903 16.5217Z"
                  fill="#06C167"
                />
              </svg>
            </div>
            <div className={css.sectionsocialitem}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
              >
                <g clipPath="url(#clip0_589_2531)">
                  <path
                    d="M20.3372 10.7045C20.3372 5.3673 16.0128 1.04297 10.6756 1.04297C5.33837 1.04297 1.01404 5.3673 1.01404 10.7045C1.01404 15.5267 4.54713 19.5238 9.16598 20.2492V13.4974H6.71163V10.7045H9.16598V8.57587C9.16598 6.15464 10.6074 4.81721 12.8152 4.81721C13.8725 4.81721 14.9781 5.00577 14.9781 5.00577V7.3822H13.7595C12.5596 7.3822 12.1852 8.12708 12.1852 8.89104V10.7045H14.8647L14.4362 13.4974H12.1852V20.2492C16.8041 19.5238 20.3372 15.5267 20.3372 10.7045Z"
                    fill="#EAF6F6"
                    fillOpacity="0.5"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_589_2531">
                    <rect
                      width="19.9465"
                      height="19.9465"
                      fill="white"
                      transform="translate(0.702515 0.730469)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className={css.sectionsocialitem}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="22"
                viewBox="0 0 19 22"
                fill="none"
              >
                <g clipPath="url(#clip0_589_2534)">
                  <path
                    d="M17.3737 1.59766H1.75935C1.04387 1.59766 0.462555 2.18711 0.462555 2.91071V18.4966C0.462555 19.2202 1.04387 19.8096 1.75935 19.8096H17.3737C18.0891 19.8096 18.6745 19.2202 18.6745 18.4966V2.91071C18.6745 2.18711 18.0891 1.59766 17.3737 1.59766ZM5.9668 17.2079H3.26752V8.51658H5.97087V17.2079H5.9668ZM4.61716 7.32955C3.75128 7.32955 3.05207 6.62628 3.05207 5.76446C3.05207 4.90264 3.75128 4.19937 4.61716 4.19937C5.47898 4.19937 6.18225 4.90264 6.18225 5.76446C6.18225 6.63034 5.48304 7.32955 4.61716 7.32955ZM16.085 17.2079H13.3857V12.9801C13.3857 11.972 13.3654 10.6752 11.9833 10.6752C10.5767 10.6752 10.3613 11.7728 10.3613 12.907V17.2079H7.66198V8.51658H10.2515V9.70361H10.2881C10.6499 9.02066 11.532 8.30113 12.8451 8.30113C15.5769 8.30113 16.085 10.102 16.085 12.4435V17.2079Z"
                    fill="#EAF6F6"
                    fillOpacity="0.5"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_589_2534">
                    <rect
                      width="18.212"
                      height="20.8137"
                      fill="white"
                      transform="translate(0.462585 0.296875)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className={css.sectionsocialitem}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
              >
                <g clipPath="url(#clip0_589_2537)">
                  <path
                    d="M19.1625 6.4629C19.1757 6.64779 19.1757 6.83271 19.1757 7.01759C19.1757 12.6568 14.8836 19.1545 7.03884 19.1545C4.62201 19.1545 2.3769 18.4545 0.488342 17.2396C0.831727 17.2791 1.16186 17.2924 1.51846 17.2924C3.51263 17.2924 5.34838 16.6188 6.81432 15.4699C4.93898 15.4302 3.36738 14.202 2.8259 12.5116C3.09005 12.5511 3.35417 12.5776 3.63153 12.5776C4.01451 12.5776 4.39754 12.5247 4.75409 12.4323C2.79952 12.0361 1.33353 10.3192 1.33353 8.24581V8.193C1.9014 8.50996 2.56178 8.70806 3.26168 8.73444C2.1127 7.96844 1.35996 6.661 1.35996 5.18184C1.35996 4.38946 1.57122 3.66309 1.94103 3.02917C4.0409 5.61767 7.1973 7.30809 10.7366 7.49302C10.6706 7.17606 10.631 6.84592 10.631 6.51575C10.631 4.16494 12.5328 2.25 14.8967 2.25C16.125 2.25 17.2343 2.76506 18.0135 3.59708C18.9776 3.41219 19.902 3.0556 20.7209 2.56696C20.4039 3.55748 19.7304 4.3895 18.8455 4.91773C19.704 4.82533 20.536 4.58756 21.3019 4.25742C20.721 5.10261 19.9945 5.85536 19.1625 6.4629Z"
                    fill="#EAF6F6"
                    fillOpacity="0.5"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_589_2537">
                    <rect
                      width="20.8137"
                      height="20.8137"
                      fill="white"
                      transform="translate(0.488312 0.296875)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className={css.sectionsocialitem}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="21"
                viewBox="0 0 17 21"
                fill="none"
              >
                <g clipPath="url(#clip0_589_2540)">
                  <path
                    d="M15.0142 9.85347C13.5487 9.85725 12.1192 9.36503 10.9275 8.44635V14.8535C10.9271 16.0402 10.5904 17.1985 9.96224 18.1734C9.33413 19.1484 8.44461 19.8936 7.41263 20.3094C6.38066 20.7252 5.25541 20.7918 4.18736 20.5002C3.11931 20.2087 2.15935 19.5729 1.43586 18.6779C0.71237 17.7829 0.259824 16.6713 0.138735 15.4918C0.0176471 14.3123 0.233789 13.1211 0.758258 12.0775C1.28273 11.0339 2.09053 10.1876 3.07364 9.65177C4.05676 9.11595 5.16832 8.91616 6.25971 9.0791V12.3017C5.76029 12.1325 5.224 12.1376 4.72743 12.3163C4.23086 12.4949 3.7994 12.838 3.49467 13.2965C3.18993 13.755 3.02751 14.3055 3.03059 14.8693C3.03368 15.4332 3.20211 15.9816 3.51184 16.4362C3.82156 16.8908 4.25674 17.2284 4.75524 17.4007C5.25373 17.5731 5.79004 17.5714 6.28757 17.3958C6.78511 17.2203 7.21843 16.88 7.52566 16.4234C7.83288 15.9668 7.9983 15.4174 7.99829 14.8535V2.32812H10.9275C10.9255 2.59454 10.9462 2.8606 10.9895 3.12293C11.0912 3.70854 11.3029 4.26562 11.6114 4.76012C11.92 5.25461 12.319 5.67611 12.784 5.99884C13.4455 6.46995 14.2211 6.72105 15.0142 6.72087V9.85347Z"
                    fill="#EAF6F6"
                    fillOpacity="0.5"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_589_2540">
                    <rect
                      width="16.4775"
                      height="19.9465"
                      fill="white"
                      transform="translate(0.115723 0.730469)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

SectionFooter.defaultProps = {
  className: null,
  rootClassName: null,
  textClassName: null,
  numberOfColumns: 1,
  socialMediaLinks: [],
  slogan: null,
  copyright: null,
  appearance: null,
  blocks: [],
  options: null,
};

SectionFooter.propTypes = {
  sectionId: string.isRequired,
  className: string,
  rootClassName: string,
  numberOfColumns: number,
  socialMediaLinks: arrayOf(object),
  slogan: object,
  copyright: object,
  appearance: object,
  blocks: arrayOf(object),
  options: propTypeOption,
};

export default SectionFooter;
