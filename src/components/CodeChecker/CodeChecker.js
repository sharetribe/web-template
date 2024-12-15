
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queryUserListings } from '../../containers/CMSPage/CMSPage.duck';
import css from './CodeChecker.module.css';
import { PrimaryButton } from '../Button/Button';
import ListingGiftCard from '../ListingGiftCard/ListingGiftCard';
import { checkCoupon } from '../../util/api';
import giftCard50 from '../../media/giftcards/50.png';
import giftCard100 from '../../media/giftcards/100.png';
import giftCard150 from '../../media/giftcards/150.png';


function CodeChecker() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(null);

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const listings = useSelector((state) => state.CMSPage.userListingRefs || []);
  const queryListingsError = useSelector((state) => state.CMSPage.queryListingsError);

  const imageUrls = [giftCard150,giftCard100, giftCard50];
  const updatedListings = listings
  .filter((listing) => listing.attributes?.publicData?.listingType === 'gift') 
  .map((listing, index) => ({
    ...listing,
    imageUrl: imageUrls[index % imageUrls.length],
  }))
  .reverse()

  useEffect(() => {
    setLoading(true);
    dispatch(queryUserListings())
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [dispatch]);


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

        setMessage(`Gift card valida.`);

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
      <div className={css.listings}>
        {loading && <p>Loading listings...</p>}
        {queryListingsError && <p>Error fetching listings: {queryListingsError.message}</p>}
        <div className={css.listingCards}>
          {updatedListings.map((l) => (
            <ListingGiftCard
              className={css.listingCard}
              key={l.id.uuid}
              listing={l}
              renderSizes={null}
              imageUrl={l.imageUrl}
              setActiveListing={null}
            />
          ))}
        </div>

        <div className={css.checkBox}>
          <p className={css.heading1}>
            Hai ricevuto una gift card? Inserisci il codice qui sotto per verificarne il saldo.
          </p>
          
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Inserisci il codice gift card"
            className={css.input}
          />
          <button onClick={handleCheckCode} className={css.button}>
            Verifica
          </button>
          {amount ? (
  <p style={{ color: 'white' }}>Saldo residuo: €{amount / 100}</p>
) : (
  <p>{''}</p>
)}


        </div>
       

      </div>
    </div>
  );
}


export default CodeChecker;

