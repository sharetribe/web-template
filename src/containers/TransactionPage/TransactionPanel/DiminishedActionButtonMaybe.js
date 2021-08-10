import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../util/reactIntl';

import { InlineTextButton } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActionButtons
// Currently this is only used to show "dispute order" modal,
// but like ActionButtonsMayne, this could be customized to handle different actions too.
// Essentially, this is just a placeholder for diminished actions.
const DiminishedActionButtonMaybe = props => {
  const { className, rootClassName, showDispute, onOpenDisputeModal } = props;

  const diminishedActionButton = onOpenDisputeModal ? (
    <InlineTextButton className={css.diminishedActionButton} onClick={onOpenDisputeModal}>
      <FormattedMessage id="TransactionPanel.disputeOrder" />
    </InlineTextButton>
  ) : null;

  const classes = classNames(rootClassName || css.diminishedActionButtonRoot, className);

  return showDispute ? <div className={classes}>{diminishedActionButton}</div> : null;
};

export default DiminishedActionButtonMaybe;
