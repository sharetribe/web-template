import React from 'react';
import { bool, func, string } from 'prop-types';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldTextInput, Form, IconDisputeOrder, Modal, PrimaryButton } from '../../../components';

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
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={disputeInProgress}
            disabled={submitDisabled}
            ready={disputeSubmitted}
          >
            {intl.formatMessage({ id: 'DisputeModal.submit' })}
          </PrimaryButton>
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

// Dispute modal
const DisputeModal = props => {
  const {
    className,
    rootClassName,
    id,
    intl,
    isOpen,
    onCloseModal,
    onManageDisableScrolling,
    onDisputeOrder,
    disputeSubmitted,
    disputeInProgress,
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

DisputeModal.defaultProps = {
  className: null,
  rootClassName: null,
  isOpen: false,
  disputeSubmitted: false,
  disputeInProgress: false,
  disputeError: null,
};

DisputeModal.propTypes = {
  className: string,
  rootClassName: string,
  id: string.isRequired,
  isOpen: bool,
  intl: intlShape.isRequired,
  onCloseModal: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onDisputeOrder: func.isRequired,
  disputeSubmitted: bool,
  disputeInProgress: bool,
  disputeError: propTypes.error,
};

export default injectIntl(DisputeModal);
