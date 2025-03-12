import React from 'react';
import classNames from 'classnames';

import { Field, Form as FinalForm } from 'react-final-form';

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

// idk i think this adds complexity if this isn't used more than once
// const getIndex = numberOfFields => numberOfFields - 1;

const getGridCount = numberOfFields => {
  const gridConfig = GRID_CONFIG[numberOfFields - 1];
  return gridConfig ? gridConfig.gridCss : GRID_CONFIG[0].gridCss;
};

export const SearchCTA = React.forwardRef((props, ref) => {
  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  const noSearchFields = !(categories || dateRange || keywordSearch || locationSearch);
  if (noSearchFields) {
    return null;
  }

  const handleSubmit = values => {
    console.log({ values });
  };

  // Count the number search fields that are enabled. The value is used to do something with CSS grid
  const fieldCount = [categories, dateRange, keywordSearch, locationSearch].filter(field => !!field)
    .length;

  const categoriesMaybe = categories ? <FilterCategories className={css.filterField} /> : null;
  const locationMaybe = locationSearch ? <FilterLocation className={css.filterField} /> : null;
  const keywordsMaybe = keywordSearch ? <FilterKeyword className={css.filterField} /> : null;
  const dateRangeMaybe = dateRange ? <FilterDateRange className={css.filterField} /> : null;

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCount))}>
      <FinalForm
        onSubmit={handleSubmit}
        {...props}
        render={fieldRenderProps => {
          return (
            <Form className={classNames(css.gridContainer, getGridCount(fieldCount))}>
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
