import React, { Component } from 'react';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';

import { Form, FieldTextInput, FileUpload, SecondaryButtonInline } from '../../../components';

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

const IconSendMessage = () => {
  return (
    <svg
      className={css.sendIcon}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
    >
      <g className={css.strokeMatter} fill="none" fillRule="evenodd" strokeLinejoin="round">
        <path d="M12.91 1L0 7.003l5.052 2.212z" />
        <path d="M10.75 11.686L5.042 9.222l7.928-8.198z" />
        <path d="M5.417 8.583v4.695l2.273-2.852" />
      </g>
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
            form,
            formId,
            files,
            onFileUpload,
            onRemoveFile,
          } = formRenderProps;

          const classes = classNames(rootClassName || css.root, className);

          const formState = form.getState();
          const hasMessage = !!formState.values.message;
          const isAnyFileInProgress = files?.some(f => f.inProgress);
          const hasAnyFileErrors = files?.some(f => !!f.error);

          const submitInProgress = inProgress;
          const submitDisabled =
            invalid || submitInProgress || !hasMessage || isAnyFileInProgress || hasAnyFileErrors;
          const showFileLink = !files || files?.length < 10; // TODO add access control logic

          return (
            <Form className={classes} onSubmit={values => handleSubmit(values, form)}>
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
                    label={<FormattedMessage id="TransactionPage.attachFile" />}
                    type="file"
                    onFileUpload={onFileUpload}
                    formApi={form}
                    className={css.fileLink}
                    showFileLink={showFileLink}
                  />
                  <SecondaryButtonInline
                    className={css.submitButton}
                    inProgress={submitInProgress}
                    disabled={submitDisabled}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                  >
                    <IconSendMessage />
                    <FormattedMessage id="SendMessageForm.sendMessage" />
                  </SecondaryButtonInline>
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
