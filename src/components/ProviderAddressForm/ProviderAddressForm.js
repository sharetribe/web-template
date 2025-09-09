import React from 'react';
import PropTypes from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import { FieldTextInput } from '../../components';
import css from './ProviderAddressForm.module.css';

const ProviderAddressForm = ({ initialValues, onChange }) => (
  <div className={css.root}>
    <h3 className={css.title}>Lender Shipping Address</h3>
    <p className={css.description}>
    Please provide your shipping address. This ensures your item makes it back to you smoothly after each borrow.
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
              label="Street *"
              placeholder="123 Main St"
              required
            />
            <FieldTextInput
              id="streetAddress2"
              name="streetAddress2"
              label="Street (line 2)"
              placeholder="123"
            />
            <FieldTextInput
              id="city"
              name="city"
              label="City *"
              placeholder="San Francisco"
              required
            />
            <FieldTextInput
              id="state"
              name="state"
              label="State *"
              placeholder="California"
              required
            />
            <FieldTextInput
              id="zipCode"
              name="zipCode"
              label="Postal code / zip *"
              placeholder="94123-2935"
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