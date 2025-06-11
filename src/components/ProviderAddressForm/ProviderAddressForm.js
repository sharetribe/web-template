import React from 'react';
import PropTypes from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import { FieldTextInput } from '../../components';

const ProviderAddressForm = ({ initialValues, onSubmit }) => (
  <FinalForm
    initialValues={initialValues}
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Save</button>
      </form>
    )}
  />
);

ProviderAddressForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

export default ProviderAddressForm; 