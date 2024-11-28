import React, { useState, useEffect } from 'react';
import { PopupButton } from 'react-calendly';
import { useHistory } from 'react-router-dom'; // Import useHistory
import { PrimaryButton } from '../Button/Button'; // Ensure the path to `PrimaryButton` is correct
import css from './ActionTeamButtons.module.css'; // Ensure you create the corresponding CSS file
const ActionTeamButtons = ()  => {
  const [isClient, setIsClient] = useState(false); // New state for client-side rendering
  const handleNavigate = () => {
    history.push('/ts');
  };
  useEffect(() => {
    setIsClient(true); // Set to true on client side
  }, [])
  return (
    <div className={css.buttonContainer}>
      {isClient && (
        <PopupButton
          url="https://calendly.com/hello-epym"
          rootElement={document.getElementById('root')}
          text="☎️ Experience Planner gratis"
          className={css.calendlyButton}
        />
      )}
      <PrimaryButton onClick={handleNavigate} className={css.button}>
        Prenota il tuo evento
      </PrimaryButton>
    </div>
  );
};
export default ActionTeamButtons;