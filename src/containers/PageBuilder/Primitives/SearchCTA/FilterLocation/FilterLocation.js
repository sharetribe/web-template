import React, { useRef, useState, useEffect } from 'react';
import { Field } from 'react-final-form';
import { useIntl } from '../../../../../util/reactIntl';
import classNames from 'classnames';

import { LocationAutocompleteInput, IconLocation } from '../../../../../components';
import css from './FilterLocation.module.css';

const identity = v => v;

const CustomIconLocation = () => {
  return <IconLocation rootClassName={css.customIconLocation} />;
};

const LocationSearchField = props => {
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const { inputRootClass, intl, inputRef, onLocationChange, alignLeft, hasError } = props;
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
            id="location-search-filter-location"
            className={css.customField}
            useDarkText={true}
            inputClassName={classNames(
              isCurrentLocation ? css.inputWithCurrentLocation : inputRootClass,
              { [css.inputError]: hasError }
            )}
            closeOnBlur={true}
            predictionsClassName={classNames(css.predictions, {
              [css.alignLeft]: alignLeft,
            })}
            CustomIcon={CustomIconLocation}
            iconClassName={css.locationAutocompleteInputIconWrapper}
            isCurrentLocation={isCurrentLocation}
            placeholder={
              isCurrentLocation
                ? intl.formatMessage({ id: 'PageBuilder.SearchCTA.currentLocationPlaceholder' })
                : intl.formatMessage({ id: 'PageBuilder.SearchCTA.locationPlaceholder' })
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
  const searchInputRef = useRef(null);
  const intl = useIntl();
  const {
    appConfig,
    onSubmit,
    setSubmitDisabled,
    onLocationSelected,
    showError,
    onErrorClear,
    className,
    rootClassName,
    alignLeft,
    isCurrentLocation,
    ...restOfProps
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  // Focus the input and scroll it into view when error is triggered
  useEffect(() => {
    if (showError && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showError]);

  const onChange = location => {
    if (location?.search?.length > 0 && !location?.selectedPlace) {
      setSubmitDisabled(true);
      onLocationSelected?.(false);
    } else if (location?.selectedPlace) {
      setSubmitDisabled(false);
      onLocationSelected?.(true);
      onErrorClear?.();
    } else {
      // field cleared
      setSubmitDisabled(false);
      onLocationSelected?.(false);
    }
    // Clear error as soon as user starts interacting
    if (showError) {
      onErrorClear?.();
    }
  };

  return (
    <div className={classes}>
      <LocationSearchField
        inputRootClass={css.input}
        intl={intl}
        inputRef={searchInputRef}
        onLocationChange={onChange}
        alignLeft={alignLeft}
        hasError={showError}
      />
      <span className={css.requiredMark} aria-hidden="true">*</span>
      {showError ? (
        <span className={css.errorMessage} role="alert">
          {intl.formatMessage({ id: 'PageBuilder.SearchCTA.locationRequired' })}
        </span>
      ) : null}
    </div>
  );
};
export default FilterLocation;
