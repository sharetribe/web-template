import React from 'react';
import PropTypes from 'prop-types';
import { FieldTextInput } from '../../components';

const ProviderAddressForm = ({ values, onChange }) => {
  const handleInputChange = e => {
    const { name, value } = e.target;
    onChange({ ...values, [name]: value });
  };

  return (
    <form>
      <FieldTextInput
        id="streetAddress"
        name="streetAddress"
        label="Street Address"
        placeholder="Enter street address"
        value={values.streetAddress}
        onChange={handleInputChange}
        required
      />
      <FieldTextInput
        id="city"
        name="city"
        label="City"
        placeholder="Enter city"
        value={values.city}
        onChange={handleInputChange}
        required
      />
      <FieldTextInput
        id="state"
        name="state"
        label="State"
        placeholder="Enter state"
        value={values.state}
        onChange={handleInputChange}
        required
      />
      <FieldTextInput
        id="zipCode"
        name="zipCode"
        label="ZIP Code"
        placeholder="Enter ZIP code"
        value={values.zipCode}
        onChange={handleInputChange}
        required
      />
      <FieldTextInput
        id="phoneNumber"
        name="phoneNumber"
        label="Phone Number"
        placeholder="Enter phone number"
        value={values.phoneNumber}
        onChange={handleInputChange}
        required
      />
    </form>
  );
};

ProviderAddressForm.propTypes = {
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ProviderAddressForm; 