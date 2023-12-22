import React, { useState } from 'react';
import styles from './TopbarLanguageSelector.module.css';

const LanguageSelector = ({ currentLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const languageSubdomains = {
    en: 'en.sekond.gr',
    el: 'el.sekond.gr',
    // Add other languages and their subdomains here
  };
  const languageNames = {
    en: 'English',
    el: 'Ελληνικά',
    // Add other language full names here
  };
  const languageEmojis = {
    en: '🇬🇧', // Flag emoji for English
    el: '🇬🇷', // Flag emoji for Greek
    // Add other language flag emojis here
  };

  const handleLanguageChange = (languageCode) => {
    const newUrl = `https://${languageSubdomains[languageCode]}`;
    window.location.href = newUrl;
  };

  return (
    <div className={styles.languageSelector} onClick={() => setIsOpen(!isOpen)}>
      <div className={styles.currentLanguage}>
        {languageNames[currentLanguage]}
        &nbsp;&nbsp;&nbsp; {/* Add a space between the two elements */}
        <span className={styles.flagEmoji}>{languageEmojis[currentLanguage]}</span>
      </div>
      {isOpen && (
        <div className={styles.languageOptions}>
          {Object.entries(languageNames).map(([code, name]) => (
            <div
              key={code}
              className={styles.languageOption}
              onClick={() => handleLanguageChange(code)}
            >              
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
