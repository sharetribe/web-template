import { func, string } from 'prop-types';
import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { Form as FinalForm, Field } from 'react-final-form';

import { useConfiguration } from '../../../context/configurationContext';
import { intlShape, injectIntl } from '../../../util/reactIntl';
import { isOriginInUse } from '../../../util/search';
import { parse } from '../../../util/urlHelpers';

import { Form, LocationAutocompleteInput } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import css from './LocationFilter.module.css';

const identity = v => v;

function LocationFilter(props) {
  const config = useConfiguration();
  const { label, onSubmit, location } = props;

  const { address, origin, bounds } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  const topbarSearcInitialValues = () => {
    // Only render current search if full place object is available in the URL params
    const locationFieldsPresent = isOriginInUse(config)
      ? address && origin && bounds
      : address && bounds;
    return {
      location: locationFieldsPresent
        ? {
            search: address,
            selectedPlace: { address, origin, bounds },
          }
        : null,
    };
  };
  const initialValues = topbarSearcInitialValues();
  const hasInitialValues = !!initialValues?.location;
  const labelClass = hasInitialValues ? css.labelPlainSelected : css.labelPlain;
  const labelForPlain = <span className={labelClass}>{label}</span>;

  const handleSubmit = values => {
    const locationSearchParams = () => {
      const withLocation = !!values?.location;
      if (withLocation) {
        const { search, selectedPlace } = values?.location;
        const { origin, bounds } = selectedPlace;
        const originMaybe = isOriginInUse(config) ? { origin } : {};
        return {
          ...originMaybe,
          address: search,
          bounds,
        };
      }
      return {
        origin: null,
        address: null,
        bounds: null,
      };
    };
    const params = locationSearchParams();
    onSubmit(params);
  };

  return (
    <FinalForm
      {...props}
      onSubmit={identity}
      initialValues={initialValues}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          id,
          name,
          label,
          onSubmit,
          intl,
          values,
          ...rest
        } = fieldRenderProps;
        // Location search: allow form submit only when the place has changed
        const preventFormSubmit = e => e.preventDefault();
        return (
          <Form onSubmit={preventFormSubmit}>
            <Field
              name={name}
              format={identity}
              render={({ input, meta }) => {
                function onChangeHandler(location) {
                  input.onChange(location);
                  const validLocation = !!location?.selectedPlace;
                  if (validLocation) {
                    handleSubmit({ location });
                  }
                }
                const handleClear = () => {
                  input.onChange(undefined);
                  handleSubmit({ location: undefined });
                };
                const fieldProps = { input: { ...input, onChange: onChangeHandler }, meta };
                return (
                  <FilterPlain
                    id={`${id}.plain`}
                    className={className}
                    rootClassName={rootClassName}
                    label={labelForPlain}
                    onSubmit={identity}
                    isSelected={hasInitialValues}
                    onClear={handleClear}
                    {...rest}
                    liveEdit
                    noForm
                  >
                    <div className={css.fieldPlain}>
                      <LocationAutocompleteInput
                        inputClassName={css.locationAutocompleteInput}
                        iconClassName={css.locationAutocompleteInputIcon}
                        predictionsClassName={css.predictionsRoot}
                        validClassName={css.validLocation}
                        placeholder={intl.formatMessage({
                          id: 'ConfirmSignupForm.addressPlaceholder',
                        })}
                        useDefaultPredictions={false}
                        {...fieldProps}
                      />
                    </div>
                  </FilterPlain>
                );
              }}
            />
          </Form>
        );
      }}
    />
  );
}

LocationFilter.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  name: string.isRequired,
  label: string.isRequired,
  onSubmit: func.isRequired,

  // form injectIntl
  intl: intlShape.isRequired,
};

export default compose(withRouter, injectIntl)(LocationFilter);
