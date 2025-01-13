import React from 'react';
import css from './WhyUs.module.css';
import ActionTeamButtons from '../ActionTeamButtons/ActionTeamButtons';
import Newsletter from '../Newsletter/Newsletter';
const WhyUs = () => {
  return (
    <div className={css.container}>
      <h2 className={css.title}>Perchè Club Joy ?</h2>
      <div className={css.grid}>
        <div className={css.item}>
          <h3 className={css.heading}>Creato per le sfide HR</h3>
          <p className={css.description}>
          Unisci generazioni, risveglia soft skills e preparare il team a un futuro dove l’umano fa la differenza
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Risultati a prova di scienza</h3>
          <p className={css.description}>
          Team più motivati, connessi e pronti a innovare
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>No stress</h3>
          <p className={css.description}>
          Portiamo tutto noi, direttamente da voi
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Creatività che fa bene</h3>
          <p className={css.description}>
          Empatia, collaborazione e pensiero critico senza stress da performance
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>Supporto 24/7</h3>
          <p className={css.description}>
          Sempre al tuo fianco - cancella gratis fino a 5 giorni prima
          </p>
        </div>
        <div className={css.item}>
          <h3 className={css.heading}>+45 Artigiani</h3>
          <p className={css.description}>
          La creatività in tutte le sue forme, scegliete il vostro artigiano preferito 
          </p>
        </div>
      </div>
      <div className={css.buttonContainer} >
      <ActionTeamButtons  />
      <Newsletter />
      </div>
      
    </div>
  );
};
export default WhyUs;