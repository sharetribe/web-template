import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { getSavedListingIds } from '../../ducks/user.duck';

import { H3, LayoutSingleColumn, ListingCard, NamedLink, Page } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import SaveListingButton from '../SaveListingButton/SaveListingButton';

import css from './SavedListingsPage.module.css';

const RENDER_SIZES = [
  '(max-width: 549px) 100vw',
  '(max-width: 767px) 50vw',
  '(max-width: 1023px) 33vw',
  '25vw',
].join(', ');

const EmptyState = () => (
  <div className={css.emptyState}>
    <p className={css.emptyTitle}>
      <FormattedMessage id="SavedListingsPage.noResults" />
    </p>
    <p className={css.emptyHint}>
      <FormattedMessage id="SavedListingsPage.noResultsHint" />
    </p>
    <NamedLink name="SearchPage" className={css.browseLink}>
      <FormattedMessage id="SavedListingsPage.browseLink" />
    </NamedLink>
  </div>
);

/**
 * Page that lists the listings the current user has saved.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.listing>} props.listings saved listings that are still available
 * @param {boolean} props.queryInProgress
 * @param {propTypes.error?} props.queryListingsError
 * @param {boolean} props.scrollingDisabled
 * @returns {JSX.Element} saved listings page
 */
export const SavedListingsPageComponent = props => {
  const intl = useIntl();
  const { listings = [], queryInProgress, queryListingsError, scrollingDisabled } = props;

  const hasListings = listings.length > 0;
  const showEmptyState = !queryInProgress && !queryListingsError && !hasListings;

  return (
    <Page
      title={intl.formatMessage({ id: 'SavedListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="SavedListingsPage.heading" />
          </H3>

          {queryInProgress && !hasListings ? (
            <p className={css.message}>
              <FormattedMessage id="SavedListingsPage.loadingResults" />
            </p>
          ) : null}

          {queryListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="SavedListingsPage.queryError" />
            </p>
          ) : null}

          {showEmptyState ? <EmptyState /> : null}

          {hasListings ? (
            <ul className={css.listingCards}>
              {listings.map(l => (
                <li key={l.id.uuid} className={css.listingCard}>
                  <ListingCard
                    listing={l}
                    renderSizes={RENDER_SIZES}
                    actionButton={<SaveListingButton listingId={l.id.uuid} />}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { listingIds, queryInProgress, queryListingsError } = state.SavedListingsPage;
  // Hide listings as soon as they are unsaved on this page
  const savedIds = getSavedListingIds(state.user.currentUser);
  const stillSavedIds = listingIds.filter(id => savedIds.includes(id.uuid));

  return {
    listings: getListingsById(state, stillSavedIds),
    queryInProgress,
    queryListingsError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const SavedListingsPage = compose(connect(mapStateToProps))(SavedListingsPageComponent);

export default SavedListingsPage;
