import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createClient } from '@supabase/supabase-js';
import css from './GiftCardsMailBox.module.css';
import { sendGiftCard } from '../../util/api';
import { PrimaryButton } from '../Button/Button';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function GiftCardsMailBox({ user, giftCardCodes }) {
  const [email, setEmail] = useState('');
  const [giftee, setGiftee] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGifteeChange = (event) => {
    setGiftee(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const checkIfAlreadyGifted = async (email) => {
    try {
      const { data, error } = await supabase
        .from('giftcard')
        .select('gifted, recipient')
        .eq('recipient', email)
        .single();

      if (error) {
        console.error('Error checking gifted status:', error);
        return { gifted: false, recipient: null }; // Default if there's an error
      }

      return data
        ? { gifted: data.gifted, recipient: data.recipient }
        : { gifted: false, recipient: null };
    } catch (error) {
      console.error('Error in Supabase query:', error);
      throw new Error('Error checking gifted status.');
    }
  };

  const handleSend = async () => {
    if (!email || !giftee) {
      setStatusMessage("Per favore, inserisci sia il nome che l'email del destinatario.");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('');

      const { gifted, recipient } = await checkIfAlreadyGifted(email);

      if (gifted) {
        setStatusMessage(`Hai già inviato questa carta regalo a ${recipient}.`);
        setLoading(false);
        return;
      }

      if (giftCardCodes.length === 0) {
        setStatusMessage('Non ci sono codici di carte regalo disponibili da inviare.');
        setLoading(false);
        return;
      }

      const giftCardCode = giftCardCodes[0]; // Use the first gift card code

      await sendGiftCard({
        email,
        giftee,
        sender: user.attributes?.profile?.firstName || 'Club Joy',
        giftCardCode,
        emailer: user.attributes?.email,
      });

      setStatusMessage(`Notifica inviata con successo a ${giftee}!`);
      setEmail('');
      setGiftee('');
    } catch (error) {
      setStatusMessage("C'è stato un errore nell'invio della notifica. Per favore, riprova.");
      console.error('Error sending gift card notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css.mailboxContainer}>
      <h4 className={css.title}>Manda la tua Carta Regalo</h4>
      <p className={css.caption}>
        Fai una sorpresa a un amico! Inserisci il suo nome e email, e gli faremo sapere del
        meraviglioso regalo che hai inviato 💙!
      </p>
      <div className={css.inputContainer}>
        <input
          type="text"
          placeholder="Nome dell'amico"
          value={giftee}
          onChange={handleGifteeChange}
          className={css.input}
        />
        <input
          type="email"
          placeholder="Email dell'amico"
          value={email}
          onChange={handleEmailChange}
          className={css.input}
        />
        <PrimaryButton onClick={handleSend} className={css.sendButton} disabled={loading}>
          {loading ? 'Invio in corso...' : 'Invia'}
        </PrimaryButton>
      </div>
      {statusMessage && <p className={css.statusMessage}>{statusMessage}</p>}
    </div>
  );
}

GiftCardsMailBox.propTypes = {
  user: PropTypes.shape({
    attributes: PropTypes.shape({
      email: PropTypes.string.isRequired,
      profile: PropTypes.shape({
        firstName: PropTypes.string,
      }),
    }).isRequired,
  }).isRequired,
  giftCardCodes: PropTypes.arrayOf(PropTypes.string),
};

GiftCardsMailBox.defaultProps = {
  giftCardCodes: [],
};

export default GiftCardsMailBox;
