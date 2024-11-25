import classNames from 'classnames';
import { bool, func, shape, string } from 'prop-types';
import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import { compose } from 'redux';

// Import configs and util modules
import { FormattedMessage, injectIntl, intlShape } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  autocompletePlaceSelected,
  autocompleteSearchRequired,
  composeValidators,
} from '../../../../util/validators';

// Import shared components
import {
  Button,
  FieldLocationAutocompleteInput,
  FieldTextInput,
  Form,
} from '../../../../components';

// Import modules from this directory
import { AddListingFields } from '../EditListingDetailsPanel/EditListingDetailsForm';
import css from './EditListingLocationForm.module.css';

const identity = v => v;

export const EditListingLocationFormComponent = props => (
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
        pickSelectedCategories,
        listingFieldsConfig,
        selectableCategories,
        values,
      } = formRenderProps;

      const [allCategoriesChosen, setAllCategoriesChosen] = useState(false);

      const { listingType, location, pub_project_type } = values;
      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingLocationForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const hasCategories = selectableCategories && selectableCategories.length > 0;

      const showListingFields = hasCategories ? allCategoriesChosen : listingType;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.showListingFailed" />
            </p>
          ) : null}

          {showListingFields ? (
            <AddListingFields
              listingType={listingType}
              listingFieldsConfig={listingFieldsConfig}
              selectedCategories={pickSelectedCategories(values)}
              formId={formId}
              intl={intl}
            />
          ) : null}

          {pub_project_type && pub_project_type !== 'online' ? (
            <FieldLocationAutocompleteInput
              rootClassName={css.locationAddress}
              inputClassName={css.locationAutocompleteInput}
              iconClassName={css.locationAutocompleteInputIcon}
              predictionsClassName={css.predictionsRoot}
              validClassName={css.validLocation}
              autoFocus={autoFocus}
              name="location"
              label={intl.formatMessage({ id: 'EditListingLocationForm.address' })}
              placeholder={intl.formatMessage({
                id: 'EditListingLocationForm.addressPlaceholder',
              })}
              useDefaultPredictions={false}
              format={identity}
              valueFromForm={location}
              validate={composeValidators(
                autocompleteSearchRequired(addressRequiredMessage),
                autocompletePlaceSelected(addressNotRecognizedMessage)
              )}
            />
          ) : null}

          {/* <FieldTextInput
            className={css.building}
            type="text"
            name="building"
            id={`${formId}building`}
            label={intl.formatMessage({ id: 'EditListingLocationForm.building' }, { optionalText })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.buildingPlaceholder',
            })}
          /> */}

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

EditListingLocationFormComponent.defaultProps = {
  selectedPlace: null,
  fetchErrors: null,
  formId: 'EditListingLocationForm',
};

EditListingLocationFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  selectedPlace: propTypes.place,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  pickSelectedCategories: func.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingLocationFormComponent);
