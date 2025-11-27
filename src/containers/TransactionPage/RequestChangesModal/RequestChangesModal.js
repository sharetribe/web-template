import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldTextInput, Form, IconSynchronize, Modal, Button } from '../../../components';

import css from './RequestChangesModal.module.css';

const RequestChangesForm = props => (
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
        changeRequestSubmitted,
        changeRequestError,
        changeRequestInProgress,
      } = fieldRenderProps;

      const errorMessageMaybe = changeRequestError ? (
        <FormattedMessage id="RequestChangesForm.submitFailed" />
      ) : null;

      const classes = classNames(rootClassName || css.formRoot, className);
      const submitInProgress = changeRequestInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.changeRequestMessage}
            type="textarea"
            id={formId ? `${formId}.changeRequestMessage` : 'changeRequestMessage'}
            name="changeRequestMessage"
            placeholder={intl.formatMessage({ id: 'RequestChangesForm.messagePlaceholder' })}
            validate={required(intl.formatMessage({ id: 'RequestChangesForm.messageRequired' }))}
          />
          <p className={css.errorPlaceholder}>{errorMessageMaybe}</p>
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={changeRequestInProgress}
            disabled={submitDisabled}
            ready={changeRequestSubmitted}
          >
            {intl.formatMessage({ id: 'RequestChangesForm.submit' })}
          </Button>
        </Form>
      );
    }}
  />
);

// Show change request form
const ChangeRequestInfo = props => {
  const config = useConfiguration();
  const marketplaceName = config.marketplaceName;
  const {
    changeRequestSubmitted,
    changeRequestInProgress,
    changeRequestError,
    onChangeRequest,
    intl,
  } = props;

  return (
    <>
      <p className={css.modalTitle}>
        <FormattedMessage id="RequestChangesModal.title" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="RequestChangesModal.description" values={{ marketplaceName }} />
      </p>
      <RequestChangesForm
        onSubmit={onChangeRequest}
        changeRequestSubmitted={changeRequestSubmitted}
        changeRequestInProgress={changeRequestInProgress}
        changeRequestError={changeRequestError}
        intl={intl}
      />
    </>
  );
};

/**
 * Change request modal
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onCloseModal - The on close modal function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onChangeRequest - The on change request function
 * @param {boolean} props.changeRequestSubmitted - Whether the change request is submitted
 * @param {boolean} props.changeRequestInProgress - Whether the change request is in progress
 * @param {propTypes.error} props.changeRequestError - The change request error
 * @returns {JSX.Element} The RequestChangesModal component
 */
const RequestChangesModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    isOpen = false,
    onCloseModal,
    focusElementId,
    onManageDisableScrolling,
    onChangeRequest,
    changeRequestSubmitted = false,
    changeRequestInProgress = false,
    changeRequestError,
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
      focusElementId={focusElementId}
      usePortal
      closeButtonMessage={intl.formatMessage({ id: 'RequestChangesModal.close' })}
    >
      <IconSynchronize className={css.modalIcon} />
      <ChangeRequestInfo
        onChangeRequest={onChangeRequest}
        changeRequestInProgress={changeRequestInProgress}
        changeRequestError={changeRequestError}
        changeRequestSubmitted={changeRequestSubmitted}
        intl={intl}
      />
    </Modal>
  );
};

export default RequestChangesModal;
