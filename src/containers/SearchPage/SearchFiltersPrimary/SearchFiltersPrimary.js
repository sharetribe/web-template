import React from 'react';
import { bool, func, node, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';

import css from './SearchFiltersPrimary.module.css';

const SearchFiltersPrimaryComponent = props => {
  const {
    rootClassName,
    className,
    children,
    isSecondaryFiltersOpen,
    toggleSecondaryFiltersOpen,
    selectedSecondaryFiltersCount,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const toggleSecondaryFiltersOpenButton = toggleSecondaryFiltersOpen ? (
    <PopupOpenerButton
      isSelected={isSecondaryFiltersOpen || selectedSecondaryFiltersCount > 0}
      toggleOpen={() => {
        toggleSecondaryFiltersOpen(!isSecondaryFiltersOpen);
      }}
    >
      <FormattedMessage
        id="SearchFiltersPrimary.moreFiltersButton"
        values={{ count: selectedSecondaryFiltersCount }}
      />
    </PopupOpenerButton>
  ) : null;

  return (
    <div className={classes}>
      <div className={css.filters}>
        {children}
        {toggleSecondaryFiltersOpenButton}
      </div>
    </div>
  );
};

SearchFiltersPrimaryComponent.defaultProps = {
  rootClassName: null,
  className: null,
  isSecondaryFiltersOpen: false,
  toggleSecondaryFiltersOpen: null,
  selectedSecondaryFiltersCount: 0,
};

SearchFiltersPrimaryComponent.propTypes = {
  rootClassName: string,
  className: string,
  isSecondaryFiltersOpen: bool,
  toggleSecondaryFiltersOpen: func,
  selectedSecondaryFiltersCount: number,
};

const SearchFiltersPrimary = SearchFiltersPrimaryComponent;

export default SearchFiltersPrimary;
