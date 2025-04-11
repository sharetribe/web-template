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

// Shared components
import { Form, PrimaryButton } from '../../../../components';

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

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();

  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const categoryConfig = config.categoryConfiguration;

  const filters = {
    categories: {
      enabled: categories,
      isValid: () => categoryConfig.categories.length > 0,
      render: () => (
        <div className={css.filterField}>
          <FilterCategories categories={categoryConfig.categories} />
        </div>
      ),
    },
    locationSearch: {
      enabled: locationSearch,
      isValid: () => locationSearch,
      render: () => (
        <div className={css.filterField}>
          <FilterLocation setSubmitDisabled={setSubmitDisabled} />
        </div>
      ),
    },
    keywordSearch: {
      enabled: keywordSearch,
      isValid: () => keywordSearch,
      render: () => (
        <div className={css.filterField}>
          <FilterKeyword />
        </div>
      ),
    },
    dateRange: {
      enabled: dateRange,
      isValid: () => dateRange,
      render: () => (
        <div className={css.filterField}>
          <FilterDateRange config={config} />
        </div>
      ),
    },
  };

  const addFilterMaybe = key => {
    const filter = filters[key];
    return filter.enabled && filter.isValid() ? filter.render() : null;
  };

  // Count the number search fields that are enabled
  const fieldCountForGrid = Object.values(filters).filter(field => field.enabled && field.isValid())
    .length;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  if (!fieldCountForGrid) {
    return null;
  }

  const onSubmit = values => {
    // Convert form values to query parameters
    const queryParams = {};

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

    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams);
    // Use history.push to navigate without page refresh
    history.push(to);
  };

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCountForGrid))}>
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              {addFilterMaybe('categories')}
              {addFilterMaybe('locationSearch')}
              {addFilterMaybe('keywordSearch')}
              {addFilterMaybe('dateRange')}
              <PrimaryButton disabled={submitDisabled} className={css.submitButton} type="submit">
                <FormattedMessage id="SearchCTA.buttonLabel" />
              </PrimaryButton>
            </Form>
          );
        }}
      />
    </div>
  );
});

SearchCTA.displayName = 'SearchCTA';
