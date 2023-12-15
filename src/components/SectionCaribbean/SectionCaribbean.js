import React, { useState } from 'react';
import NamedLink from '../NamedLink/NamedLink';
import css from './SectionCaribbean.module.css';

import landingImg from '../../assets/images/home/landing.svg';

const SectionCaribbean = () => {
  return (
    <div className={css.sectionbody}>
      <div className={css.sectiondescription}>
        <div className={css.sectiondescriptioncontent}>
          <div className={css.sectiondescriptiontitle}>
            Thoughtfully Curated Caribbean Experiences for your Bevy
          </div>
          <div className={css.sectiondesctiptiontitle2}>
            Whether you're thinking of hosting an offsite for the company, need unique
            culture-building activities for your remote team, or to let loose with with your squad,
            Bevy Experiences has something for you.
          </div>
          <div className={css.sectiondescriptiontitle3}>
            1 bevy; a group people with something in common
          </div>
        </div>
        <NamedLink className={css.sectiondescriptionaction} name="ExperiencesPage">
          Explore Experiences
        </NamedLink>
      </div>
      <div className={css.sectionimage}>
        <img src={landingImg} className={css.sectionimageitem} alt="landing" />
      </div>
    </div>
  );
};

export default SectionCaribbean;
