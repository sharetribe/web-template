import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { IconAlert, Modal, Button } from '../../../components';

import css from './DiscardDraftModal.module.css';

/**
 * Dispute modal
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The id of the modal
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onCloseModal - The function to close the modal
 * @param {function} props.onManageDisableScrolling - The function to manage disable scrolling
 * @param {function} props.onDiscardDraft - The function to discard the draft
 * @returns {JSX.Element} Discard draft modal component
 */
const DiscardDraftModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
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

export default DiscardDraftModal;
