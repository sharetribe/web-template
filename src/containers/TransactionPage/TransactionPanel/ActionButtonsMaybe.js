import React from 'react';
import classNames from 'classnames';

import { PrimaryButton, SecondaryButton } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const { className, rootClassName, showButtons, primaryButtonProps, secondaryButtonProps } = props;

  const buttonsDisabled = primaryButtonProps.inProgress || secondaryButtonProps?.inProgress;

  const primaryErrorMessage = primaryButtonProps.error ? (
    <p className={css.actionError}>{primaryButtonProps.errorText}</p>
  ) : null;
  const secondaryErrorMessage = secondaryButtonProps ? (
    <p className={css.actionError}>{secondaryButtonProps.errorText}</p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {primaryErrorMessage}
        {secondaryErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        <SecondaryButton
          inProgress={declineInProgress}
          disabled={buttonsDisabled}
          onClick={onDeclineSale}
        >
          {secondaryButtonProps.buttonText}
        </SecondaryButton>
        <PrimaryButton
          inProgress={primaryButtonProps.inProgress}
          disabled={buttonsDisabled}
          onClick={primaryButtonProps.onTransition}
        >
          {primaryButtonProps.buttonText}
        </PrimaryButton>
      </div>
    </div>
  ) : null;
};

export default ActionButtonsMaybe;
