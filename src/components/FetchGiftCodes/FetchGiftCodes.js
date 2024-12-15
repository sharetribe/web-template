import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import css from './FGC.module.css';
import { fetchGiftCard } from '../../util/supabase';

function FetchGiftCodes({ user, transactionId, onGiftCardCodesFetched }) {
  const [giftCodes, setGiftCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCodesWithDelay = async () => {
      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const data = await fetchGiftCard(user.id.uuid, transactionId);

        setGiftCodes(data);

        if (onGiftCardCodesFetched) {
          const giftCardCodes = data.map((gift) => gift.code);
          onGiftCardCodesFetched(giftCardCodes);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCodesWithDelay();
  }, [user, transactionId, onGiftCardCodesFetched]);

  if (loading) {
    return <div className={css.loader}>Caricamento dei codici regalo in corso...</div>;
  }

  if (error) {
    return <div className={css.error}>Errore durante il recupero dei codici regalo: {error}</div>;
  }

  return (
    <div className={css.giftCodesContainer}>
      <h4 className={css.heading}>Il tuo codice Gift Card:</h4>
      {giftCodes.length > 0 ? (
        <ul className={css.giftCodesList}>
          {giftCodes.map((gift, index) => (
            <li key={index} className={css.giftCode}>
              {gift.code}
            </li>
          ))}
        </ul>
      ) : (
        <p className={css.noGiftCodes}>Nessun codice regalo trovato.</p>
      )}
    </div>
  );
}

FetchGiftCodes.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.shape({
      uuid: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  transactionId: PropTypes.string.isRequired,
  onGiftCardCodesFetched: PropTypes.func,
};

export default FetchGiftCodes;
