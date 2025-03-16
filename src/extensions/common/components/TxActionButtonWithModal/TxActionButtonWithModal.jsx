import React, { useState } from 'react';

import { Modal, PrimaryButton } from '../../../../components';
import TransactionModalForm from '../../../transactionProcesses/components/TransactionModalForm/TransactionModalForm';

import css from './TxActionButtonWithModal.module.css';
import modalCss from '../../../../components/Modal/Modal.module.css';
import { SquareCheck } from 'lucide-react';

const TxActionButtonWithModal = ({
  buttonProps,
  id,
  ButtonComponent,
  buttonDisabled,
  transactionRole,
  processName,
  processState,
  intl,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const {
    inProgress,
    onAction,
    buttonText,
    isConfirmNeeded,
    showConfirmStatement,
    showReminderStatement,
    confirmStatementTranslationId,
    confirmStatementTranslationValues = {},
    reminderStatementTranslationId,
    confirmButtonTranslationId,
    confirmModalTitleTranslationId,
    error: actionError,
    errorText,
    formConfigs,
  } = buttonProps || {};

  const handleClick = () => {
    if (isConfirmNeeded) {
      setIsConfirmModalOpen(true);
    } else {
      onAction?.();
    }
  };

  const handleConfirmModal = values => {
    setIsConfirmModalOpen(false);
    onAction?.(values);
  };

  return (
    <>
      {!!buttonProps && (
        <ButtonComponent inProgress={inProgress} disabled={buttonDisabled} onClick={handleClick}>
          {actionError ? errorText : buttonText}
        </ButtonComponent>
      )}

      {!!isConfirmNeeded && (
        <Modal
          id={`${id}ConfirmActionModal`}
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onManageDisableScrolling={() => {}}
          closeButtonMessage="Close"
          containerClassName={modalCss.modalContainer}
          contentClassName={modalCss.modalContent}
          usePortal
        >
          <div>
            <h2 className={css.confirmModalCheckBoxIcon}>
              {intl.formatMessage({
                id:
                  confirmModalTitleTranslationId ||
                  `TransactionPage.${id}ConfirmActionModal.modalTitle`,
              })}
            </h2>

            <TransactionModalForm
              formConfigs={formConfigs}
              onSubmit={values => handleConfirmModal(values)}
            >
              {showConfirmStatement && (
                <p>
                  {intl.formatMessage(
                    {
                      id:
                        confirmStatementTranslationId ||
                        `TransactionPage.${id}ConfirmActionModal.${processName}.${processState}.${transactionRole}.confirmStatement`,
                    },
                    {
                      ...confirmStatementTranslationValues,
                    }
                  )}
                </p>
              )}

              {showReminderStatement && (
                <div className="reminderBox">
                  <SquareCheck className={css.confirmModalCheckBoxIcon} />

                  {intl.formatMessage({
                    id:
                      reminderStatementTranslationId ||
                      `TransactionPage.${id}ConfirmActionModal.${processName}.${processState}.${transactionRole}.reminderStatement`,
                  })}
                </div>
              )}

              <div className={css.ctaButtonWrapper}>
                <PrimaryButton>
                  {intl.formatMessage({
                    id:
                      confirmButtonTranslationId ||
                      `TransactionPage.${id}ConfirmActionModal.confirmButton`,
                  })}
                </PrimaryButton>
              </div>
            </TransactionModalForm>
          </div>
        </Modal>
      )}
    </>
  );
};

export default TxActionButtonWithModal;
