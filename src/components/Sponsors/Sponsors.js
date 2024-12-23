import React from 'react';
import css from './Sponsors.module.css';
import doubleYouLogo from '../../media/partners/doubleyou.png';
import coverFlexLogo from '../../media/partners/coverflex.jpg';
import laStampa from '../../media/partners/laStampa.png';
import conoscoUnPosto from '../../media/partners/conoscoUnPosto.png';
import casawi from '../../media/partners/casawi.png';
import estRadio from '../../media/partners/estRadio.png';
import radioBocconi from '../../media/partners/radioBocconi.png';

const Sponsors = () => {
  const sponsors = [
    { src: doubleYouLogo, alt: 'Double You' },
    { src: coverFlexLogo, alt: 'CoverFlex' },
    { src: laStampa, alt: 'La Stampa' },
    { src: conoscoUnPosto, alt: 'Conosco Un Posto' },
    { src: casawi, alt: 'Casawi' },
    { src: estRadio, alt: 'Est Radio' },
    { src: radioBocconi, alt: 'Radio Bocconi' },
  ];

  return (
    <div className={css.container}>
      <h2 className={css.title}>Ci trovi su</h2>
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
