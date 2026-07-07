import React from 'react';
import classNames from 'classnames';

import { InlineTextButton } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActionButtons
// Currently this is only used to show "dispute order" modal,
// but like ActionButtonsMaybe, this could be customized to handle different actions too.
// Essentially, this is just a placeholder for diminished actions.
const DiminishedActionButtonMaybe = props => {
  const { id, className, rootClassName, showButton, onOpenModal, buttonMessage } = props;

  const classes = classNames(rootClassName || css.diminishedActionButtonRoot, className);

  return showButton && buttonMessage && onOpenModal ? (
    <div className={classes}>
      <InlineTextButton id={id} className={css.diminishedActionButton} onClick={onOpenModal}>
        {buttonMessage}
      </InlineTextButton>
    </div>
  ) : null;
};

export default DiminishedActionButtonMaybe;
