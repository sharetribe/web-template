import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import { useHistory } from 'react-router-dom';

// Contexts
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { useConfiguration } from '../../../../context/configurationContext';

// Utility
import { FormattedMessage } from '../../../../util/reactIntl';
import { createResourceLocatorString } from '../../../../util/routes';
import { isOriginInUse } from '../../../../util/search';
import { stringifyDateToISO8601 } from '../../../../util/dates';

// Shared components
import { Form, PrimaryButton } from '../../../../components';
import GeocoderGoogleMaps, {
  CURRENT_LOCATION_ID as GOOGLE_CURRENT_LOCATION_ID,
} from '../../../../components/LocationAutocompleteInput/GeocoderGoogleMaps';
import GeocoderMapbox, {
  CURRENT_LOCATION_ID as MAPBOX_CURRENT_LOCATION_ID,
} from '../../../../components/LocationAutocompleteInput/GeocoderMapbox';

import FilterCategories from './FilterCategories/FilterCategories';
import FilterDateRange from './FilterDateRange/FilterDateRange';
import FilterLocation from './FilterLocation/FilterLocation';
import FilterKeyword from './FilterKeyword/FilterKeyword';

import css from './SearchCTA.module.css';

const GRID_CONFIG = [
  { gridCss: css.gridCol1 },
  { gridCss: css.gridCol2 },
  { gridCss: css.gridCol3 },
  { gridCss: css.gridCol4 },
];

const getGridCount = numberOfFields => {
  const gridConfig = GRID_CONFIG[numberOfFields - 1];
  return gridConfig ? gridConfig.gridCss : GRID_CONFIG[0].gridCss;
};

const isEmpty = value => {
  if (value == null) return true;
  return value.hasOwnProperty('length') && value.length === 0;
};

const formatDateValue = (dateRange, queryParamName) => {
  const hasDates = dateRange;
  const { startDate, endDate } = hasDates ? dateRange : {};
  const start = startDate ? stringifyDateToISO8601(startDate) : null;
  const end = endDate ? stringifyDateToISO8601(endDate) : null;
  const value = start && end ? `${start},${end}` : null;
  return { [queryParamName]: value };
};

const getCurrentLocationPlace = config => {
  const isGoogleMapsInUse = config.maps.mapProvider === 'googleMaps';
  const Geocoder = isGoogleMapsInUse ? GeocoderGoogleMaps : GeocoderMapbox;
  const currentLocationId = isGoogleMapsInUse
    ? GOOGLE_CURRENT_LOCATION_ID
    : MAPBOX_CURRENT_LOCATION_ID;

  const currentLocationBoundsDistance = config.maps?.search?.currentLocationBoundsDistance;
  const geocoder = new Geocoder();

  return geocoder.getPlaceDetails(
    { id: currentLocationId, predictionPlace: {} },
    currentLocationBoundsDistance
  );
};

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const formApiRef = useRef(null);

  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const categoryConfig = config.categoryConfiguration;

  const navigateToSearch = values => {
    let queryParams = {};

    Object.entries(values).forEach(([key, value]) => {
      if (!isEmpty(value)) {
        if (key == 'dateRange') {
          const { dates } = formatDateValue(value, 'dates');
          queryParams.dates = dates;
        } else if (key == 'location') {
          if (value.selectedPlace) {
            const {
              search,
              selectedPlace: { origin, bounds },
            } = value;

            queryParams.bounds = bounds;
            queryParams.address = search;

            if (isOriginInUse(config) && origin) {
              queryParams.origin = `${origin.lat},${origin.lng}`;
            }
          }
        } else {
          queryParams[key] = value;
        }
      }
    });

    const to = createResourceLocatorString(
      'SearchPage',
      routeConfiguration,
      {},
      queryParams
    );

    history.push(to);
  };

  const onLocationSelected = location => {
    const currentValues = formApiRef.current?.getState()?.values || {};
    navigateToSearch({
      ...currentValues,
      location,
    });
  };

  const filters = {
    categories: {
      enabled: categories,
      isValid: () => categoryConfig.categories.length > 0,
      render: alignLeft => (
        <div className={css.filterField} key="categories">
          <FilterCategories
            categories={categoryConfig.categories}
            alignLeft={alignLeft}
          />
        </div>
      ),
    },

    keywordSearch: {
      enabled: keywordSearch,
      isValid: () => keywordSearch,
      render: alignLeft => (
        <div className={css.filterField} key="keywordSearch">
          <FilterKeyword />
        </div>
      ),
    },

    locationSearch: {
      enabled: locationSearch,
      isValid: () => locationSearch,
      render: alignLeft => (
        <div className={css.filterField} key="locationSearch">
          <FilterLocation
            setSubmitDisabled={setSubmitDisabled}
            onLocationSelected={onLocationSelected}
            alignLeft={alignLeft}
          />
        </div>
      ),
    },

    dateRange: {
      enabled: dateRange,
      isValid: () => dateRange,
      render: alignLeft => (
        <div className={css.filterField} key="dateRange">
          <FilterDateRange config={config} alignLeft={alignLeft} />
        </div>
      ),
    },
  };

  const addFilters = filterOrder => {
    const enabledFilters = filterOrder.filter(
      key => filters[key]?.enabled && filters[key]?.isValid()
    );

    const totalEnabled = enabledFilters.length;

    return enabledFilters.map((key, index) => {
      const filter = filters[key];
      const isLast = index === totalEnabled - 1;
      const alignLeft = totalEnabled === 1 || !isLast;

      return filter.enabled && filter.isValid()
        ? filter.render(alignLeft)
        : null;
    });
  };

  const fieldCountForGrid = Object.values(filters).filter(
    field => field.enabled && field.isValid()
  ).length;

  if (!fieldCountForGrid) {
    return null;
  }

  const onSubmit = async values => {
    const hasSelectedLocation = values?.location?.selectedPlace;

    // GPS-15:
    // If Search is pressed without a selected address,
    // use current location directly.
    if (locationSearch && !hasSelectedLocation) {
      setSubmitDisabled(true);

      try {
        const place = await getCurrentLocationPlace(config);

        const location = {
          search: place.address,
          predictions: [],
          selectedPlace: place,
        };

        navigateToSearch({
          ...values,
          location,
        });
      } catch (e) {
        // Permission denied, timeout or geolocation unavailable:
        // stay on the Hero so the user can enter an address manually.
        console.error(e);
        setSubmitDisabled(false);
      }

      return;
    }

    navigateToSearch(values);
  };

  return (
    <div
      className={classNames(
        css.searchBarContainer,
        getGridCount(fieldCountForGrid)
      )}
    >
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        render={({ fieldRenderProps, handleSubmit, form }) => {
          formApiRef.current = form;

          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              className={classNames(
                css.gridContainer,
                getGridCount(fieldCountForGrid)
              )}
            >
              {addFilters([
                'categories',
                'keywordSearch',
                'locationSearch',
                'dateRange',
              ])}

              <PrimaryButton
                disabled={submitDisabled}
                className={css.submitButton}
                type="submit"
              >
                <FormattedMessage id="PageBuilder.SearchCTA.buttonLabel" />
              </PrimaryButton>
            </Form>
          );
        }}
      />
    </div>
  );
});

SearchCTA.displayName = 'SearchCTA';
