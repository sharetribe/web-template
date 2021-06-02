import React, { useState } from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
  required,
} from '../../../../util/validators';

// Import shared components
import {
  Form,
  LocationAutocompleteInputField,
  Button,
  FieldTextInput,
  FieldCheckbox,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingDeliveryForm.module.css';

const identity = v => v;

export const EditListingDeliveryFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        form,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        pristine,
        invalid,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
      } = formRenderProps;

      const [shippingEnabled, setShippingEnabled] = useState(
        values.deliveryOptions && values.deliveryOptions.includes('shipping')
      );
      const [pickupEnabled, setPickupEnabled] = useState(
        values.deliveryOptions && values.deliveryOptions.includes('pickup')
      );

      const titleRequiredMessage = intl.formatMessage({ id: 'EditListingDeliveryForm.address' });
      const addressPlaceholderMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressPlaceholder',
      });
      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingDeliveryForm.optionalText',
      });

      const buildingMessage = intl.formatMessage(
        { id: 'EditListingDeliveryForm.building' },
        { optionalText: optionalText }
      );
      const buildingPlaceholderMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.buildingPlaceholder',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};
      const errorMessage = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDeliveryForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDeliveryForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        invalid || disabled || submitInProgress || (!shippingEnabled && !pickupEnabled);

      const onChange = formState => {
        const { values, errors } = formState;
        const shippingSelected =
          values.deliveryOptions && values.deliveryOptions.includes('shipping');
        const pickupSelected = values.deliveryOptions && values.deliveryOptions.includes('pickup');

        setShippingEnabled(shippingSelected);
        setPickupEnabled(pickupSelected);
      };

      const shippingLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.shippingLabel' });

      const pickupLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.pickupLabel' });

      const shippingOneItemLabel = intl.formatMessage({
        id: 'EditListingDeliveryForm.shippingOneItemLabel',
      });
      const shippingAdditionalItemsLabel = intl.formatMessage({
        id: 'EditListingDeliveryForm.shippingAdditionalItemsLabel',
      });

      const pickupClasses = classNames(css.deliveryOption, !pickupEnabled ? css.disabled : null);
      const shippingClasses = classNames(
        css.deliveryOption,
        !shippingEnabled ? css.disabled : null
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FormSpy onChange={onChange} subscription={{ values: true, errors: true }} />
          <FieldCheckbox
            id="pickup"
            className={css.deliveryCheckbox}
            name="deliveryOptions"
            label={pickupLabel}
            value="pickup"
          />
          <div className={pickupClasses}>
            {errorMessage}
            {errorMessageShowListing}
            <LocationAutocompleteInputField
              disabled={!pickupEnabled}
              className={css.locationAddress}
              inputClassName={css.locationAutocompleteInput}
              iconClassName={css.locationAutocompleteInputIcon}
              predictionsClassName={css.predictionsRoot}
              validClassName={css.validLocation}
              autoFocus={autoFocus}
              name="location"
              label={titleRequiredMessage}
              placeholder={addressPlaceholderMessage}
              useDefaultPredictions={false}
              format={identity}
              valueFromForm={values.location}
              validate={
                pickupEnabled
                  ? composeValidators(
                      autocompleteSearchRequired(addressRequiredMessage),
                      autocompletePlaceSelected(addressNotRecognizedMessage)
                    )
                  : () => {}
              }
              hideErrorMessage={!pickupEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={pickupEnabled ? 'locationValidation' : 'noLocationValidation'}
            />

            <FieldTextInput
              className={css.building}
              type="text"
              name="building"
              id="building"
              label={buildingMessage}
              placeholder={buildingPlaceholderMessage}
              disabled={!pickupEnabled}
            />
          </div>
          <FieldCheckbox
            id="shipping"
            className={css.deliveryCheckbox}
            name="deliveryOptions"
            label={shippingLabel}
            value="shipping"
          />

          <div className={shippingClasses}>
            <FieldTextInput
              className={css.building}
              type="text"
              name="shippingOneItem"
              id="shippingOneItem"
              label={shippingOneItemLabel}
              placeholder={buildingPlaceholderMessage}
              disabled={!shippingEnabled}
              validate={
                shippingEnabled
                  ? required(
                      intl.formatMessage({
                        id: 'EditListingDeliveryForm.shippingOneItemRequired',
                      })
                    )
                  : () => {}
              }
              hideErrorMessage={!shippingEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={shippingEnabled ? 'oneItemValidation' : 'noOneItemValidation'}
            />
            <FieldTextInput
              className={css.building}
              type="text"
              name="shippingAdditionalItems"
              id="shippingAdditionalItems"
              label={shippingAdditionalItemsLabel}
              placeholder={buildingPlaceholderMessage}
              disabled={!shippingEnabled}
              validate={
                shippingEnabled
                  ? required(
                      intl.formatMessage({
                        id: 'EditListingDeliveryForm.shippingAdditionalItemsRequired',
                      })
                    )
                  : null
              }
              hideErrorMessage={!shippingEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={shippingEnabled ? 'additionalItemsValidation' : 'noAdditionalItemsValidation'}
            />
          </div>

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

EditListingDeliveryFormComponent.defaultProps = {
  selectedPlace: null,
  fetchErrors: null,
};

EditListingDeliveryFormComponent.propTypes = {
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  selectedPlace: propTypes.place,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingDeliveryFormComponent);
