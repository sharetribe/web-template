import React from 'react';
import css from './HowItWorks.module.css';
const HowItWorks = () => {
  return (
    <div className={css.container}>
      <h2 className={css.title}>How It Works?</h2>
      <div className={css.steps}>
        <div className={css.step}>
          <div className={css.circle}></div>
          <p className={css.text}>esplora</p>
        </div>
        <div className={css.arrow}></div>
        <div className={css.step}>
          <div className={css.circle}></div>
          <p className={css.text}>scegli</p>
        </div>
        <div className={css.arrow}></div>
        <div className={css.step}>
          <div className={css.circle}></div>
          <p className={`${css.text} ${css.enjoy}`}>enjoy</p>
        </div>
      </div>
    </div>
  );
};
export default HowItWorks;