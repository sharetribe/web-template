import React, { useState } from 'react';
import css from './SectionTeamExperience.module.css';

const SectionTeamExperience = () => {
  return (
    <div className={css.sectionbody}>
      <div className={css.sectiontitle}>Any team experience, on a single platform.</div>
      <div className={css.sectioncontent}>
        <div className={css.sectioncontentitem1}>
          <span className={css.itemtitle}>In-person</span>
        </div>
        <div className={css.sectioncontentitem4}>
          <span className={css.itemtitle}>Venues</span>
        </div>
      </div>
    </div>
  );
};

export default SectionTeamExperience;
