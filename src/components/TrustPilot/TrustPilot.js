import React, { useState } from 'react';
import styles from './TrustPilot.module.css';

const reviews = [
  {
    text: 'Siamo un team di 30 persone, con età e background diversissimi. Siamo arrivati al workshop un po’ titubanti—chi pensava di essere negato, chi aveva mille scadenze in testa. Ma bastava vedere il sorriso di ognuno mentre ci si sporcava le mani per capire che stavamo vivendo qualcosa di unico. Per qualche ora, non c’erano ruoli, generazioni o gerarchie. Solo mani impiastricciate e idee che volavano.',
    image: 'https://picsum.photos/400/300?random=1',
  },
  {
    text: 'Abbiamo trascorso una giornata incredibile, ricca di creatività e collaborazione. Non importa da dove venivamo o cosa facevamo prima—ci siamo uniti in un’esperienza che ci ha lasciati ispirati e motivati.',
    image: 'https://picsum.photos/400/300?random=2',
  },
  {
    text: 'L’energia del team era contagiosa! Per un giorno ci siamo lasciati alle spalle le distrazioni e abbiamo trovato una nuova connessione con i colleghi, scoprendo idee e risate che non immaginavamo.',
    image: 'https://picsum.photos/400/300?random=3',
  },
];

const TrustPilot = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? reviews.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === reviews.length - 1 ? 0 : prevIndex + 1));
  };

  const { text, image } = reviews[currentIndex];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Potresti essere tu</h2>

      <div className={styles.carousel}>
        <button className={styles.arrow} onClick={handlePrev}>
          &#8249;
        </button>
        <div className={styles.content}>
          <p className={styles.text}>{text}</p>
          <img className={styles.image} src={image} alt="Review" />
        </div>
        <button className={styles.arrow} onClick={handleNext}>
          &#8250;
        </button>
      </div>

      <div className={styles.trustpilot}>
        {/*<span className={styles.tpText}>Trustpilot</span>*/}
        <span className={styles.rating}>
          <span className={styles.star}>&#9733;</span>
          <span className={styles.star}>&#9733;</span>
          <span className={styles.star}>&#9733;</span>
          <span className={styles.star}>&#9733;</span>
          <span className={styles.star}>&#9733;</span>
        </span>

        <div className={styles.arrowsMobile}>
          <button className={styles.arrowMobile} onClick={handlePrev}>
            &#8249;
          </button>
          <button className={styles.arrowMobile} onClick={handleNext}>
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustPilot;
