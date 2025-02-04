import React, { useState } from 'react';
import classNames from 'classnames';
import { Modal } from '../../../components';
import { PrimaryButton, SecondaryButton } from '../../../components';
import { SquareCheck } from 'lucide-react';

import css from './TransactionPanel.module.css';
import modalCss from '../../../components/Modal/Modal.module.css';

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  const {
    className,
    rootClassName,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    stateData
  } = props;

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  //console.log("state data", stateData)

  // Handler to open confirmation modal
  const handlePrimaryClick = () => {
    if(stateData.processState !== "completed"){
      setConfirmModalOpen(true);
    } else {
      primaryButtonProps.onAction();
    }
  };

  // Handler for confirming the action
  const handleConfirm = () => {
    setConfirmModalOpen(false);
    primaryButtonProps.onAction();
  };

  const primaryButton = primaryButtonProps ? (
    <>
      <PrimaryButton
        inProgress={primaryButtonProps.inProgress}
        disabled={buttonsDisabled}
        onClick={handlePrimaryClick}
      >
        {primaryButtonProps.buttonText}
      </PrimaryButton>
    </>
  ) : null;

  const confirmModal = primaryButtonProps ? (
    <Modal
        id="ConfirmActionModal"
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onManageDisableScrolling={() => {}}
        closeButtonMessage="Close"
        containerClassName={modalCss.modalContainer}
        contentClassName={modalCss.modalContent}
      >
        <div>
          <h2 className="marketplaceModalTitleStyles">Confirmation</h2>
          <p>
            {isProvider ? 
              "I confirm that I have coordinated a meeting between the buyer and property manager." 
            :
              "I confirm that I have met with the property manager and I have or will coordinate moving my machine into place."
            }
          </p>
          
          <div className="reminderBox">
            <SquareCheck />
            {isProvider ? 
              " I understand that as a representative of the property manager, I will cancel the order if the property manager requests it."
            :
              " I understand that once I confirm, the sale will be final."
            }
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            
            <PrimaryButton onClick={handleConfirm}>
              Confirm
            </PrimaryButton>
          </div>
        </div>
      </Modal>
  ) : null;

  const secondaryButton = secondaryButtonProps ? (
    <SecondaryButton
      inProgress={secondaryButtonProps.inProgress}
      disabled={buttonsDisabled}
      onClick={secondaryButtonProps.onAction}
    >
      {secondaryButtonProps.buttonText}
    </SecondaryButton>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <>
    <div className={classes}>
      <div className={css.actionButtonWrapper}>
        {secondaryButton}
        {primaryButton}
      </div>
    </div>
    {confirmModal}

    </>
  ) : null;
};

export default ActionButtonsMaybe;
