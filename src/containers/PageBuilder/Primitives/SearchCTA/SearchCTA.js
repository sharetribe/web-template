import React, { useState } from 'react';
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
import { types as sdkTypes } from '../../../../util/sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;
const STORAGE_KEY = 'patamali_last_search';

const saveSearchToStorage = values => {
  try {
    const toSave = {};
    if (values.location?.selectedPlace) {
      toSave.location = values.location;
    }
    if (values.dateRange?.startDate && values.dateRange?.endDate) {
      toSave.dateRange = {
        startDate: values.dateRange.startDate.toISOString(),
        endDate: values.dateRange.endDate.toISOString(),
      };
    }
    if (values.price) {
      toSave.price = values.price;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {}
};

const loadSearchFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    const result = {};
    if (saved.location?.selectedPlace) {
      const sp = saved.location.selectedPlace;
      const bounds = sp.bounds
        ? new LatLngBounds(
            new LatLng(sp.bounds.ne.lat, sp.bounds.ne.lng),
            new LatLng(sp.bounds.sw.lat, sp.bounds.sw.lng)
          )
        : null;
      const origin = sp.origin ? new LatLng(sp.origin.lat, sp.origin.lng) : null;
      result.location = {
        search: saved.location.search,
        selectedPlace: { ...sp, bounds, origin },
      };
    }
    if (saved.dateRange) {
      const startDate = new Date(saved.dateRange.startDate);
      const endDate = new Date(saved.dateRange.endDate);
      // Only restore dates if start date is still in the future
      if (startDate > new Date()) {
        result.dateRange = { startDate, endDate };
      }
    }
    if (saved.price) {
      result.price = saved.price;
    }
    return result;
  } catch (e) {
    return {};
  }
};

// Shared components
import { Form, PrimaryButton } from '../../../../components';

import FilterCategories from './FilterCategories/FilterCategories';
import FilterDateRange from './FilterDateRange/FilterDateRange';
import FilterLocation from './FilterLocation/FilterLocation';
import FilterKeyword from './FilterKeyword/FilterKeyword';
import FilterBudget, { PRICE_MIN, PRICE_MAX } from './FilterBudget/FilterBudget';

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

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();

  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;
  // keywordSearch slot is repurposed for the monthly budget filter
  const budget = keywordSearch;

  const [storedSearch] = useState(() => loadSearchFromStorage());
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [locationSelected, setLocationSelected] = useState(!!storedSearch.location?.selectedPlace);
  const [locationError, setLocationError] = useState(false);

  const categoryConfig = config.categoryConfiguration;

  const filters = {
    categories: {
      enabled: categories,
      isValid: () => categoryConfig.categories.length > 0,
      render: alignLeft => (
        <div className={css.filterField} key="categories">
          <FilterCategories categories={categoryConfig.categories} alignLeft={alignLeft} />
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
    budget: {
      enabled: budget,
      isValid: () => budget,
      render: alignLeft => (
        <div className={css.filterField} key="budget">
          <FilterBudget alignLeft={alignLeft} />
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
            onLocationSelected={setLocationSelected}
            showError={locationError}
            onErrorClear={() => setLocationError(false)}
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

      return filter.enabled && filter.isValid() ? filter.render(alignLeft) : null;
    });
  };

  // Count the number search fields that are enabled (excluding keywordSearch since budget replaces it)
  const countableFilters = ['categories', 'locationSearch', 'dateRange', 'budget'];
  const fieldCountForGrid = countableFilters.filter(
    key => filters[key]?.enabled && filters[key]?.isValid()
  ).length;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  if (!fieldCountForGrid) {
    return null;
  }

  const onSubmit = values => {
    // Require location before proceeding
    if (locationSearch && !locationSelected) {
      setLocationError(true);
      return;
    }

    // Convert form values to query parameters
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
        } else if (key === 'price') {
          const { minValue = PRICE_MIN, maxValue = PRICE_MAX } = value || {};
          const isDefault = minValue === PRICE_MIN && maxValue === PRICE_MAX;
          if (!isDefault) {
            // Store monthly values directly in URL
            queryParams.price = `${minValue},${maxValue}`;
          }
        } else {
          queryParams[key] = value;
        }
      }
    });

    saveSearchToStorage(values);
    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams);
    history.push(to);
  };

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCountForGrid))}>
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        initialValues={{ ...storedSearch, ...(props.initialValues || {}) }}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              {addFilters(['categories', 'locationSearch', 'dateRange', 'budget'])}

              <PrimaryButton disabled={submitDisabled} className={css.submitButton} type="submit">
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
