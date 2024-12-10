import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage } from '../../util/reactIntl';

import { IconSpinner } from '../../components';

import IconHourGlass from './IconHourGlass';
import IconCurrentLocation from './IconCurrentLocation';
import * as geocoderMapbox from './GeocoderMapbox';
import * as geocoderGoogleMaps from './GeocoderGoogleMaps';

import css from './LocationAutocompleteInput.module.css';

const DEBOUNCE_WAIT_TIME = 300;
const DEBOUNCE_WAIT_TIME_FOR_SHORT_QUERIES = 1000;
const KEY_CODE_ARROW_UP = 38;
const KEY_CODE_ARROW_DOWN = 40;
const KEY_CODE_ENTER = 13;
const KEY_CODE_TAB = 9;
const KEY_CODE_ESC = 27;
const DIRECTION_UP = 'up';
const DIRECTION_DOWN = 'down';
const TOUCH_TAP_RADIUS = 5; // Movement within 5px from touch start is considered a tap

// Touch devices need to be able to distinguish touches for scrolling and touches to tap
const getTouchCoordinates = nativeEvent => {
  const touch = nativeEvent && nativeEvent.changedTouches ? nativeEvent.changedTouches[0] : null;
  return touch ? { x: touch.screenX, y: touch.screenY } : null;
};

// Get correct geocoding variant: geocoderGoogleMaps or geocoderMapbox
const getGeocoderVariant = mapProvider => {
  const isGoogleMapsInUse = mapProvider === 'googleMaps';
  return isGoogleMapsInUse ? geocoderGoogleMaps : geocoderMapbox;
};

// Renders the autocompletion prediction results in a list
const LocationPredictionsList = props => {
  const {
    rootClassName,
    className,
    children,
    predictions,
    currentLocationId,
    geocoder,
    isGoogleMapsInUse,
    highlightedIndex,
    onSelectStart,
    onSelectMove,
    onSelectEnd,
  } = props;
  if (predictions.length === 0) {
    return null;
  }

  const item = (prediction, index) => {
    const isHighlighted = index === highlightedIndex;
    const predictionId = geocoder.getPredictionId(prediction);

    return (
      <li
        className={isHighlighted ? css.highlighted : null}
        key={predictionId}
        onTouchStart={e => {
          e.preventDefault();
          onSelectStart(getTouchCoordinates(e.nativeEvent));
        }}
        onMouseDown={e => {
          e.preventDefault();
          onSelectStart();
        }}
        onTouchMove={e => {
          e.preventDefault();
          onSelectMove(getTouchCoordinates(e.nativeEvent));
        }}
        onTouchEnd={e => {
          e.preventDefault();
          onSelectEnd(prediction);
        }}
        onMouseUp={e => {
          e.preventDefault();
          onSelectEnd(prediction);
        }}
      >
        {predictionId === currentLocationId ? (
          <span className={css.currentLocation}>
            <IconCurrentLocation />
            <FormattedMessage id="LocationAutocompleteInput.currentLocation" />
          </span>
        ) : (
          geocoder.getPredictionAddress(prediction)
        )}
      </li>
    );
  };

  const predictionRootMapProviderClass = isGoogleMapsInUse
    ? css.predictionsRootGoogle
    : css.predictionsRootMapbox;
  const classes = classNames(
    rootClassName || css.predictionsRoot,
    predictionRootMapProviderClass,
    className
  );

  return (
    <div className={classes}>
      <ul className={css.predictions}>{predictions.map(item)}</ul>
      {children}
    </div>
  );
};

// Get the current value with defaults from the given
// LocationAutocompleteInput props.
const currentValue = props => {
  const value = props.input.value || {};
  const { search = '', predictions = [], selectedPlace = null } = value;
  return { search, predictions, selectedPlace };
};

