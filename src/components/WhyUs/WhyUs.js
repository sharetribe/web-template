import React from 'react';
import css from './WhyUs.module.css';
import ActionTeamButtons from '../ActionTeamButtons/ActionTeamButtons';
import Newsletter from '../Newsletter/Newsletter';

const WhyUs = ({ isTeamBuilding }) => {
  return (
    <div className={css.container}>
      <h2 className={css.title}>Perchè Club Joy ?</h2>
      <div className={css.grid}>
        {isTeamBuilding ? (
          <>
            <div className={css.item}>
              <h3 className={css.heading}>Creato per le sfide HR</h3>
              <p className={css.description}>
                Unisci generazioni, risveglia soft skills e preparare il team a un futuro dove l’umano fa la differenza
              </p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>Risultati a prova di scienza</h3>
              <p className={css.description}>Team più motivati, connessi e pronti a innovare</p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>No stress</h3>
              <p className={css.description}>Portiamo tutto noi, direttamente da voi</p>
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
          </>
        ) : (
          <>
            <div className={css.item}>
              <h3 className={css.heading}>Incontra amici brillanti e creativi</h3>
              <p className={css.description}>
                Condividi idee, risate e ispirazione con chi ama esplorare e creare, proprio come te
              </p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>La felicità è fatta a mano</h3>
              <p className={css.description}>
                Scopri il piacere di creare qualcosa di unico, tutto tuo, e dimentica lo stress quotidiano
              </p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>Senza limiti né giudizi</h3>
              <p className={css.description}>Non serve essere perfetti: basta esserci</p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>Self-care per la mente</h3>
              <p className={css.description}>
                Un momento tutto per te: ricarica la creatività e ritrova il sorriso
              </p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>No stress</h3>
              <p className={css.description}>Scopri, prenota e paga in 30 secondi</p>
            </div>
            <div className={css.item}>
              <h3 className={css.heading}>+45 Artigiani</h3>
              <p className={css.description}>Scopri il tuo artigiano preferito, nella tua città</p>
            </div>
          </>
        )}
      </div>
      <div className={css.buttonContainer}>
        <ActionTeamButtons />
      </div>
    </div>
  );
};

export default WhyUs;
