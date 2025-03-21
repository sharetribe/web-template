import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldTextInput, Form, IconDisputeOrder, Modal, Button } from '../../../components';

import css from './DisputeModal.module.css';

const DisputeForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        intl,
        formId,
        invalid,
        disputeSubmitted,
        disputeError,
        disputeInProgress,
      } = fieldRenderProps;

      const errorMessageMaybe = disputeError ? (
        <FormattedMessage id="DisputeModal.disputeSubmitFailed" />
      ) : null;

      const classes = classNames(rootClassName || css.formRoot, className);
      const submitInProgress = disputeInProgress;
      const submitDisabled = invalid || disabled || submitInProgress || disputeSubmitted;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.disputeMessage}
            type="textarea"
            id={formId ? `${formId}.disputeReason` : 'disputeReason'}
            name="disputeReason"
            label={intl.formatMessage({ id: 'DisputeModal.label' })}
            placeholder={intl.formatMessage({ id: 'DisputeModal.disputePlaceholder' })}
            validate={required(intl.formatMessage({ id: 'DisputeModal.disputeReasonRequired' }))}
          />
          <p className={css.errorPlaceholder}>{errorMessageMaybe}</p>
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={disputeInProgress}
            disabled={submitDisabled}
            ready={disputeSubmitted}
          >
            {intl.formatMessage({ id: 'DisputeModal.submit' })}
          </Button>
        </Form>
      );
    }}
  />
);

// Show dispute form
const DisputeInfo = props => {
  const config = useConfiguration();
  const marketplaceName = config.marketplaceName;

  return (
    <>
      <p className={css.modalTitle}>
        <FormattedMessage id="DisputeModal.title" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="DisputeModal.description" values={{ marketplaceName }} />
      </p>
      <DisputeForm
        onSubmit={props.onDisputeOrder}
        disputeSubmitted={props.disputeSubmitted}
        disputeInProgress={props.disputeInProgress}
        disputeError={props.disputeError}
        intl={props.intl}
      />
    </>
  );
};

// Show info that dispute form has been sent already.
const DisputeSentInfo = props => (
  <>
    <p className={css.modalTitle}>
      <FormattedMessage id="DisputeModal.sentTitle" />
    </p>
    <p className={css.modalMessage}>
      <FormattedMessage id="DisputeModal.sentMessage" />
    </p>
    <p className={css.modalMessage}>
      <FormattedMessage id="DisputeModal.sentNextStep" />
    </p>
  </>
);

/**
 * Dispute modal
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onCloseModal - The on close modal function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onDisputeOrder - The on dispute order function
 * @param {boolean} props.disputeSubmitted - Whether the dispute is submitted
 * @param {boolean} props.disputeInProgress - Whether the dispute is in progress
 * @param {propTypes.error} props.disputeError - The dispute error
 * @returns {JSX.Element} The DisputeModal component
 */
const DisputeModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    isOpen = false,
    onCloseModal,
    onManageDisableScrolling,
    onDisputeOrder,
    disputeSubmitted = false,
    disputeInProgress = false,
    disputeError,
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
      closeButtonMessage={intl.formatMessage({ id: 'DisputeModal.close' })}
    >
      <IconDisputeOrder className={css.modalIcon} />
      {disputeSubmitted ? (
        <DisputeSentInfo />
      ) : (
        <DisputeInfo
          onDisputeOrder={onDisputeOrder}
          disputeSubmitted={disputeSubmitted}
          disputeInProgress={disputeInProgress}
          disputeError={disputeError}
          intl={intl}
        />
      )}
    </Modal>
  );
};

export default DisputeModal;