class LocationAutocompleteInputImplementation extends Component {
  constructor(props) {
    super(props);

    this._isMounted = false;

    this.state = {
      inputHasFocus: false,
      selectionInProgress: false,
      touchStartedFrom: null,
      highlightedIndex: -1, // -1 means no highlight
      fetchingPlaceDetails: false,
      fetchingPredictions: false,
    };

    // Ref to the input element.
    this.input = null;
    this.shortQueryTimeout = null;

    this.getGeocoder = this.getGeocoder.bind(this);
    this.currentPredictions = this.currentPredictions.bind(this);
    this.changeHighlight = this.changeHighlight.bind(this);
    this.selectPrediction = this.selectPrediction.bind(this);
    this.selectItemIfNoneSelected = this.selectItemIfNoneSelected.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.handlePredictionsSelectStart = this.handlePredictionsSelectStart.bind(this);
    this.handlePredictionsSelectMove = this.handlePredictionsSelectMove.bind(this);
    this.handlePredictionsSelectEnd = this.handlePredictionsSelectEnd.bind(this);
    this.finalizeSelection = this.finalizeSelection.bind(this);

    // Debounce the method to avoid calling the API too many times
    // when the user is typing fast.
    this.predict = debounce(this.predict.bind(this), DEBOUNCE_WAIT_TIME, { leading: true });
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    window.clearTimeout(this.shortQueryTimeout);
    this._isMounted = false;
  }

  getGeocoder() {
    const geocoderVariant = getGeocoderVariant(this.props.config.maps.mapProvider);
    const Geocoder = geocoderVariant.default;

    // Create the Geocoder as late as possible only when it is needed.
    if (!this._geocoder) {
      this._geocoder = new Geocoder();
    }
    return this._geocoder;
  }

  currentPredictions() {
    const { search, predictions: fetchedPredictions } = currentValue(this.props);
    const { useDefaultPredictions = true, config } = this.props;
    const hasFetchedPredictions = fetchedPredictions && fetchedPredictions.length > 0;
    const showDefaultPredictions = !search && !hasFetchedPredictions && useDefaultPredictions;
    const geocoderVariant = getGeocoderVariant(config.maps.mapProvider);

    // A list of default predictions that can be shown when the user
    // focuses on the autocomplete input without typing a search. This can
    // be used to reduce typing and Geocoding API calls for common
    // searches.
    const defaultPredictions = (config.maps.search.suggestCurrentLocation
      ? [{ id: geocoderVariant.CURRENT_LOCATION_ID, predictionPlace: {} }]
      : []
    ).concat(config.maps.search.defaults);

    return showDefaultPredictions ? defaultPredictions : fetchedPredictions;
  }

  // Interpret input key event
  onKeyDown(e) {
    if (e.keyCode === KEY_CODE_ARROW_UP) {
      // Prevent changing cursor position in input
      e.preventDefault();
      this.changeHighlight(DIRECTION_UP);
    } else if (e.keyCode === KEY_CODE_ARROW_DOWN) {
      // Prevent changing cursor position in input
      e.preventDefault();
      this.changeHighlight(DIRECTION_DOWN);
    } else if (e.keyCode === KEY_CODE_ENTER) {
      const { selectedPlace } = currentValue(this.props);

      if (!selectedPlace) {
        // Prevent form submit, try to select value instead.
        e.preventDefault();
        e.stopPropagation();
        this.selectItemIfNoneSelected();
        this.input.blur();
      }
    } else if (e.keyCode === KEY_CODE_TAB) {
      this.selectItemIfNoneSelected();
      this.input.blur();
    } else if (e.keyCode === KEY_CODE_ESC && this.input) {
      this.input.blur();
    }
  }

  // Handle input text change, fetch predictions if the value isn't empty
  onChange(e) {
    const onChange = this.props.input.onChange;
    const predictions = this.currentPredictions();
    const newValue = e.target.value;

    // Clear the current values since the input content is changed
    onChange({
      search: newValue,
      predictions: newValue ? predictions : [],
      selectedPlace: null,
    });

    // Clear highlighted prediction since the input value changed and
    // results will change as well
    this.setState({ highlightedIndex: -1 });

    if (!newValue) {
      // No need to fetch predictions on empty input
      return;
    }

    if (newValue.length >= 3) {
      if (this.shortQueryTimeout) {
        window.clearTimeout(this.shortQueryTimeout);
      }
      this.predict(newValue);
    } else {
      this.shortQueryTimeout = window.setTimeout(() => {
        this.predict(newValue);
      }, DEBOUNCE_WAIT_TIME_FOR_SHORT_QUERIES);
    }
  }

  // Change the currently highlighted item by calculating the new
  // index from the current state and the given direction number
  // (DIRECTION_UP or DIRECTION_DOWN)
  changeHighlight(direction) {
    this.setState((prevState, props) => {
      const predictions = this.currentPredictions();
      const currentIndex = prevState.highlightedIndex;
      let index = currentIndex;

      if (direction === DIRECTION_UP) {
        // Keep the first position if already highlighted
        index = currentIndex === 0 ? 0 : currentIndex - 1;
      } else if (direction === DIRECTION_DOWN) {
        index = currentIndex + 1;
      }

      // Check that the index is within the bounds
      if (index < 0) {
        index = -1;
      } else if (index >= predictions.length) {
        index = predictions.length - 1;
      }

      return { highlightedIndex: index };
    });
  }

