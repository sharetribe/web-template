import React, { useState } from 'react';
import { checkCoupon } from '../../util/api';
import css from './CodeChecker.module.css';
import { PrimaryButton } from '../Button/Button';

function CodeChecker() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(null);

  const handleCheckCode = async () => {
    setMessage('');
    setAmount(null);

    if (!code) {
      setMessage('Per favore, inserisci un codice.');
      return;
    }

    const requestBody = {
      code,
      listingId: null,
    };

    try {
      const response = await checkCoupon(requestBody);

      if (code.startsWith('GC') && response.amount_off) {
        setAmount(response.amount_off);
        setMessage(`Questo è un buono regalo valido.`);
      } else if (code.startsWith('WF')) {
        setMessage('Questo è un codice Welfare usalo nel listing appropriato.');
      } else {
        setMessage('Codice non valido.');
      }
    } catch (error) {
      setMessage('Codice non valido o errore durante la verifica.');
    }
  };

  return (
    <div className={css.container}>
      <h2 className={css.heading}>Verifica il codice gift card</h2>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Inserisci il codice della tua gift card"
        className={css.input}
      />
      <PrimaryButton onClick={handleCheckCode} className={css.button}>
        Verifica
      </PrimaryButton>
      <div className={css.message}>
        {message && <p>{message}</p>}
        {amount !== null && <p className={css.amount}>Saldo residuo: €{amount / 100}</p>}
      </div>
    </div>
  );
}

export default CodeChecker;
