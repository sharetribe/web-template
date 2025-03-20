import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import { InlineTextButton } from '../../../components';

import css from './SearchFiltersSecondary.module.css';

/**
 * SearchFiltersSecondary component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.urlQueryParams - The URL query params
 * @param {Function} props.applyFilters - The function to apply the filters
 * @param {Function} props.resetAll - The function to reset all
 * @param {Function} props.onClosePanel - The function to close the panel
 * @returns {JSX.Element}
 */
class SearchFiltersSecondaryComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { currentQueryParams: props.urlQueryParams };

    this.applyFilters = this.applyFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);
  }

  // Apply the filters by redirecting to SearchPage with new filters.
  applyFilters() {
    const { applyFilters, onClosePanel } = this.props;

    if (applyFilters) {
      applyFilters();
    }

    // Ensure that panel closes (if now changes have been made)
    onClosePanel();
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    const { cancelFilters } = this.props;

    if (cancelFilters) {
      cancelFilters();
    }

    this.props.onClosePanel();
  }

  // Reset all filter query parameters
  resetAll(e) {
    const { resetAll, onClosePanel } = this.props;

    if (resetAll) {
      resetAll(e);
    }

    // Ensure that panel closes (if now changes have been made)
    onClosePanel();

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  }

  render() {
    const { rootClassName, className, children } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <div className={css.filtersWrapper}>{children}</div>
        <div className={css.footer}>
          <InlineTextButton rootClassName={css.resetAllButton} onClick={this.resetAll}>
            <FormattedMessage id={'SearchFiltersSecondary.resetAll'} />
          </InlineTextButton>
          <InlineTextButton rootClassName={css.cancelButton} onClick={this.cancelFilters}>
            <FormattedMessage id={'SearchFiltersSecondary.cancel'} />
          </InlineTextButton>
          <InlineTextButton rootClassName={css.applyButton} onClick={this.applyFilters}>
            <FormattedMessage id={'SearchFiltersSecondary.apply'} />
          </InlineTextButton>
        </div>
      </div>
    );
  }
}

const SearchFiltersSecondary = SearchFiltersSecondaryComponent;

export default SearchFiltersSecondary;
