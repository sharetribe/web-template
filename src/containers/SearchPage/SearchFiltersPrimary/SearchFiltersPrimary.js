import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';

import css from './SearchFiltersPrimary.module.css';

/**
 * SearchFiltersPrimary component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {React.Node} props.children - The children
 * @param {boolean} [props.isSecondaryFiltersOpen] - Whether the secondary filters are open
 * @param {Function} [props.toggleSecondaryFiltersOpen] - The function to toggle the secondary filters
 * @param {number} [props.selectedSecondaryFiltersCount] - The number of selected secondary filters
 * @returns {JSX.Element}
 */
const SearchFiltersPrimaryComponent = props => {
  const {
    rootClassName,
    className,
    children,
    isSecondaryFiltersOpen = false,
    toggleSecondaryFiltersOpen = null,
    selectedSecondaryFiltersCount = 0,
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

const SearchFiltersPrimary = SearchFiltersPrimaryComponent;

export default SearchFiltersPrimary;
