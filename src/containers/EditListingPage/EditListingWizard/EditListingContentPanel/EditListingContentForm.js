import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';

// Import shared components
import { Button, FieldTextInput, Form } from '../../../../components';

// Import modules from this directory
import css from './EditListingContentForm.module.css';

const UpdateListingError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingContentForm.updateFailed" />
    </p>
  ) : null;
};

const PublishListingError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingContentForm.publishListingFailed" />
    </p>
  ) : null;
};

/**
 * The EditListingContentForm component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const EditListingContentForm = props => {
  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          formId = 'EditListingContentForm',
          className,
          fetchErrors,
          handleSubmit,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
        } = formRenderProps;

        const { publishListingError, updateListingError } = fetchErrors || {};
        const submitReady = updated || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = submitInProgress;
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
       

            <PublishListingError error={publishListingError} />
            <UpdateListingError error={updateListingError} />

            <Button
              className={css.submitButton}
              inProgress={submitInProgress}
              ready={submitReady}
              disabled={submitDisabled}
              type="submit"
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingContentForm;
