import React, { useState } from 'react';
import css from './ExperienceFilter.module.css';

export const ExperienceFilter = props => {
  return (
    <>
      <div className={css.modalbody}>
        <div className={css.filtermodaltitle}>
          Filter
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="15"
            viewBox="0 0 14 15"
            fill="none"
          >
            <path
              d="M12.4906 3.4651C12.9464 2.98658 12.9464 2.20947 12.4906 1.73096C12.0349 1.25244 11.2948 1.25244 10.8391 1.73096L7.00001 5.7658L3.1573 1.73479C2.70157 1.25627 1.96147 1.25627 1.50574 1.73479C1.05001 2.2133 1.05001 2.99041 1.50574 3.46893L5.34845 7.49994L1.50938 11.5348C1.05365 12.0133 1.05365 12.7904 1.50938 13.2689C1.96511 13.7474 2.70522 13.7474 3.16095 13.2689L7.00001 9.23408L10.8427 13.2651C11.2984 13.7436 12.0386 13.7436 12.4943 13.2651C12.95 12.7866 12.95 12.0095 12.4943 11.531L8.65157 7.49994L12.4906 3.4651Z"
              fill="black"
            />
          </svg>
        </div>
        <div className={css.filtermodalcontent}>
          <div className={css.sectioncity}>
            <div className={css.sectioncitytitle}>City</div>
            <div className={css.sectioncitycontent}>
              <div className={css.item}>Any</div>
              <div className={css.item}>Havana</div>
              <div className={css.itemactive}>Willemstad</div>
            </div>
            <div className={css.sectioncitycontent}>
              <div className={css.item}>San Juan</div>
              <div className={css.item}>San Juan</div>
              <div className={css.item}>San Juan</div>
            </div>
          </div>
          <div className={css.sectioncity}>
            <div className={css.sectioncitytitle}>Type</div>
            <div className={css.sectioncitycontent}>
              <div className={css.itemactive}>Any</div>
              <div className={css.item}>Indoor</div>
              <div className={css.item}>Outdoor</div>
            </div>
          </div>
          <div className={css.sectiondistance}>
            <div className={css.sectioncitytitle}>Distance</div>
            <div className={css.sectiondistancesearch}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M11.3756 5.68667C11.3756 6.94156 10.9681 8.10077 10.2818 9.04125L13.7436 12.5052C14.0855 12.8469 14.0855 13.4019 13.7436 13.7437C13.4018 14.0854 12.8467 14.0854 12.5049 13.7437L9.04302 10.2797C8.10235 10.9687 6.94292 11.3733 5.68778 11.3733C2.54583 11.3733 0 8.828 0 5.68667C0 2.54533 2.54583 0 5.68778 0C8.82973 0 11.3756 2.54533 11.3756 5.68667ZM5.68778 9.62359C6.20488 9.62359 6.71692 9.52176 7.19467 9.32391C7.67241 9.12606 8.1065 8.83607 8.47215 8.47049C8.83779 8.10491 9.12784 7.67091 9.32573 7.19326C9.52362 6.71561 9.62547 6.20367 9.62547 5.68667C9.62547 5.16966 9.52362 4.65772 9.32573 4.18007C9.12784 3.70242 8.83779 3.26842 8.47215 2.90284C8.1065 2.53726 7.67241 2.24727 7.19467 2.04942C6.71692 1.85158 6.20488 1.74974 5.68778 1.74974C5.17067 1.74974 4.65863 1.85158 4.18089 2.04942C3.70315 2.24727 3.26906 2.53726 2.90341 2.90284C2.53776 3.26842 2.24771 3.70242 2.04982 4.18007C1.85194 4.65772 1.75009 5.16966 1.75009 5.68667C1.75009 6.20367 1.85194 6.71561 2.04982 7.19326C2.24771 7.67091 2.53776 8.10491 2.90341 8.47049C3.26906 8.83607 3.70315 9.12606 4.18089 9.32391C4.65863 9.52176 5.17067 9.62359 5.68778 9.62359Z"
                  fill="#06C167"
                />
              </svg>
              <input
                className={css.sectiondistancesearchinput}
                placeholder="Address, neighborhood, or zip"
              />
            </div>
            <div className={css.sectiondistanceitems}>
              <div className={css.sectiondistanceactiveitem}>Any</div>
              <div className={css.sectiondistanceitem}>0.5 mi</div>
              <div className={css.sectiondistanceitem}>1 mi</div>
              <div className={css.sectiondistanceitem}>5 mi</div>
              <div className={css.sectiondistanceitem}>10 mi</div>
            </div>
          </div>
          <div className={css.sectioncity}>
            <div className={css.sectioncitytitle}>Group size</div>
            <div className={css.sectioncitycontent}>
              <div className={css.item}>Any</div>
              <div className={css.item}>Under 10</div>
              <div className={css.itemactive}>10-24</div>
            </div>
            <div className={css.sectioncitycontent}>
              <div className={css.item}>25-49</div>
              <div className={css.item}>50-99</div>
              <div className={css.item}>100+</div>
            </div>
          </div>
          <div className={css.sectionbudget}>
            <div className={css.sectioncitytitle}>Budget</div>
            <div>
              <svg
                width="368"
                height="127"
                viewBox="0 0 399 127"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M73.5 93.5C73.5 91.8431 74.8431 90.5 76.5 90.5H83.5C85.1569 90.5 86.5 91.8431 86.5 93.5V95.5H73.5V93.5Z"
                  fill="#06C167"
                />
                <path
                  d="M88.5 91.5C88.5 89.8431 89.8431 88.5 91.5 88.5H98.5C100.157 88.5 101.5 89.8431 101.5 91.5V95.5H88.5V91.5Z"
                  fill="#06C167"
                />
                <path
                  d="M103.5 88.5C103.5 86.8431 104.843 85.5 106.5 85.5H113.5C115.157 85.5 116.5 86.8431 116.5 88.5V95.5H103.5V88.5Z"
                  fill="#06C167"
                />
                <path
                  d="M118.5 85.5C118.5 83.8431 119.843 82.5 121.5 82.5H128.5C130.157 82.5 131.5 83.8431 131.5 85.5V95.5H118.5V85.5Z"
                  fill="#06C167"
                />
                <path
                  d="M133.5 79.5C133.5 77.8431 134.843 76.5 136.5 76.5H143.5C145.157 76.5 146.5 77.8431 146.5 79.5V95.5H133.5V79.5Z"
                  fill="#06C167"
                />
                <path
                  d="M148.5 55.5C148.5 53.8431 149.843 52.5 151.5 52.5H158.5C160.157 52.5 161.5 53.8431 161.5 55.5V95.5H148.5V55.5Z"
                  fill="#06C167"
                />
                <path
                  d="M163.5 31.5C163.5 29.8431 164.843 28.5 166.5 28.5H173.5C175.157 28.5 176.5 29.8431 176.5 31.5V95.5H163.5V31.5Z"
                  fill="#06C167"
                />
                <path
                  d="M178.5 62.5C178.5 60.8431 179.843 59.5 181.5 59.5H188.5C190.157 59.5 191.5 60.8431 191.5 62.5V95.5H178.5V62.5Z"
                  fill="#06C167"
                />
                <path
                  d="M193.5 47.5C193.5 45.8431 194.843 44.5 196.5 44.5H203.5C205.157 44.5 206.5 45.8431 206.5 47.5V95.5H193.5V47.5Z"
                  fill="#06C167"
                />
                <path
                  d="M208.5 19.5C208.5 17.8431 209.843 16.5 211.5 16.5H218.5C220.157 16.5 221.5 17.8431 221.5 19.5V95.5H208.5V19.5Z"
                  fill="#06C167"
                />
                <path
                  d="M223.5 36.5C223.5 34.8431 224.843 33.5 226.5 33.5H233.5C235.157 33.5 236.5 34.8431 236.5 36.5V95.5H223.5V36.5Z"
                  fill="#06C167"
                />
                <path
                  d="M238.5 3.5C238.5 1.84315 239.843 0.5 241.5 0.5H248.5C250.157 0.5 251.5 1.84315 251.5 3.5V95.5H238.5V3.5Z"
                  fill="#06C167"
                />
                <path
                  d="M253.5 36.5C253.5 34.8431 254.843 33.5 256.5 33.5H263.5C265.157 33.5 266.5 34.8431 266.5 36.5V95.5H253.5V36.5Z"
                  fill="#06C167"
                />
                <path
                  d="M268.5 50.5C268.5 48.8431 269.843 47.5 271.5 47.5H278.5C280.157 47.5 281.5 48.8431 281.5 50.5V95.5H268.5V50.5Z"
                  fill="#06C167"
                />
                <path
                  d="M283.5 71.5C283.5 69.8431 284.843 68.5 286.5 68.5H293.5C295.157 68.5 296.5 69.8431 296.5 71.5V95.5H283.5V71.5Z"
                  fill="#06C167"
                />
                <path
                  d="M298.5 64.5C298.5 62.8431 299.843 61.5 301.5 61.5H308.5C310.157 61.5 311.5 62.8431 311.5 64.5V95.5H298.5V64.5Z"
                  fill="#06C167"
                />
                <path
                  d="M313.5 85.5C313.5 83.8431 314.843 82.5 316.5 82.5H323.5C325.157 82.5 326.5 83.8431 326.5 85.5V95.5H313.5V85.5Z"
                  fill="#06C167"
                />
                <line x1="27.5" y1="95" x2="372.5" y2="95" stroke="black" />
                <g filter="url(#filter0_d_56_5417)">
                  <circle cx="27" cy="95" r="11.5" fill="white" />
                  <circle cx="27" cy="95" r="11" stroke="#1B242D" strokeOpacity="0.1" />
                </g>
                <g filter="url(#filter1_d_56_5417)">
                  <circle cx="372.5" cy="95" r="11.5" fill="white" />
                  <circle cx="372.5" cy="95" r="11" stroke="#1B242D" strokeOpacity="0.1" />
                </g>
                <defs>
                  <filter
                    id="filter0_d_56_5417"
                    x="0.5"
                    y="73.5"
                    width="53"
                    height="53"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="5" />
                    <feGaussianBlur stdDeviation="7.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_56_5417"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_56_5417"
                      result="shape"
                    />
                  </filter>
                  <filter
                    id="filter1_d_56_5417"
                    x="346"
                    y="73.5"
                    width="53"
                    height="53"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="5" />
                    <feGaussianBlur stdDeviation="7.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_56_5417"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_56_5417"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
            <div className={css.sectionbudgetinputs}>
              <div className={css.sectionbudgetinput}>
                <div className={css.sectionbudgetinputtitle}>Minimum</div>
                <div className={css.sectionbudgetinputitem}>
                  <div className={css.symbol}>$</div>
                  <div className={css.sectionbudgetinputvalue}>0</div>
                </div>
              </div>
              <div className={css.sectionbudgetinput}>
                <div className={css.sectionbudgetinputtitle}>Maximum</div>
                <div className={css.sectionbudgetinputitem}>
                  <div className={css.symbol}>$</div>
                  <div className={css.sectionbudgetinputvalue}>1000</div>
                </div>
              </div>
            </div>
          </div>
          <div className={css.sectionbutton}>
            <div className={css.clearbutton}>Clear All</div>
            <div className={css.showbutton}>Show 123 results</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExperienceFilter;
