import React, { Component } from 'react';
import { func, object, shape, string } from 'prop-types';
import { Field } from 'react-final-form';
import loadable from '@loadable/component';
import { ValidationError } from '..';

// LocationAutocompleteInputImpl is a big component that includes code for both Mapbox and Google Maps
// It is loaded dynamically - i.e. it is splitted to its own code chunk.
const LocationAutocompleteInputImpl = loadable(
  () =>
    import(
      /* webpackChunkName: "LocationAutocompleteInputImpl" */ './LocationAutocompleteInputImpl'
    ),
);

class LocationAutocompleteInputComponent extends Component {
  render() {
    const { rootClassName, labelClassName, hideErrorMessage, ...restProps } = this.props;
    const { input, label, meta, valueFromForm, ...otherProps } = restProps;

    const value = typeof valueFromForm !== 'undefined' ? valueFromForm : input.value;
    const locationAutocompleteProps = { label, meta, ...otherProps, input: { ...input, value } };
    const labelInfo = label ? (
      <label className={labelClassName} htmlFor={input.name}>
        {label}
      </label>
    ) : null;

    return (
      <div className={rootClassName}>
        {labelInfo}
        <LocationAutocompleteInputImpl {...locationAutocompleteProps} />
        {hideErrorMessage ? null : <ValidationError fieldMeta={meta} />}
      </div>
    );
  }
}

LocationAutocompleteInputComponent.defaultProps = {
  rootClassName: null,
  labelClassName: null,
  type: null,
  label: null,
};

LocationAutocompleteInputComponent.propTypes = {
  rootClassName: string,
  labelClassName: string,
  input: shape({
    onChange: func.isRequired,
    name: string.isRequired,
  }).isRequired,
  label: string,
  meta: object.isRequired,
};

export default LocationAutocompleteInputImpl;

export function FieldLocationAutocompleteInput(props) {
  return <Field component={LocationAutocompleteInputComponent} {...props} />;
}