  // Select the prediction in the given item. This will fetch/read the
  // place details and set it as the selected place.
  selectPrediction(prediction) {
    const currentLocationBoundsDistance = this.props.config.maps?.search
      ?.currentLocationBoundsDistance;
    this.props.input.onChange({
      ...this.props.input,
      selectedPlace: null,
    });

    this.setState({ fetchingPlaceDetails: true });

    this.getGeocoder()
      .getPlaceDetails(prediction, currentLocationBoundsDistance)
      .then(place => {
        if (!this._isMounted) {
          // Ignore if component already unmounted
          return;
        }
        this.setState({ fetchingPlaceDetails: false });
        this.props.input.onChange({
          search: place.address,
          predictions: [],
          selectedPlace: place,
        });
      })
      .catch(e => {
        this.setState({ fetchingPlaceDetails: false });
        // eslint-disable-next-line no-console
        console.error(e);
        this.props.input.onChange({
          ...this.props.input.value,
          selectedPlace: null,
        });
      });
  }
  selectItemIfNoneSelected() {
    if (this.state.fetchingPredictions) {
      // No need to select anything since prediction fetch is still going on
      return;
    }

    const { search, selectedPlace } = currentValue(this.props);
    const predictions = this.currentPredictions();
    if (!selectedPlace) {
      if (predictions && predictions.length > 0) {
        const index = this.state.highlightedIndex !== -1 ? this.state.highlightedIndex : 0;
        this.selectPrediction(predictions[index]);
      } else {
        this.predict(search);
      }
    }
  }
  predict(search) {
    const config = this.props.config;
    const onChange = this.props.input.onChange;
    this.setState({ fetchingPredictions: true });

    return this.getGeocoder()
      .getPlacePredictions(search, config.maps.search.countryLimit, config.localization.locale)
      .then(results => {
        const { search: currentSearch } = currentValue(this.props);
        this.setState({ fetchingPredictions: false });

        // If the earlier predictions arrive when the user has already
        // changed the search term, ignore and wait until the latest
        // predictions arrive. Without this logic, results for earlier
        // requests would override whatever the user had typed since.
        //
        // This is essentially the same as switchLatest in RxJS or
        // takeLatest in Redux Saga, without canceling the earlier
        // requests.
        if (results.search === currentSearch) {
          onChange({
            search: results.search,
            predictions: results.predictions,
            selectedPlace: null,
          });
        }
      })
      .catch(e => {
        this.setState({ fetchingPredictions: false });
        // eslint-disable-next-line no-console
        console.error(e);
        const value = currentValue(this.props);
        onChange({
          ...value,
          selectedPlace: null,
        });
      });
  }

  finalizeSelection() {
    this.setState({ inputHasFocus: false, highlightedIndex: -1 });
    this.props.input.onBlur(currentValue(this.props));
  }

  handleOnBlur() {
    if (this.props.closeOnBlur && !this.state.selectionInProgress) {
      this.finalizeSelection();
    }
  }

  handlePredictionsSelectStart(touchCoordinates) {
    this.setState({
      selectionInProgress: true,
      touchStartedFrom: touchCoordinates,
      isSwipe: false,
    });
  }

  handlePredictionsSelectMove(touchCoordinates) {
    this.setState(prevState => {
      const touchStartedFrom = prevState.touchStartedFrom;
      const isTouchAction = !!touchStartedFrom;
      const isSwipe = isTouchAction
        ? Math.abs(touchStartedFrom.y - touchCoordinates.y) > TOUCH_TAP_RADIUS
        : false;

      return { selectionInProgress: false, isSwipe };
    });
  }

  handlePredictionsSelectEnd(prediction) {
    let selectAndFinalize = false;
    this.setState(
      prevState => {
        if (!prevState.isSwipe) {
          selectAndFinalize = true;
        }
        return { selectionInProgress: false, touchStartedFrom: null, isSwipe: false };
      },
      () => {
        if (selectAndFinalize) {
          this.selectPrediction(prediction);
          this.finalizeSelection();
        }
      }
    );
  }

