import React from 'react';
import css from './Sponsors.module.css';
const Sponsors = () => {
  const sponsors = [
    'La Repubblica',
    'Forbes',
    'Il Sole 24 Ore',
    'Corriere della Sera',
    'ANSA',
    'Sky TG24',
    'StartupItalia!',
    'WIRED',
    'Digital Health Italia',
    'TechCrunch',
    'Bloomberg',
    'The Guardian',
  ];
  return (
    <div className={css.container}>
      <h2 className={css.title}>PRESS & PARTNERS</h2>
      <div className={css.logoGrid}>
        {sponsors.map((sponsor, index) => (
          <div key={index} className={css.logo}>
            {sponsor}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Sponsors;