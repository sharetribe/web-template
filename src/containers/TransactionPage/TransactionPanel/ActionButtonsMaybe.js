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
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
  } = props;

  // Debug logging for Accept button
  console.log('🔘 ActionButtonsMaybe props:', {
    showButtons,
    hasPrimaryButton: !!primaryButtonProps,
    hasSecondaryButton: !!secondaryButtonProps,
    primaryButtonText: primaryButtonProps?.buttonText,
    secondaryButtonText: secondaryButtonProps?.buttonText,
    isProvider,
    isListingDeleted
  });

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    console.log('❌ ActionButtonsMaybe: Returning null due to deleted listing and provider role');
    return null;
  }

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  const primaryButton = primaryButtonProps ? (
    <PrimaryButton
      inProgress={primaryButtonProps.inProgress}
      disabled={buttonsDisabled}
      onClick={() => {
        console.log('🔘 Primary button clicked!', {
          buttonText: primaryButtonProps.buttonText,
          inProgress: primaryButtonProps.inProgress,
          disabled: buttonsDisabled,
          onAction: primaryButtonProps.onAction
        });
        if (primaryButtonProps.onAction) {
          primaryButtonProps.onAction();
        }
      }}
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
      onClick={secondaryButtonProps.onAction}
    >
      {secondaryButtonProps.buttonText}
    </SecondaryButton>
  ) : null;
  const secondaryErrorMessage = secondaryButtonProps?.error ? (
    <p className={css.actionError}>{secondaryButtonProps?.errorText}</p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {primaryErrorMessage}
        {secondaryErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        {secondaryButton}
        {primaryButton}
      </div>
    </div>
  ) : null;
};

export default ActionButtonsMaybe;
