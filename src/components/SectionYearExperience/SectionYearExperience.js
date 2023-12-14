import React, { useState } from 'react';
import css from './SectionYearExperience.module.css';

const SectionYearExperience = () => {
  return (
    <div className={css.sectionbody}>
      <div className={css.sectioncontent}>
        <div className={css.sectionleft}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
          >
            <path
              d="M14.2187 2.1875C14.2187 0.977539 15.1963 0 16.4062 0H18.5937C19.8037 0 20.7812 0.977539 20.7812 2.1875V11.8193L29.1211 7.00684C30.167 6.40527 31.5068 6.76074 32.1084 7.80664L33.2021 9.7002C33.8037 10.7461 33.4482 12.0859 32.4023 12.6875L24.0625 17.5L32.4023 22.3125C33.4482 22.9141 33.8037 24.2539 33.2021 25.2998L32.1084 27.1934C31.5068 28.2393 30.167 28.6016 29.1211 27.9932L20.7812 23.1807V32.8125C20.7812 34.0225 19.8037 35 18.5937 35H16.4062C15.1963 35 14.2187 34.0225 14.2187 32.8125V23.1807L5.87889 28C4.83299 28.6016 3.49315 28.2461 2.89159 27.2002L1.79784 25.3066C1.19628 24.2607 1.55174 22.9209 2.59764 22.3193L10.9375 17.5L2.59764 12.6875C1.55174 12.0859 1.19628 10.7461 1.79784 9.7002L2.89159 7.80664C3.49315 6.75391 4.83299 6.39844 5.87889 7L14.2187 11.8125V2.1875Z"
              fill="#227667"
            />
          </svg>
          <div className={css.sectionleftcontent}>
            <div className={css.sectionlefttitle}>
              Leveraging years of experience in Events, Marketing & Management
            </div>
            <div className={css.sectionlefttext}>
              Our team is equipped to assist with events of all sizes. Today, we're managing all
              aspects or events, retreats and conferences and are ready to assist you.
            </div>
          </div>
          <div className={css.sectionleftbutton}>Get to know the team</div>
        </div>
        <div className={css.sectionright}></div>
      </div>
    </div>
  );
};

export default SectionYearExperience;
