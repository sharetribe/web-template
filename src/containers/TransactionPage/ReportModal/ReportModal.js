import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldTextInput, Form, IconDisputeOrder, Modal, Button } from '../../../components';

import css from './ReportModal.module.css';

const ReportForm = props => (
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
        reportSubmitted,
        reportError,
        reportInProgress,
      } = fieldRenderProps;

      const errorMessageMaybe = reportError ? (
        <FormattedMessage id="ReportModal.reportSubmitFailed" />
      ) : null;

      const classes = classNames(rootClassName || css.formRoot, className);
      const submitInProgress = reportInProgress;
      const submitDisabled = invalid || disabled || submitInProgress || reportSubmitted;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.reportMessage}
            type="textarea"
            id={formId ? `${formId}.reportReason` : 'reportReason'}
            name="reportReason"
            label={intl.formatMessage({ id: 'ReportModal.label' })}
            placeholder={intl.formatMessage({ id: 'ReportModal.reportPlaceholder' })}
            validate={required(intl.formatMessage({ id: 'ReportModal.reportReasonRequired' }))}
          />
          <p className={css.errorPlaceholder}>{errorMessageMaybe}</p>
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={reportInProgress}
            disabled={submitDisabled}
            ready={reportSubmitted}
          >
            {intl.formatMessage({ id: 'ReportModal.submit' })}
          </Button>
        </Form>
      );
    }}
  />
);

const ReportInfo = props => {
  const config = useConfiguration();
  const marketplaceName = config.marketplaceName;

  return (
    <>
      <p className={css.modalTitle}>
        <FormattedMessage id="ReportModal.title" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ReportModal.description" />
      </p>
      <ReportForm
        onSubmit={props.onReportOrder}
        reportSubmitted={props.reportSubmitted}
        reportInProgress={props.reportInProgress}
        reportError={props.reportError}
        intl={props.intl}
      />
    </>
  );
};

const ReportSentInfo = () => (
  <>
    <p className={css.modalTitle}>
      <FormattedMessage id="ReportModal.sentTitle" />
    </p>
    <p className={css.modalMessage}>
      <FormattedMessage id="ReportModal.sentMessage" />
    </p>
    <p className={css.modalMessage}>
      <FormattedMessage id="ReportModal.sentNextStep" />
    </p>
  </>
);

/**
 * Report modal
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onCloseModal - The on close modal function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onReportOrder - The on report function
 * @param {boolean} props.reportSubmitted - Whether the report is submitted
 * @param {boolean} props.reportInProgress - Whether the report is in progress
 * @param {propTypes.error} props.reportError - The report error
 * @returns {JSX.Element} The ReportModal component
 */
const ReportModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    isOpen = false,
    onCloseModal,
    onManageDisableScrolling,
    onReportOrder,
    focusElementId,
    reportSubmitted = false,
    reportInProgress = false,
    reportError,
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
      closeButtonMessage={intl.formatMessage({ id: 'ReportModal.close' })}
    >
      <IconDisputeOrder className={css.modalIcon} />
      {reportSubmitted ? (
        <ReportSentInfo />
      ) : (
        <ReportInfo
          onReportOrder={onReportOrder}
          reportSubmitted={reportSubmitted}
          reportInProgress={reportInProgress}
          reportError={reportError}
          intl={intl}
        />
      )}
    </Modal>
  );
};

export default ReportModal;
