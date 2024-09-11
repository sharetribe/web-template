import React from 'react';
import adImage from '../../assets/ad-banner-nayax.avif';

const AdBanner = ({ phoneNumber }) => (
  <div style={{ textAlign: 'center', maxWidth: '800px', margin: '2rem auto' }}>
    <a href={`tel:${phoneNumber}`}>
      <img 
        src={adImage} 
        alt={`Call us at ${phoneNumber}`} 
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </a>
  </div>
);

export default AdBanner;