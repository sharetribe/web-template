import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

// Import shared components
import { Button, FieldTextInput, Form } from '../../../../components';

// Import modules from this directory
import css from './EditListingFaqForm.module.css';

const UpdateListingError = props =>
  props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingFaqForm.updateFailed" />
    </p>
  ) : null;

const PublishListingError = props =>
  props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingFaqForm.publishListingFailed" />
    </p>
  ) : null;

/**
 * A single FAQ card within the FieldArray.
 * `name` is the scoped field path provided by fields.map (e.g. "faqs[0]").
 */
const FaqCard = ({ name, onRemove, formId, intl }) => (
  <div className={css.faqCard}>
    <FieldTextInput
      id={`${formId}.${name}.question`}
      name={`${name}.question`}
      className={css.faqField}
      type="text"
      label={intl.formatMessage({ id: 'EditListingFaqForm.questionLabel' })}
      placeholder={intl.formatMessage({ id: 'EditListingFaqForm.questionPlaceholder' })}
    />
    <FieldTextInput
      id={`${formId}.${name}.answer`}
      name={`${name}.answer`}
      className={css.faqField}
      type="textarea"
      label={intl.formatMessage({ id: 'EditListingFaqForm.answerLabel' })}
      placeholder={intl.formatMessage({ id: 'EditListingFaqForm.answerPlaceholder' })}
    />
    <div className={css.faqCardActions}>
      <button type="button" className={css.deleteButton} onClick={onRemove}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
        <FormattedMessage id="EditListingFaqForm.delete" />
      </button>
    </div>
  </div>
);

/**
 * The EditListingFaqForm component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const EditListingFaqForm = props => {
  const intl = useIntl();

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      render={formRenderProps => {
        const {
          formId = 'EditListingFaqForm',
          className,
          fetchErrors,
          handleSubmit,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          values,
          form,
        } = formRenderProps;

        const { publishListingError, updateListingError } = fetchErrors || {};
        const faqs = values.faqs || [];

        // FAQs are optional, but if any are added every item must be fully filled
        const hasPendingFaqs = faqs.some(
          faq => !faq?.question?.trim() || !faq?.answer?.trim()
        );

        const submitReady = updated || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = submitInProgress || hasPendingFaqs;
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <p className={css.examples}>
              <FormattedMessage id="EditListingFaqForm.examples" />
            </p>

            <FieldArray name="faqs">
              {({ fields }) => (
                <div className={css.faqList}>
                  {fields.map((name, index) => (
                    <FaqCard
                      key={name}
                      name={name}
                      onRemove={() => fields.remove(index)}
                      formId={formId}
                      intl={intl}
                    />
                  ))}
                  <button
                    type="button"
                    className={css.addFaqButton}
                    onClick={() => form.mutators.push('faqs', { question: '', answer: '' })}
                  >
                    <FormattedMessage id="EditListingFaqForm.addFaq" />
                  </button>
                </div>
              )}
            </FieldArray>

            <PublishListingError error={publishListingError} />
            <UpdateListingError error={updateListingError} />

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              ready={submitReady}
              disabled={submitDisabled}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingFaqForm;
