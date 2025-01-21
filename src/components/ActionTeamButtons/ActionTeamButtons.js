import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FcCalendar } from 'react-icons/fc';
import { PrimaryButton } from '../Button/Button'; 
import { useHistory } from 'react-router-dom';
import css from './ActionTeamButtons.module.css';

const ActionTeamButtons = ({ isTeamBuilding }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const history = useHistory();

  // Navigation example
  const handleNavigate = () => {
    isTeamBuilding 
      ? history.push('/ts') 
      : history.push('/s?bounds=46.51185105%2C9.45037995%2C44.51045137%2C7.47284088');
  };

  // Open/Close modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Handle WhatsApp click
  const handleWhatsApp = () => {
    window.open('https://wa.me/3757765898', '_blank');
    handleCloseModal();
  };

  // Open Calendly link directly
  const handleCalendlyClick = () => {
    setIsModalOpen(false);
    setIsCalendlyOpen(true);
  };

  return (
    <div className={css.buttonContainer}>
      {/* Open the modal */}
      <button onClick={handleOpenModal} className={css.parlaConNoiButton}>
        Parla con noi
      </button>

      {/* Modal content */}
      {isModalOpen && (
        <div className={css.modalOverlay} onClick={handleCloseModal}>
          <div className={css.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleWhatsApp} className={css.modalOption}>
              <FaWhatsapp style={{ marginRight: '12px', color: '#25D366', width: '30px', height: '30px' }} />
              Chattiamo ora
            </button>

            <button onClick={handleCalendlyClick} className={css.modalOption}>
              <FcCalendar style={{ marginRight: '2px', width: '30px', height: '30px' }} />
              Ti richiamiamo
            </button>

            <button onClick={handleCloseModal} className={css.modalClose}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Calendly Popup Modal */}
      {isCalendlyOpen && (
        <div className={css.calendlyOverlay} onClick={() => setIsCalendlyOpen(false)}>
          <div className={css.calendlyContent} onClick={(e) => e.stopPropagation()}>
            <iframe 
              src="https://calendly.com/hello-epym" 
              className={css.calendlyIframe}
              allowFullScreen
            />
            <button onClick={() => setIsCalendlyOpen(false)} className={css.modalClose}>
              Chiudi
            </button>
          </div>
        </div>
      )}

      <PrimaryButton onClick={handleNavigate} className={css.primaryButton}>
        Prenota la tua esperienza
      </PrimaryButton>
    </div>
  );
};

export default ActionTeamButtons;
