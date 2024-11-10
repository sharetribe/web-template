import React, { useState } from 'react';
import css from './GiftCardsMailBox.module.css';
import { sendGiftCard } from '../../util/api';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GiftCardsMailBox = () => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const checkIfAlreadyGifted = async (email) => {
    const { data, error } = await supabase
      .from('giftcard')
      .select('gifted, recipient')
      .eq('recipient', email)
      .single();

    if (error) {
      console.error('Error checking gifted status:', error);
      throw new Error('Error checking gifted status.');
    }

    return data ? { gifted: data.gifted, recipient: data.recipient } : { gifted: false, recipient: null };
  };

  const handleSend = async () => {
    try {
      const { gifted, recipient } = await checkIfAlreadyGifted(email);

      if (gifted) {
        setStatusMessage(`You have already gifted this card to ${recipient}.`);
        return;
      }

      await sendGiftCard({ email });
      setStatusMessage(`Notification successfully sent to ${email}!`);
      setEmail('');
    } catch (error) {
      setStatusMessage('There was an error sending the notification. Please try again.');
      console.error('Error sending gift card notification:', error);
    }
  };

  return (
    <div className={css.mailboxContainer}>
      <p className={css.caption}>
        Send a surprise to a friend! Enter their email, and we’ll let them know about the wonderful gift you've sent.
      </p>
      <div className={css.inputContainer}>
        <input
          type="email"
          placeholder="Enter friend's email"
          value={email}
          onChange={handleEmailChange}
          className={css.input}
        />
        <button onClick={handleSend} className={css.sendButton}>
          Send
        </button>
      </div>
      {statusMessage && <p className={css.statusMessage}>{statusMessage}</p>}
    </div>
  );
};

export default GiftCardsMailBox;
