import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import { useHistory } from 'react-router-dom';
import { createResourceLocatorString } from '../../../../util/routes';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { useConfiguration } from '../../../../context/configurationContext';
import { FormattedMessage } from '../../../../util/reactIntl';

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

const isEmpty = value => {
  const isNullish = value == null;
  const isZeroLength = value.hasOwnProperty('length') && value.length === 0;
  return isNullish || isZeroLength;
};

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  const noSearchFields = isEmpty(
    [categories, dateRange, keywordSearch, locationSearch].filter(f => !isEmpty(f))
  );
  if (noSearchFields) {
    return null;
  }

  const onSubmit = values => {
    // Convert form values to query parameters
    const queryParams = {};

    Object.entries(values).forEach(([key, value]) => {
      if (!isEmpty(value)) {
        queryParams[key] = value;
      }
    });

    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams);
    // Use history.push to navigate without page refresh
    history.push(to);
  };

  const config = useConfiguration();
  const categoryConfig = config.categoryConfiguration;

  // Count the number search fields that are enabled
  const fieldCount = [categories, dateRange, keywordSearch, locationSearch].filter(field => !!field)
    .length;

  // conditional; even if categories are enabled, we won't render categories if none are present. So need to do a bit of calculations here
  const fieldCountForGrid = categoryConfig.categories.length > 0 ? fieldCount : fieldCount - 1;

  // categoriesMaybe also checks if any categories are specified
  const categoriesMaybe =
    categories && categoryConfig.categories.length > 0 ? (
      <div className={css.filterField}>
        {/* <FilterCategories categories={categoryConfig.categories}/> */}
      </div>
    ) : null;
  const locationMaybe = locationSearch ? (
    <div className={css.filterField}>{/* <FilterLocation /> */}</div>
  ) : null;
  const keywordsMaybe = keywordSearch ? (
    <div className={css.filterField}>{<FilterKeyword />}</div>
  ) : null;
  const dateRangeMaybe = dateRange ? (
    <div className={css.filterField}>{/* <FilterDateRange /> */}</div>
  ) : null;

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCountForGrid))}>
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              onSubmit={handleSubmit}
              className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              {categoriesMaybe}
              {keywordsMaybe}
              {locationMaybe}
              {dateRangeMaybe}
              <Button className={css.submitButton} type="submit">
                <FormattedMessage id="SearchCTA.ButtonLabel" />
              </Button>
            </Form>
          );
        }}
      />
    </div>
  );
});

SearchCTA.displayName = 'SearchCTA';
