import React from 'react';
import classNames from 'classnames';

import { PrimaryButton, SecondaryButton } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    setModal, // [SKYFARER]
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    onShowAdjustModal,
    adjustDisabled, // [ADJUST BOOKING]
  } = props;

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  const primaryButton = primaryButtonProps ? (
    <PrimaryButton
      inProgress={primaryButtonProps.inProgress}
      disabled={buttonsDisabled}
      onClick={primaryButtonProps.modal ? () => setModal(primaryButtonProps.modal) : primaryButtonProps.onAction} // [SKYFARER MERGE: modal]
    >
      {primaryButtonProps.buttonText}
    </PrimaryButton>
  ) : null;
  const primaryErrorMessage = primaryButtonProps?.error ? (
    <p className={css.actionError}>{primaryButtonProps?.errorText}</p>
  ) : null;

  const secondaryButton = secondaryButtonProps ? (
    <SecondaryButton
      inProgress={secondaryButtonProps?.inProgress}
      disabled={buttonsDisabled}
      onClick={secondaryButtonProps.modal ? () => setModal(secondaryButtonProps.modal) : secondaryButtonProps.onAction} // [SKYFARER MERGE: modal]
    >
      {secondaryButtonProps.buttonText}
    </SecondaryButton>
  ) : null;
  const secondaryErrorMessage = secondaryButtonProps?.error ? (
    <p className={css.actionError}>{secondaryButtonProps?.errorText}</p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  // [ADJUST BOOKING] Only show Adjust Hours/Price button if allowed
  const adjustButton = isProvider && !adjustDisabled ? (
    <SecondaryButton
      className={css.secondaryButton}
      style={{ marginTop: 8 }}
      onClick={onShowAdjustModal}
    >
      Adjust Hours/Price
    </SecondaryButton>
  ) : null;

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {primaryErrorMessage}
        {secondaryErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        {secondaryButton}
        {primaryButton}
        {adjustButton}
      </div>
    </div>
  ) : null;
};

export default ActionButtonsMaybe;
