import React, { useState } from 'react';
import styles from './InlineSearchButton.module.css'; // Import the CSS module

const InlineSearchButton = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (searchText === '') {
      // If no input, revert to the "Search Pincode" button
      setShowSearch(false);
      setError(''); // Clear any existing errors
    } else if (searchText.length < 6) {
      // If input is less than 6 digits, show error
      setError('Please enter a 6-digit pincode.');
    } else {
      // If valid, proceed with search
      const url = `${window.location.origin}/s?keywords=${encodeURIComponent(searchText)}`;
      window.location.href = url;
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setSearchText(value);
      setError(''); // Clear error on valid input
    }
  };

  return (
    <div className={styles.container}>
      {!showSearch ? (
        <button 
          onClick={() => setShowSearch(true)}
          className={`${styles.customButton} ${styles.searchButton}`}
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
            className={`${styles.customButton} ${styles.searchButtonSubmit}`}
          >
            Search
          </button>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default InlineSearchButton;
