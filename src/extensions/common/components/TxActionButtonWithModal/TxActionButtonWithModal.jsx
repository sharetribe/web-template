import React, { useState } from 'react';
import { SquareCheck } from 'lucide-react';
import { useDispatch } from 'react-redux';

import { Modal, PrimaryButton } from '../../../../components';
import TransactionModalForm from '../../../transactionProcesses/components/TransactionModalForm/TransactionModalForm';
import { toastSuccess } from '../Toast/Toast';
import { manageDisableScrolling } from '../../../../ducks/ui.duck';

import css from './TxActionButtonWithModal.module.css';
import modalCss from '../../../../components/Modal/Modal.module.css';

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
  const dispatch = useDispatch();
  const onManageDisableScrolling = (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling));

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
    toastTitleTranslationId,
    toastContentTranslationId,
    error: actionError,
    errorText,
    formConfigs,
    transitionKey,
    txInfo,
  } = buttonProps || {};

  const handleClick = () => {
    if (isConfirmNeeded) {
      setIsConfirmModalOpen(true);
    } else {
      onAction?.();
    }
  };

  const handleConfirmModal = async values => {
    await onAction?.(values);
    setIsConfirmModalOpen(false);

    // Wait 0.5 second to auto scroll
    await new Promise(r => setTimeout(r, 500));

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    toastSuccess({
      titleId:
        toastTitleTranslationId ||
        `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.toastTitle`,
      contentId:
        toastContentTranslationId ||
        `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.toastContent`,
      intl,
      translationValues: txInfo,
    });
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
          onManageDisableScrolling={onManageDisableScrolling}
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
                <PrimaryButton inProgress={inProgress} disabled={buttonDisabled}>
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
