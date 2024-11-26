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


  const checkIfAlreadyGifted = async (email, giftCardCode) => {
    try {
      const { data, error } = await supabase
        .from('giftcard')

        .select('gifted, recipient, amount') 
        .eq('code', giftCardCode)
        .single(); 

      if (error) {
        console.warn('No previous recipient found for this gift card. Proceeding.');
        return { gifted: false, recipient: null, amount: 0 }; 

      }

      return data
        ? { gifted: data.gifted, recipient: data.recipient, amount: data.amount }
        : { gifted: false, recipient: null, amount: 0 };
    } catch (error) {
      console.error('Error in Supabase query:', error);

      return { gifted: false, recipient: null, amount: 0 }; 
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

      if (giftCardCodes.length === 0) {
        setStatusMessage('Non ci sono codici di carte regalo disponibili da inviare.');
        setLoading(false);
        return;
      }

      const giftCardCode = giftCardCodes[0]; 


      const { gifted, recipient, amount } = await checkIfAlreadyGifted(email, giftCardCode);

      if (gifted) {
        setStatusMessage(
          `Attenzione: questa carta regalo è già stata inviata a ${recipient}. Puoi comunque cambiarne il destinatario.`,
        );

      }

      await sendGiftCard({
        email,
        giftee,
        sender: user.attributes?.profile?.firstName || 'Club Joy',
        giftCardCode,

        amount,
        emailer: user.attributes?.email,
      });

      setStatusMessage(`Gift card inviata con successo a ${giftee}!`);

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

      <h4 className={css.title}> 💙 Regala la gift card di Club Joy 🎁</h4>
      <p className={css.caption}>
        Stai per fare la sorpresa più bella dell'anno. Inserisci il nome e la mail della tua persona
        speciale, e faremo sapere loro del tuo bellissimo pensiero, con istruzioni su come usarlo.
        Non stiamo nella pelle!

      </p>
      <div className={css.inputContainer}>
        <input
          type="text"

          placeholder="Persona Speciale"

          value={giftee}
          onChange={handleGifteeChange}
          className={css.input}
        />
        <input
          type="email"

          placeholder="Email"

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

