import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { Button, Form } from '../../../../components';

import css from './EditListingFilesForm.module.css';

export const EditListingFilesForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
      } = formRenderProps;

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = false; // TODO: add upload check logic

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingFilesForm;
