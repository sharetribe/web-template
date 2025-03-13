import React from 'react';
import classNames from 'classnames';
import { Field, Form as FinalForm } from 'react-final-form';
import { stringify } from 'query-string';
import { useHistory } from 'react-router-dom';
import { createResourceLocatorString } from '../../../../util/routes';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';

import FilterCategories from './FilterCategories';
import FilterDateRange from './FilterDateRange';
import FilterLocation from './FilterLocation';
import FilterKeyword from './FilterKeyword';
import { Button, Form } from '../../../../components';

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

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  const noSearchFields = !(categories || dateRange || keywordSearch || locationSearch);
  if (noSearchFields) {
    return null;
  }

  const onSubmit = values => {
    // Convert form values to query parameters
    const queryParams = {};

    // WIP
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          queryParams[key] = value;
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue) {
              queryParams[`${key}_${subKey}`] = subValue;
            }
          });
        } else {
          queryParams[key] = value;
        }
      }
    });

    // Create search string
    const searchString = stringify(queryParams);

    // Use history.push to navigate without page refresh
    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, {});
    history.push(`${to}${searchString ? `?${searchString}` : ''}`);
  };

  // Count the number search fields that are enabled
  const fieldCount = [categories, dateRange, keywordSearch, locationSearch].filter(field => !!field)
    .length;

  const categoriesMaybe = categories ? (
    <div className={css.filterField}>
      <FilterCategories />
    </div>
  ) : null;
  const locationMaybe = locationSearch ? (
    <div className={css.filterField}>
      <FilterLocation />
    </div>
  ) : null;
  const keywordsMaybe = keywordSearch ? (
    <div className={css.filterField}>
      <FilterKeyword />
    </div>
  ) : null;
  const dateRangeMaybe = dateRange ? (
    <div className={css.filterField}>
      <FilterDateRange />
    </div>
  ) : null;

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCount))}>
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              onSubmit={handleSubmit}
              className={classNames(css.gridContainer, getGridCount(fieldCount))}
            >
              {categoriesMaybe}
              {keywordsMaybe}
              {locationMaybe}
              {dateRangeMaybe}
              <Button className={css.submitButton} type="submit">
                Search
              </Button>
            </Form>
          );
        }}
      />
    </div>
  );
});

SearchCTA.displayName = 'SearchCTA';
