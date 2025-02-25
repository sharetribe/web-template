import React from 'react';
import adImage from '../../assets/ad-banner-nayax.avif';

const AdBanner = ({ link }) => (
  <section style={{ textAlign: 'center', maxWidth: '800px', margin: '2rem auto' }}>
    <a href={`${link}`}>
      <img 
        src={adImage} 
        alt={`Nayax Banner`} 
        style={{ maxWidth: '90%', height: 'auto' }}
      />
    </a>
  </section>
);

export default AdBanner;