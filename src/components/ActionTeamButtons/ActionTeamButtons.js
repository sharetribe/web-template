import React, { useState, useEffect } from 'react';
import { PopupButton } from 'react-calendly';
import { useHistory } from 'react-router-dom';
import { PrimaryButton } from '../Button/Button'; 
import { FcCalendar } from 'react-icons/fc';
import { FaWhatsapp } from 'react-icons/fa';
import css from './ActionTeamButtons.module.css';


const ActionTeamButtons = ({isTeamBuilding}) => {
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();

  // For Calendly
  useEffect(() => {
    setIsClient(true); // Make sure Calendly can mount on client side
  }, []);

  // Navigation example
  const handleNavigate = () => {
    isTeamBuilding? history.push('/ts') : history.push('/s');
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
            <button onClick={handleWhatsApp} className={css.modalOption}>
              <FaWhatsapp style={{ marginRight: '12px', color: '#25D366' , width:'30px', height:'30px' }} />
              Chattiamo ora
            </button>
            {isClient && (
  <div className={css.popupButtonWrapper} onClick={handleCalendlyClick}>
    <FcCalendar style={{ marginRight: '2px', width:'30px', height:'30px' }} />
    <PopupButton
      url="https://calendly.com/hello-epym"
      rootElement={document.getElementById('root')}
      text="Ti richiamiamo"
      className={css.popupButton}
    />
  </div>
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
