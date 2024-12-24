import React, { useState, useEffect } from 'react';
import { PopupButton } from 'react-calendly';
import { useHistory } from 'react-router-dom';
import { PrimaryButton } from '../Button/Button'; 
import css from './ActionTeamButtons.module.css';

const ActionTeamButtons = () => {
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();

  // For Calendly
  useEffect(() => {
    setIsClient(true); // Make sure Calendly can mount on client side
  }, []);

  // Navigation example
  const handleNavigate = () => {
    history.push('/ts');
  };

  // Open the modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // WhatsApp
  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/3757765898',
      '_blank'
    );
    // Close the modal after selection
    handleCloseModal();
  };

  // Calendly (We’ll also close the modal immediately if user clicks Calendly)
  const handleCalendlyClick = () => {
    handleCloseModal();
  };

  return (
    <div className={css.buttonContainer}>
      {/* Button to open the modal */}
      <button onClick={handleOpenModal} className={css.parlaConNoiButton}>
        Parla con noi
      </button>

      {/* The Modal (conditionally rendered) */}
      {isModalOpen && (
        <div className={css.modalOverlay} onClick={handleCloseModal}>
          <div
            className={css.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Scegli un canale</h3>
            <button onClick={handleWhatsApp} className={css.modalOption}>
              WhatsApp
            </button>
            {isClient && (
              <PopupButton
                url="https://calendly.com/hello-epym"
                rootElement={document.getElementById('root')}
                text="Calendly"
                className={css.modalOption}
                onClick={handleCalendlyClick}
              />
            )}
            <button onClick={handleCloseModal} className={css.modalClose}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Another primary button (example) */}
      <PrimaryButton onClick={handleNavigate} className={css.primaryButton}>
        Prenota la tua esperienza
      </PrimaryButton>
    </div>
  );
};

export default ActionTeamButtons;
