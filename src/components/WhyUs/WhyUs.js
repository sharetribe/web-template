import React from 'react';
import css from './WhyUs.module.css';
const WhyUs = () => {
  return (
    <div className={css.container}>
      <h2 className={css.title}>Why Us?</h2>
      <div className={css.grid}>
        <div className={css.item}>
          <h3 className={css.heading}>Imagination</h3>
          <p className={css.description}>
            Envisioning how things could be, unencumbered by how they currently are.
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Logic</h3>
          <p className={css.description}>
            Reasoning from first principles, and structuring ideas sharply.
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Meritocracy</h3>
          <p className={css.description}>
            Assigning responsibilities solely based on people’s ability to carry them out, and
            evaluating ideas regardless of where or whom they came from.
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Pragmatism</h3>
          <p className={css.description}>
            Optimizing for impact, finding the right scope—and the ideal balance between speed and
            sophistication—at all times.
          </p>
        </div>
      </div>
    </div>
  );
};
export default WhyUs;