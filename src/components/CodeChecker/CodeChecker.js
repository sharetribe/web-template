import React, { useState } from 'react';
import axios from 'axios';
import css from './CodeChecker.module.css';
import { checkCoupon } from '../../util/api';

const CodeChecker = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(null);

  const handleCheckCode = async () => {
    setMessage(''); // Reset message
    setAmount(null); // Reset amount

    if (!code) {
      setMessage('Please enter a code.');
      return;
    }
    const requestBody = {
      code: code,
      listingId: null,
    };

    try {
      // Make a request to your backend API endpoint that checks the code
      const response = await checkCoupon(requestBody)


      if (code.startsWith('GC')) {
        // Display the amount left if it’s a valid GC gift card
        setAmount(response.amount_off);
        setMessage(`This is a valid gift card. Amount left: $${response.amount.off}`);
      } else if (code.startsWith('WF')) {
        // Display a message indicating WF is not a gift card
        setMessage('This code starts with WF and is not a gift card.');
      } else {
        // Display an invalid code message if neither GC nor WF
        setMessage('Invalid code.');
      }
    } catch (error) {
      // Display error message if the code is not valid
      setMessage('Invalid code or error checking code.');
    }
  };

  return (
    <div className={css.container}>
      <h2 className={css.heading}>Check Gift Card Code</h2>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter gift card or coupon code"
        className={css.input}
      />
      <button onClick={handleCheckCode} className={css.button}>
        Check Code
      </button>
      <div className={css.message}>
        {message && <p>{message}</p>}
        {amount !== null && <p className={css.amount}>Remaining Balance: ${amount}</p>}
      </div>
    </div>
  );
};

export default CodeChecker;
