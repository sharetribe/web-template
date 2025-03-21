import React, { Component } from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { createResourceLocatorString } from '../../../util/routes';

import { ModalInMobile, Button } from '../../../components';

import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';
import css from './SearchFiltersMobile.module.css';

class SearchFiltersMobileComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { isFiltersOpenOnMobile: false, initialQueryParams: null };

    this.openFilters = this.openFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.closeFilters = this.closeFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);
  }

  // Open filters modal, set the initial parameters to current ones
  openFilters() {
    const { onOpenModal, urlQueryParams } = this.props;
    onOpenModal();
    this.setState({ isFiltersOpenOnMobile: true, initialQueryParams: urlQueryParams });
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    const { history, onCloseModal, routeConfiguration } = this.props;

    history.push(
      createResourceLocatorString(
        'SearchPage',
        routeConfiguration,
        {},
        this.state.initialQueryParams
      )
    );
    onCloseModal();
    this.setState({ isFiltersOpenOnMobile: false, initialQueryParams: null });
  }

  // Close the filter modal
  closeFilters() {
    this.props.onCloseModal();
    this.setState({ isFiltersOpenOnMobile: false });
  }

  // Reset all filter query parameters
  resetAll(e) {
    this.props.resetAll(e);

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  }

  render() {
    const {
      rootClassName,
      className,
      children,
      sortByComponent,
      listingsAreLoaded,
      resultsCount,
      searchInProgress = false,
      showAsModalMaxWidth,
      onMapIconClick = () => {},
      onManageDisableScrolling,
      selectedFiltersCount = 0,
      noResultsInfo,
      intl,
      isMapVariant = true,
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);

    const resultsFound = (
      <FormattedMessage id="SearchFiltersMobile.foundResults" values={{ count: resultsCount }} />
    );
    const noResults = <FormattedMessage id="SearchFiltersMobile.noResults" />;
    const loadingResults = <FormattedMessage id="SearchFiltersMobile.loadingResults" />;
    const filtersHeading = intl.formatMessage({ id: 'SearchFiltersMobile.heading' });
    const modalCloseButtonMessage = intl.formatMessage({ id: 'SearchFiltersMobile.cancel' });

    const showListingsLabel = intl.formatMessage(
      { id: 'SearchFiltersMobile.showListings' },
      { count: resultsCount }
    );

    return (
      <div className={classes}>
        <div className={css.searchResultSummary}>
          {listingsAreLoaded && resultsCount > 0 ? resultsFound : null}
          {listingsAreLoaded && resultsCount === 0 ? noResults : null}
          {searchInProgress ? loadingResults : null}
        </div>
        <div className={css.buttons}>
          <PopupOpenerButton isSelected={selectedFiltersCount > 0} toggleOpen={this.openFilters}>
            <FormattedMessage
              id="SearchFiltersMobile.filtersButtonLabel"
              className={css.mapIconText}
            />
          </PopupOpenerButton>

          {sortByComponent}
          {isMapVariant ? (
            <div className={css.mapIcon} onClick={onMapIconClick}>
              <FormattedMessage id="SearchFiltersMobile.openMapView" className={css.mapIconText} />
            </div>
          ) : null}
        </div>

        {noResultsInfo ? noResultsInfo : null}

        <ModalInMobile
          id="SearchFiltersMobile.filters"
          isModalOpenOnMobile={this.state.isFiltersOpenOnMobile}
          onClose={this.cancelFilters}
          showAsModalMaxWidth={showAsModalMaxWidth}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          closeButtonMessage={modalCloseButtonMessage}
        >
          <div className={css.modalHeadingWrapper}>
            <span className={css.modalHeading}>{filtersHeading}</span>
            <button className={css.resetAllButton} onClick={e => this.resetAll(e)}>
              <FormattedMessage id={'SearchFiltersMobile.resetAll'} />
            </button>
          </div>
          {this.state.isFiltersOpenOnMobile ? (
            <div className={css.filtersWrapper}>{children}</div>
          ) : null}

          <div className={css.showListingsContainer}>
            <Button className={css.showListingsButton} onClick={this.closeFilters}>
              {showListingsLabel}
            </Button>
          </div>
        </ModalInMobile>
      </div>
    );
  }
}

/**
 * SearchFiltersMobile component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.urlQueryParams - The URL query params
 * @param {React.Node} props.sortByComponent - The sort by component
 * @param {boolean} props.listingsAreLoaded - Whether the listings are loaded
 * @param {number} props.resultsCount - The number of results
 * @param {boolean} props.searchInProgress - Whether the search is in progress
 * @param {number} props.showAsModalMaxWidth - The maximum width of the modal
 * @param {Function} props.onMapIconClick - The function to click the map icon
 * @param {Function} props.onManageDisableScrolling - The function to manage disable scrolling
 * @param {Function} props.onOpenModal - The function to open the modal
 * @param {Function} props.onCloseModal - The function to close the modal
 * @param {Function} props.resetAll - The function to reset all
 * @param {number} props.selectedFiltersCount - The number of selected filters
 * @param {boolean} props.isMapVariant - Whether the map variant is enabled
 * @returns {JSX.Element}
 */
const SearchFiltersMobile = props => {
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  return (
    <SearchFiltersMobileComponent
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      {...props}
    />
  );
};

export default SearchFiltersMobile;
