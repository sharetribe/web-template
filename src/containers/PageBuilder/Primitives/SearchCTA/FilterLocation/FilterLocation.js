import React, { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import { useIntl } from '../../../../../util/reactIntl';
import classNames from 'classnames';

import { LocationAutocompleteInput, IconLocation } from '../../../../../components';
import css from './FilterLocation.module.css';

const identity = v => v;

const LocationSearchField = props => {
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const { inputRootClass, intl, inputRef, onLocationChange } = props;
  return (
    <Field
      name="location"
      format={identity}
      render={({ input, meta }) => {
        const { onChange, ...restInput } = input;
        const searchOnChange = value => {
          onChange(value);
          onLocationChange(value);
          if (value?.selectedPlace && value.selectedPlace.address == '') {
            setIsCurrentLocation(true);
          } else {
            setIsCurrentLocation(false);
          }
        };

        return (
          <LocationAutocompleteInput
            className={css.customField}
            inputClassName={inputRootClass}
            closeOnBlur={true}
            predictionsClassName={css.predictions}
            CustomIcon={IconLocation}
            iconClassName={css.locationAutocompleteInputIcon}
            placeholder={
              isCurrentLocation
                ? intl.formatMessage({ id: 'SearchCTA.currentLocationPlaceholder' })
                : intl.formatMessage({ id: 'SearchCTA.locationPlaceholder' })
            }
            inputRef={inputRef}
            input={{ ...restInput, onChange: searchOnChange }}
            meta={meta}
          />
        );
      }}
    />
  );
};

const FilterLocation = props => {
  const searchInpuRef = useRef(null);
  const intl = useIntl();
  const {
    appConfig,
    onSubmit,
    setSubmitDisabled,
    className,
    rootClassName,
    ...restOfProps
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const onChange = location => {
    if (location?.search?.length > 0 && !location?.selectedPlace) {
      setSubmitDisabled(true);
    } else {
      setSubmitDisabled(false);
    }
  };

  return (
    <div className={classes}>
      <LocationSearchField
        inputRootClass={css.input}
        intl={intl}
        inputRef={searchInpuRef}
        onLocationChange={onChange}
      />
    </div>
  );
};
export default FilterLocation;
