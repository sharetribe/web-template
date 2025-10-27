import React, { Component, useState } from 'react';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';

import { FormattedMessage, intlShape, useIntl } from '../../../util/reactIntl';
import { ensureCurrentUser } from '../../../util/data';
import { propTypes } from '../../../util/types';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import { Form, Button, CustomExtendedDataField } from '../../../components';

import css from './PrivateDetailsForm.module.css';

/**
 * PrivateDetailsForm
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The form id
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {Object} props.userTypeConfig - The user type config
 * @param {string} props.userTypeConfig.userType - The user type
 * @param {Array<Object>} props.userFields - The user fields
 * @param {string} props.marketplaceName - The marketplace name
 * @param {Function} props.onSubmit - The function to handle form submission
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {propTypes.error} [props.updateProfileError] - The update profile error
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */

const PrivateDetailsForm = props => {
  const [submittedValues, setSubmittedValues] = useState({});
  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      render={fieldRenderProps => {
        const {
          className,
          currentUser,
          handleSubmit,
          intl,
          invalid,
          pristine,
          rootClassName,
          updateInProgress,
          updateProfileError,
          formId,
          values,
          userFields,
          userTypeConfig,
        } = fieldRenderProps;

        const submitError = updateProfileError ? (
          <div className={css.error}>
            <FormattedMessage id="PrivateDetailsForm.updateProfileFailed" />
          </div>
        ) : null;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = updateInProgress;
        const submittedOnce = Object.keys(submittedValues).length > 0;
        const pristineSinceLastSubmit = submittedOnce && isEqual(values, submittedValues);
        const submitDisabled = invalid || pristine || pristineSinceLastSubmit || submitInProgress;

        const userFieldProps = getPropsForCustomUserFieldInputs(
          userFields,
          intl,
          userTypeConfig?.userType,
          false
        );

        return (
          <Form
            className={classes}
            onSubmit={e => {
              setSubmittedValues(values);
              handleSubmit(e);
            }}
          >
            <div className={classNames(css.sectionContainer)}>
              {userFieldProps.map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
            {submitError}
            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={pristineSinceLastSubmit}
            >
              <FormattedMessage id="PrivateDetailsForm.saveChanges" />
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default PrivateDetailsForm;