  render() {
    const {
      autoFocus,
      rootClassName,
      className,
      iconClassName,
      inputClassName,
      predictionsClassName,
      predictionsAttributionClassName,
      validClassName,
      placeholder = '',
      input,
      meta,
      inputRef,
      disabled,
      config,
    } = this.props;
    const { name, onFocus } = input;
    const { search } = currentValue(this.props);
    const { touched, valid } = meta || {};
    const isValid = valid && touched;
    const predictions = this.currentPredictions();

    const handleOnFocus = e => {
      this.setState({ inputHasFocus: true });
      onFocus(e);
    };

    const rootClass = classNames(rootClassName || css.root, className);
    const iconClass = classNames(iconClassName || css.icon);
    const inputClass = classNames(inputClassName || css.input, { [validClassName]: isValid });
    const predictionsClass = classNames(predictionsClassName);

    // Only render predictions when the input has focus. For
    // development and easier workflow with the browser devtools, you
    // might want to hardcode this to `true`. Otherwise the dropdown
    // list will disappear.
    const renderPredictions = this.state.inputHasFocus;
    const geocoderVariant = getGeocoderVariant(config.maps.mapProvider);
    const GeocoderAttribution = geocoderVariant.GeocoderAttribution;
    // The first ref option in this optional chain is about callback ref,
    // which was used in previous version of this Template.
    const refMaybe =
      typeof inputRef === 'function'
        ? {
            ref: node => {
              this.input = node;
              if (inputRef) {
                inputRef(node);
              }
            },
          }
        : inputRef
        ? { ref: inputRef }
        : {};

    return (
      <div className={rootClass}>
        <div className={iconClass}>
          {this.state.fetchingPlaceDetails ? (
            <IconSpinner className={css.iconSpinner} />
          ) : (
            <IconHourGlass />
          )}
        </div>
        <input
          className={inputClass}
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          name={name}
          value={search}
          disabled={disabled || this.state.fetchingPlaceDetails}
          onFocus={handleOnFocus}
          onBlur={this.handleOnBlur}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          {...refMaybe}
          title={search}
          data-testid="location-search"
        />
        {renderPredictions ? (
          <LocationPredictionsList
            rootClassName={predictionsClass}
            predictions={predictions}
            currentLocationId={geocoderVariant.CURRENT_LOCATION_ID}
            isGoogleMapsInUse={config.maps.mapProvider === 'googleMaps'}
            geocoder={this.getGeocoder()}
            highlightedIndex={this.state.highlightedIndex}
            onSelectStart={this.handlePredictionsSelectStart}
            onSelectMove={this.handlePredictionsSelectMove}
            onSelectEnd={this.handlePredictionsSelectEnd}
          >
            <GeocoderAttribution className={predictionsAttributionClassName} />
          </LocationPredictionsList>
        ) : null}
      </div>
    );
  }
}

/**
 * @typedef {Object} SearchData
 * @property {string} search
 * @property {Object} predictions
 * @property {Object} selectedPlace
 */

/**
 * @typedef {Object} SearchData
 * @property {Object} current
 */

/**
 * Location auto completion input component
 *
 * This component can work as the `component` prop to Final Form's
 * <Field /> component. It takes a custom input value shape, and
 * controls the onChange callback that is called with the input value.
 *
 * The component works by listening to the underlying input component
 * and calling a Geocoder implementation for predictions. When the
 * predictions arrive, those are passed to Final Form in the onChange
 * callback.
 *
 * See the LocationAutocompleteInput.example.js file for a usage
 * example within a form.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.iconClassName
 * @param {string?} props.inputClassName
 * @param {string?} props.predictionsClassName
 * @param {string?} props.predictionsAttributionClassName
 * @param {string?} props.validClassName
 * @param {boolean} props.autoFocus
 * @param {boolean} props.closeOnBlur
 * @param {string?} props.placeholder
 * @param {boolean} props.useDefaultPredictions
 * @param {Object} props.input
 * @param {string} props.input.name
 * @param {string|SearchData} props.input.value
 * @param {Function} props.input.onChange
 * @param {Function} props.input.onFocus
 * @param {Function} props.input.onBlur
 * @param {Object} props.meta
 * @param {boolean} props.meta.valid
 * @param {boolean} props.meta.touched
 * @param {Function | RefHook} props.inputRef
 * @returns {JSX.Element} LocationAutocompleteInputImpl component
 */
const LocationAutocompleteInputImpl = props => {
  const config = useConfiguration();

  return <LocationAutocompleteInputImplementation config={config} {...props} />;
};

export default LocationAutocompleteInputImpl;
