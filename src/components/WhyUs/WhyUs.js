import React from 'react';
import css from './WhyUs.module.css';

const WhyUs = () => {
  return (
    <div className={css.container}>
      <h2 className={css.title}>Perchè Club Joy</h2>
      <div className={css.grid}>

        <div className={css.item}>
          <div className={css.left}>
            <h3 className={css.heading}>Creato per le sfide HR</h3>
          </div>
          <div className={css.center}>
            <span className={css.checkmark}>✔</span>
          </div>
          <div className={css.right}>
            <p className={css.description}>
              Unisci generazioni, risveglia soft skills e prepara il team a un futuro dove l’umano fa la differenza
            </p>
          </div>
        </div>

        <div className={css.item}>
          <div className={css.left}>
            <h3 className={css.headingHighlight}>Creatività che fa bene</h3>
          </div>
          <div className={css.center}>
            <span className={css.checkmark}>✔</span>
          </div>
          <div className={css.right}>
            <p className={css.description}>
              Empatia, collaborazione e pensiero critico senza stress da performance
            </p>
          </div>
        </div>
  
        <div className={css.item}>
          <div className={css.left}>
            <h3 className={css.heading}>Risultati a prova di scienza</h3>
          </div>
          <div className={css.center}>
            <span className={css.checkmark}>✔</span>
          </div>
          <div className={css.right}>
            <p className={css.description}>
              Team più motivati, connessi e pronti a innovare
            </p>
          </div>
        </div>

        <div className={css.item}>
          <div className={css.left}>
            <h3 className={css.heading}>Supporto 24/7</h3>
          </div>
          <div className={css.center}>
            <span className={css.checkmark}>✔</span>
          </div>
          <div className={css.right}>
            <p className={css.description}>
              Sempre al tuo fianco – cancella gratis fino a 5 giorni prima
            </p>
          </div>
        </div>
 
        <div className={css.item}>
          <div className={css.left}>
            <h3 className={css.heading}>Esperienze pratiche, no stress</h3>
          </div>
          <div className={css.center}>
            <span className={css.checkmark}>✔</span>
          </div>
          <div className={css.right}>
            <p className={css.description}>
              Portiamo tutto noi, direttamente da voi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyUs;
