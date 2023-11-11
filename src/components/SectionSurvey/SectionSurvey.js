import React from 'react';
import css from './SectionSurvey.module.css';

import SvgChart from '../../assets/images/chart.svg';
import SvgBackR from '../../assets/images/survey-back-r.svg';
import SvgBackB from '../../assets/images/survey-back-b.svg';

const SectionSurvey = () => {
  return (
    <div className={css.root}>
      <div className={css.section_l}>
        <div>
          <img src={SvgChart} className={css.fontIcon} />
        </div>
        <div className={css.description}>
          <span className={css.highlight}>Grow your business&nbsp;</span>by<br/> becoming a Bevy Host.
        </div>
      </div>
      <div className={css.section_r}>
        <div className={css.buttonSurvey}>Fill Out Our Brief Survey</div>
      </div>
      <img className={css.backR} src={SvgBackR} />
      <img className={css.backB} src={SvgBackB} />
    </div>
  )
}

export default SectionSurvey;
