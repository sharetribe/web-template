import React from 'react';
import css from './Sponsors.module.css';
import doubleYouLogo from '../../media/partners/doubleyou.png';
import coverFlexLogo from '../../media/partners/coverflex.jpg';

const Sponsors = () => {
  const sponsors = [
    { src: doubleYouLogo, alt: 'Double You' },
    { src: coverFlexLogo, alt: 'CoverFlex' }
  ];

  return (
    <div className={css.container}>
      <h2 className={css.title}>Press & Partners</h2>
      <div className={css.logoGrid}>
        {sponsors.map((sponsor, index) => (
          <div key={index} className={css.logo}>
            <img src={sponsor.src} alt={sponsor.alt} className={css.logoImage} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sponsors;
