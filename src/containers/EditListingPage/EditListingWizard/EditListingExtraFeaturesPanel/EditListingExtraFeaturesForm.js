import React from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';

// Import shared components
import { Button, Form, FieldTextInput } from '../../../../components';

// Import modules from this directory
import css from './EditListingExtraFeaturesForm.module.css';


export const EditListingExtraFeaturesFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const { updateListingError, showListingsError } = fetchErrors || {};

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingExtraFeaturesForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingExtraFeaturesForm.showListingFailed" />
            </p>
          ) : null}
          <FieldTextInput
            id={`${formId}extraFeatures`}
            name="extraFeatures"
            className={css.input}
            autoFocus={autoFocus}
            type="textarea"
            label="El depósito en garantía es un monto (en pesos o dólares) que te abona el Solicitante al recibir el artículo, reembolsable si el artículo se devuelve en buen estado. Si hay daños/ pérdidas, el depósito puede retenerse para cubrir los costos y el Solicitante debe compensar lo restante. Se recomienda un monto de 2-20% del valor nuevo del artículo."
            placeholder={intl.formatMessage({ id: 'EditListingExtraFeaturesForm.extraFeaturesInputPlaceholder' })}
          />

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

EditListingExtraFeaturesFormComponent.defaultProps = {
  fetchErrors: null,
  formId: 'EditListingExtraFeaturesForm',
};

EditListingExtraFeaturesFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingExtraFeaturesFormComponent);