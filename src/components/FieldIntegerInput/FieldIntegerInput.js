/**
 * A text field with phone number formatting. By default uses formatting
 * rules defined in the fiFormatter.js file. To change the formatting
 * provide alternative implementations for the format and parse functions
 * that are passed to the input field.
 */
import React from 'react';

import { FieldTextInput } from '../../components';

const FieldPhoneNumberInput = props => {
  const inputProps = {
    type: 'text',
    ...props,
  };

  return <FieldTextInput {...inputProps} />;
};

export default FieldPhoneNumberInput;
