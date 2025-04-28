import React, { useState } from 'react';
import { Modal } from '../../../../components';

import css from './ModalIframeButton.module.css';

const ModalIframeButton = ({ iframeUrl, buttonLabel, icon: Icon, buttonClassName, modalWidth, modalHeight }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const MODAL_BREAKPOINT = 768;
  const isWindowDefined = typeof window !== 'undefined';
  const isMobileLayout = isWindowDefined && window.innerWidth < MODAL_BREAKPOINT;

  const onManageDisableScrolling = (isDisabled) => {
    // Implement scrolling management logic if needed
  };

  const handleOpen = () => {
    console.log('open modal')
    if (isMobileLayout) {
      window.open(iframeUrl);
    } else {
      setModalOpen(true);
    }
  };

  return (
    <span>
      <button className={buttonClassName} onClick={handleOpen}>
        {Icon && <Icon />} {buttonLabel}
      </button>
      
        <Modal
          id="iframeModal"
          isOpen={isModalOpen}
          containerClassName={css.root}
          closeButtonClassName={css.closeButton}
          closeButtonMessage=" "
          onClose={() => {
            setModalOpen(false);
            onManageDisableScrolling(false); // Allow scrolling when modal is closed
          }}
          onManageDisableScrolling={onManageDisableScrolling} // Pass the function to manage scrolling
          usePortal
        >
          <iframe 
            src={iframeUrl} 
            className={css.modal} 
            border="0" 
            style={{ 
              width: modalWidth ?? "770px", 
              height: modalHeight ?? "calc(100vh - 50px)" 
            }} 
            title="Modal Content" 
          />
        </Modal>
      
    </span>
  );
};

export default ModalIframeButton;