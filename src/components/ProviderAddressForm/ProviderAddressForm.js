import React from 'react';
import PropTypes from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import { FieldTextInput } from '../../components';
import css from './ProviderAddressForm.module.css';

const ProviderAddressForm = ({ initialValues, onChange }) => (
  <div className={css.root}>
    <h3 className={css.title}>Provider Address Information</h3>
    <p className={css.description}>
      Please fill out your address information below. This information will be used when you accept the request.
    </p>
    <FinalForm
      initialValues={initialValues}
      onSubmit={() => {}}
      render={({ handleSubmit, values }) => {
        React.useEffect(() => {
          console.log('[ProviderAddressForm] values:', values);
          if (onChange) {
            onChange(values);
          }
        }, [values, onChange]);

        return (
          <form onSubmit={handleSubmit} className={css.form}>
            <FieldTextInput
              id="streetAddress"
              name="streetAddress"
              label="Street Address"
              placeholder="Enter street address"
              required
            />
            <FieldTextInput
              id="city"
              name="city"
              label="City"
              placeholder="Enter city"
              required
            />
            <FieldTextInput
              id="state"
              name="state"
              label="State"
              placeholder="Enter state"
              required
            />
            <FieldTextInput
              id="zipCode"
              name="zipCode"
              label="ZIP Code"
              placeholder="Enter ZIP code"
              required
            />
            <FieldTextInput
              id="phoneNumber"
              name="phoneNumber"
              label="Phone Number"
              placeholder="Enter phone number"
              required
            />
          </form>
        );
      }}
    />
  </div>
);

ProviderAddressForm.propTypes = {
  initialValues: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

export default ProviderAddressForm; 