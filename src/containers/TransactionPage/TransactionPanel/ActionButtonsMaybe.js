import React from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';

import { PrimaryButton, SecondaryButton } from '../../../components';
import TxActionButtonWithModal from '../../../extensions/common/components/TxActionButtonWithModal/TxActionButtonWithModal';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const intl = useIntl();

  const {
    className,
    rootClassName,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    transactionRole,
    processName,
    processState,
  } = props;

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const { inProgress: primaryInProgress } = primaryButtonProps || {};
  const { inProgress: secondaryInProgress } = secondaryButtonProps || {};

  const buttonsDisabled = primaryInProgress || secondaryInProgress;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionButtonWrapper}>
        <TxActionButtonWithModal
          buttonProps={secondaryButtonProps}
          id="Secondary"
          ButtonComponent={SecondaryButton}
          buttonDisabled={buttonsDisabled}
          intl={intl}
          transactionRole={transactionRole}
          processName={processName}
          processState={processState}
        />
        <TxActionButtonWithModal
          buttonProps={primaryButtonProps}
          id="Primary"
          ButtonComponent={PrimaryButton}
          buttonDisabled={buttonsDisabled}
          intl={intl}
          transactionRole={transactionRole}
          processName={processName}
          processState={processState}
        />
      </div>
    </div>
  ) : null;
};

export default ActionButtonsMaybe;
