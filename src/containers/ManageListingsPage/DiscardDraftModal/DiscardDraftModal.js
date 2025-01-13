import React from 'react';
import { bool, func, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';

import { IconAlert, Modal, Button } from '../../../components';

import css from './DiscardDraftModal.module.css';

// Dispute modal
const DiscardDraftModal = props => {
  const {
    className,
    rootClassName,
    id,
    intl,
    isOpen,
    onCloseModal,
    onManageDisableScrolling,
    onDiscardDraft,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      closeButtonMessage={intl.formatMessage({ id: 'DiscardDraftModal.close' })}
    >
      <IconAlert className={css.modalIcon} />
      <p className={css.modalTitle}>
        <FormattedMessage id="DiscardDraftModal.title" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="DiscardDraftModal.message" />
      </p>
      <Button onClick={onDiscardDraft} className={css.submitButton}>
        <FormattedMessage id="DiscardDraftModal.submit" />
      </Button>
    </Modal>
  );
};

DiscardDraftModal.defaultProps = {
  className: null,
  rootClassName: null,
  isOpen: false,
  disputeSubmitted: false,
  disputeInProgress: false,
  disputeError: null,
};

DiscardDraftModal.propTypes = {
  className: string,
  rootClassName: string,
  id: string.isRequired,
  isOpen: bool,
  intl: intlShape.isRequired,
  onCloseModal: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onDiscardDraft: func.isRequired,
  disputeSubmitted: bool,
  disputeInProgress: bool,
  disputeError: propTypes.error,
};

export default injectIntl(DiscardDraftModal);
