import React, { Component } from 'react';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';

import { Form, FieldTextInput, FileUpload, Button } from '../../../components';
import { MAX_FILE_UPLOAD_COUNT } from '../TransactionPage.duck';

import css from './SendMessageForm.module.css';

const BLUR_TIMEOUT_MS = 100;

const FieldAddFile = props => {
  const { formApi, onFileUpload, showFileLink, ...rest } = props;
  if (!showFileLink) {
    return null;
  }

  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { input, label, className } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          onFileUpload(file);
        };
        const inputProps = { id: name, name, onChange, type };
        return (
          <label className={className}>
            <input {...inputProps} className={css.hiddenFileInput} />
            {label}
          </label>
        );
      }}
    </Field>
  );
};

const IconAttachFile = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
    >
      <path
        d="M12.309 6.03636C12.6497 6.37765 12.6497 6.93102 12.309 7.27233L7.99042 11.598C7.64969 11.9392 7.64969 12.4926 7.99042 12.8339C8.33114 13.1752 8.88358 13.1752 9.22428 12.8339L14.1598 7.89025C15.1819 6.86638 15.1819 5.20637 14.1598 4.1825C13.1376 3.15863 11.4803 3.15863 10.4581 4.1825L5.52267 9.12617C3.81905 10.8326 3.81905 13.5993 5.52267 15.3058C7.22629 17.0122 9.9884 17.0122 11.692 15.3058L16.0106 10.98C16.3513 10.6387 16.9037 10.6387 17.2445 10.98C17.5852 11.3213 17.5852 11.8746 17.2445 12.2159L12.9259 16.5417C10.5408 18.9307 6.67387 18.9307 4.2888 16.5417C1.90373 14.1526 1.90373 10.2793 4.2888 7.89025L9.22428 2.94658C10.9279 1.24014 13.6901 1.24014 15.3937 2.94658C17.0973 4.65303 17.0973 7.41972 15.3937 9.12617L10.4581 14.0699C9.43603 15.0937 7.77872 15.0937 6.75655 14.0699C5.73437 13.046 5.73437 11.386 6.75655 10.3621L11.0751 6.03638C11.4158 5.69509 11.9682 5.69508 12.309 6.03636Z"
        fill="currentColor"
      />
    </svg>
  );
};

/**
 * Send message form
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {boolean} props.showAttachFiles - Whether the attach files link is shown
 * @param {string} props.messagePlaceholder - The message placeholder
 * @param {Function} props.onSubmit - The on submit function
 * @param {Function} props.onFocus - The on focus function
 * @param {Function} props.onBlur - The on blur function
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {intlShape} props.intl - The intl
 * @returns {JSX.Element} The SendMessageForm component
 */
class SendMessageFormComponent extends Component {
  constructor(props) {
    super(props);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.blurTimeoutId = null;
  }

  handleFocus() {
    if (this.props.onFocus) {
      this.props.onFocus();
    }
    window.clearTimeout(this.blurTimeoutId);
  }

  handleBlur() {
    // We only trigger a blur if another focus event doesn't come
    // within a timeout. This enables keeping the focus synced when
    // focus is switched between the message area and the submit
    // button.
    this.blurTimeoutId = window.setTimeout(() => {
      if (this.props.onBlur) {
        this.props.onBlur();
      }
    }, BLUR_TIMEOUT_MS);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={formRenderProps => {
          const {
            rootClassName,
            className,
            messagePlaceholder,
            handleSubmit,
            inProgress = false,
            sendMessageError,
            invalid,
            form: formApi,
            formId,
            showAttachFiles,
            files,
            onFileUpload,
            onRemoveFile,
          } = formRenderProps;

          const classes = classNames(rootClassName || css.root, className);

          const formState = formApi.getState();
          const hasMessage = !!formState.values.message;
          const isAnyFileUploading = files?.some(f => f.uploadInProgress);
          const hasAnyFileErrors = files?.some(f => !!f.error);

          const submitInProgress = inProgress;
          const submitDisabled =
            invalid || submitInProgress || !hasMessage || isAnyFileUploading || hasAnyFileErrors;
          const showFileLink = showAttachFiles && (!files || files?.length < MAX_FILE_UPLOAD_COUNT);
          const addFileLabel = (
            <>
              <IconAttachFile />
              <FormattedMessage id="TransactionPage.attachFile" />
            </>
          );

          return (
            <Form className={classes} onSubmit={values => handleSubmit(values, formApi)}>
              <FieldTextInput
                inputRootClass={css.textarea}
                type="textarea"
                id={formId ? `${formId}.message` : 'message'}
                name="message"
                placeholder={messagePlaceholder}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
              />
              {files?.length > 0 ? (
                <div className={css.files}>
                  {files.map(f => (
                    <FileUpload item={f} key={f.tempId} onRemoveFile={onRemoveFile} />
                  ))}
                </div>
              ) : null}
              <div className={css.submitContainer}>
                <div className={css.errorContainer}>
                  {sendMessageError ? (
                    <p className={css.error}>
                      <FormattedMessage id="SendMessageForm.sendFailed" />
                    </p>
                  ) : null}
                </div>

                <div className={css.messageActions}>
                  <FieldAddFile
                    id="addFile"
                    name="addFile"
                    label={addFileLabel}
                    type="file"
                    onFileUpload={onFileUpload}
                    formApi={formApi}
                    className={css.fileLink}
                    showFileLink={showFileLink}
                  />
                  <Button
                    className={css.submitButton}
                    inProgress={submitInProgress}
                    disabled={submitDisabled}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                  >
                    <FormattedMessage id="SendMessageForm.sendMessage" />
                  </Button>
                </div>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

const SendMessageForm = compose(injectIntl)(SendMessageFormComponent);

SendMessageForm.displayName = 'SendMessageForm';

export default SendMessageForm;
