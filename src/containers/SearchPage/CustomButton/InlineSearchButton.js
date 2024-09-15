import React, { useState } from 'react';
import styles from './InlineSearchButton.module.css'; // Import the CSS module

const InlineSearchButton = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (searchText.length === 6) {
      const url = `${window.location.origin}/s?keywords=${encodeURIComponent(searchText)}`;
      window.location.href = url;
    } else {
      setError('Please enter a 6-digit pincode.');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setSearchText(value);
      setError('');
    }
  };

  return (
    <div className={styles.container}>
      {!showSearch ? (
        <button 
          onClick={() => setShowSearch(true)}
          className={`${styles.button} ${styles.searchButton}`}
        >
          Search Pincode
        </button>
      ) : (
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchText}
            onChange={handleChange}
            placeholder="Enter Pincode"
            className={styles.input}
            maxLength="6" // Enforces a maximum length of 6 digits
          />
          <button 
            onClick={handleSearch}
            className={`${styles.button} ${styles.searchButtonSubmit}`}
          >
            Search
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default InlineSearchButton;
