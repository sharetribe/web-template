import React from 'react';

const AdBanner = ({ link }) => (
  <section style={{ textAlign: 'center', maxWidth: '800px', margin: '2rem auto' }}>
    <a href={`${link}`}>
      <img 
        src="/static/assets/ad-banner-nayax.avif"
        alt={`Nayax Banner`} 
        style={{ maxWidth: '90%', height: 'auto' }}
      />
    </a>
  </section>
);

export default AdBanner;