import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { parse } from '../../util/urlHelpers';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

import { LayoutSingleColumn, ListingCard, NamedLink, Page } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import SaveListingButton from '../SaveListingButton/SaveListingButton';
import FilterComponent from '../SearchPage/FilterComponent';
import FilterDrawer from '../SearchPage/FilterDrawer/FilterDrawer';

import {
  SORT_OPTIONS,
  createStartingState,
  decodeState,
  encodeState,
  normalizeSearchParams,
  removeFilter,
  removePreference,
  requestKey,
  toUrlParams,
  toggleLockFilter,
  undoRelaxation,
} from './SmartSearchPage.helpers';
import {
  applyDrawerChange,
  clearAllFilters,
  getSmartSearchDrawerFilters,
  stateToDrawerParams,
} from './SmartSearchFilters';
import css from './SmartSearchPage.module.css';

const RENDER_SIZES = [
  '(max-width: 549px) 100vw',
  '(max-width: 767px) 50vw',
  '(max-width: 1023px) 33vw',
  '25vw',
].join(', ');

// Translation keys of the example searches on the empty page
const EXAMPLE_SEARCH_IDS = [
  'SmartSearchPage.example1',
  'SmartSearchPage.example2',
  'SmartSearchPage.example3',
];

// Filter changes in the drawer are sent together once the buyer stops clicking for this long,
// so a few quick clicks make one smart search request instead of many
const DRAWER_CHANGE_DELAY_MS = 600;

const ERROR_MESSAGE_IDS = {
  INVALID_REQUEST: 'SmartSearchPage.errorInvalidRequest',
  QUERY_TOO_LONG: 'SmartSearchPage.errorQueryTooLong',
  RATE_LIMITED: 'SmartSearchPage.errorRateLimited',
  UPSTREAM_ERROR: 'SmartSearchPage.errorUnavailable',
  INTERNAL_ERROR: 'SmartSearchPage.errorUnavailable',
};

const PinIcon = () => (
  <svg className={css.chipIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9 3h6l-1 6 4 4H6l4-4-1-6zM12 13v8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className={css.chipIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const ResultSection = ({ titleId, listings, resultMeta }) =>
  listings.length > 0 ? (
    <section className={css.resultSection}>
      <h2 className={css.resultSectionTitle}>
        <FormattedMessage id={titleId} />
      </h2>
      <ul className={css.listingCards}>
        {listings.map(l => {
          const reason = resultMeta[l.id.uuid]?.reason;
          return (
            <li key={l.id.uuid} className={css.listingCard}>
              <ListingCard
                listing={l}
                renderSizes={RENDER_SIZES}
                actionButton={<SaveListingButton listingId={l.id.uuid} />}
              />
              {reason ? <p className={css.reason}>{reason}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  ) : null;

/**
 * Smart search page: the buyer describes what they want, the smart search backend returns
 * filters, preferences and ranked listings (see Hackthon_case/CONTRACT.md).
 *
 * @component
 * @returns {JSX.Element} smart search page
 */
const SmartSearchPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const routes = useRouteConfiguration();
  const history = useHistory();
  const location = useLocation();

  const pageState = useSelector(state => state.SmartSearchPage);
  const listings = useSelector(state => getListingsById(state, state.SmartSearchPage.resultIds));
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));
  const dispatch = useDispatch();
  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );
  const {
    searchInProgress,
    searchError,
    searchState,
    resultMeta,
    relaxation,
    notices,
    total,
    page,
    totalPages,
    sort,
    responseUrlKey,
  } = pageState;

  const urlParams = normalizeSearchParams(parse(location.search));
  const [text, setText] = useState(urlParams.q || '');
  // Filters picked before the first search are sent with it as a starting state
  const [draftState, setDraftState] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Drawer changes that are shown already but wait for the next request (or its response)
  const [pendingState, setPendingState] = useState(null);
  const unsentStateRef = useRef(null);
  const sendTimerRef = useRef(null);

  const goTo = (params, replace = false) => {
    const path = createResourceLocatorString('SmartSearchPage', routes, {}, toUrlParams(params));
    replace ? history.replace(path) : history.push(path);
  };

  // After each response, keep the new state in the URL so the search survives reloads
  useEffect(() => {
    if (!searchState || !responseUrlKey || searchInProgress) {
      return;
    }
    if (requestKey(urlParams) !== responseUrlKey) {
      goTo({ s: encodeState(searchState), page, sort }, true);
    }
  }, [responseUrlKey]);

  // The last state from the backend; it is sent back with every new request
  const currentState = searchState || decodeState(urlParams.s);
  const currentS = encodeState(currentState);
  const currentSort = sort || urlParams.sort;
  // Chips are edited on the backend state, or on the starting state before the first search
  const editableState = pendingState || currentState || draftState || createStartingState();

  // A new state from the backend replaces the changes that were waiting for it
  useEffect(() => {
    setPendingState(null);
  }, [searchState]);
  useEffect(() => () => window.clearTimeout(sendTimerRef.current), []);

  const search = q => {
    const trimmed = (q || '').trim();
    if (trimmed) {
      const s = currentState ? currentS : encodeState(draftState);
      goTo({ q: trimmed, s, page: 1, sort: currentSort });
    }
  };
  const updateState = nextState => {
    window.clearTimeout(sendTimerRef.current);
    unsentStateRef.current = null;
    if (currentState) {
      goTo({ s: encodeState(nextState), page: 1, sort: currentSort });
    } else {
      setDraftState(nextState);
      setPendingState(null);
    }
  };
  // Show a change right away, send it after a short pause
  const updateStateSoon = nextState => {
    setPendingState(nextState);
    unsentStateRef.current = nextState;
    window.clearTimeout(sendTimerRef.current);
    sendTimerRef.current = window.setTimeout(() => updateState(nextState), DRAWER_CHANGE_DELAY_MS);
  };
  const closeFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
    if (unsentStateRef.current) {
      updateState(unsentStateRef.current);
    }
  };

  // The filter drawer of the search page, working on state.filters
  const drawerFilters = getSmartSearchDrawerFilters(config);
  const drawerParams = stateToDrawerParams(editableState, drawerFilters);
  const listingCategories = config.categoryConfiguration?.categories || [];
  const handleDrawerChange = changedParams =>
    updateStateSoon(
      applyDrawerChange({
        state: editableState,
        changedParams: changedParams || {},
        drawerFilters,
        listingCategories,
        intl,
        marketplaceCurrency: config.currency,
      })
    );
  const handleClearAll = () => updateState(clearAllFilters(editableState));
  const renderFilter = filterConfig => (
    <FilterComponent
      key={`SmartSearchFilterDrawer.${filterConfig.key}`}
      id={`SmartSearchFilterDrawer.${filterConfig.key.toLowerCase()}`}
      config={filterConfig}
      containerId="SearchFilterDrawer"
      listingCategories={listingCategories}
      marketplaceCurrency={config.currency}
      urlQueryParams={drawerParams}
      initialValues={queryParamNames =>
        queryParamNames.reduce(
          (acc, p) => (drawerParams[p] ? { ...acc, [p]: drawerParams[p] } : acc),
          {}
        )
      }
      getHandleChangedValueFn={() => handleDrawerChange}
      intl={intl}
      liveEdit
      showAsPopup={false}
      hideClearButton
    />
  );

  const handleSubmit = e => {
    e.preventDefault();
    search(text);
    setText('');
  };

  const bestListings = listings.filter(l => resultMeta[l.id.uuid]?.tier !== 'related');
  const relatedListings = listings.filter(l => resultMeta[l.id.uuid]?.tier === 'related');
  const hasSearch = !!currentState || !!urlParams.q;
  const noResults = notices.some(n => n.code === 'NO_RESULTS');
  const keptNotices = notices.filter(n => n.code === 'USER_FILTER_KEPT');
  const resultsCount = (total?.best || 0) + (total?.related || 0);

  return (
    <Page
      title={intl.formatMessage({ id: 'SmartSearchPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer currentPage="SmartSearchPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <form className={css.searchForm} onSubmit={handleSubmit} role="search">
            <label htmlFor="SmartSearchPage.input" className={css.visuallyHidden}>
              <FormattedMessage id="SmartSearchPage.inputLabel" />
            </label>
            <input
              id="SmartSearchPage.input"
              className={css.searchInput}
              type="text"
              autoComplete="off"
              maxLength={300}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={intl.formatMessage({
                id: hasSearch ? 'SmartSearchPage.refinePlaceholder' : 'SmartSearchPage.placeholder',
              })}
            />
            <button type="submit" className={css.searchButton} disabled={!text.trim()}>
              <FormattedMessage id="SmartSearchPage.searchButton" />
            </button>
          </form>

          {currentState?.q ? (
            <p className={css.currentQuery}>
              <FormattedMessage id="SmartSearchPage.currentQuery" values={{ q: currentState.q }} />
            </p>
          ) : null}

          <div className={css.toolbar}>
            <button
              type="button"
              className={css.filtersButton}
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-haspopup="dialog"
              data-testid="openSmartSearchFilters"
            >
              <svg
                className={css.filtersButtonIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M4 7h10M18 7h2M4 17h4M12 17h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <FormattedMessage id="FilterDrawer.openButton" />
              {editableState.filters.length > 0 ? (
                <span className={css.filtersButtonBadge}>{editableState.filters.length}</span>
              ) : null}
            </button>

            {editableState.filters.map(f => (
              <span
                key={f.key}
                className={classNames(css.chip, {
                  [css.chipSoft]: f.mode === 'soft',
                  [css.chipLocked]: f.locked,
                })}
              >
                <button
                  type="button"
                  className={css.chipPart}
                  onClick={() => updateState(toggleLockFilter(editableState, f))}
                  aria-pressed={f.locked}
                  title={intl.formatMessage({
                    id: f.locked ? 'SmartSearchPage.unlockFilter' : 'SmartSearchPage.lockFilter',
                  })}
                >
                  {f.locked ? <PinIcon /> : null}
                  <span>{f.label}</span>
                </button>
                <button
                  type="button"
                  className={css.chipPart}
                  onClick={() => updateState(removeFilter(editableState, f))}
                  aria-label={intl.formatMessage(
                    { id: 'SmartSearchPage.removeFilter' },
                    { label: f.label }
                  )}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}

            {editableState.filters.length > 0 ? (
              <button type="button" className={css.textButton} onClick={handleClearAll}>
                <FormattedMessage id="FilterDrawer.resetAll" />
              </button>
            ) : null}

            {hasSearch ? (
              <span className={css.resultsCount}>
                {searchInProgress ? (
                  <FormattedMessage id="SmartSearchPage.searching" />
                ) : (
                  <FormattedMessage
                    id="SmartSearchPage.resultsCount"
                    values={{ count: resultsCount }}
                  />
                )}
              </span>
            ) : null}

            {hasSearch ? (
              <label className={css.sortLabel} htmlFor="SmartSearchPage.sort">
                <FormattedMessage id="SmartSearchPage.sortBy" />
                <select
                  id="SmartSearchPage.sort"
                  className={css.select}
                  value={currentSort}
                  disabled={!currentState}
                  onChange={e => goTo({ s: currentS, page: 1, sort: e.target.value })}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o} value={o}>
                      {intl.formatMessage({ id: `SmartSearchPage.sort.${o}` })}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {currentState?.preferences?.length > 0 ? (
            <div className={css.preferencesRow}>
              <span className={css.preferencesLabel}>
                <FormattedMessage id="SmartSearchPage.prefers" />
              </span>
              {currentState.preferences.map(p => (
                <button
                  key={p}
                  type="button"
                  className={css.preferenceTag}
                  onClick={() => updateState(removePreference(currentState, p))}
                  aria-label={intl.formatMessage(
                    { id: 'SmartSearchPage.removePreference' },
                    { preference: p }
                  )}
                >
                  <span>{p}</span>
                  <CloseIcon />
                </button>
              ))}
            </div>
          ) : null}

          {relaxation?.suggestions?.map(s => {
            const filter = currentState?.filters.find(f => f.key === s.key);
            return filter ? (
              <p key={s.key} className={css.infoLine}>
                <FormattedMessage
                  id="SmartSearchPage.relaxationSuggestion"
                  values={{ extra: s.extra, label: s.label }}
                />{' '}
                <button
                  type="button"
                  className={css.textButton}
                  onClick={() => updateState(removeFilter(currentState, filter))}
                >
                  <FormattedMessage id="SmartSearchPage.relaxationRemove" />
                </button>
              </p>
            ) : null;
          })}

          {relaxation?.auto?.filter && currentState ? (
            <p className={classNames(css.infoLine, css.infoLineHighlight)}>
              <FormattedMessage
                id="SmartSearchPage.relaxationAuto"
                values={{ label: relaxation.auto.filter.label }}
              />{' '}
              <button
                type="button"
                className={css.textButton}
                onClick={() => updateState(undoRelaxation(currentState, relaxation.auto.filter))}
              >
                <FormattedMessage id="SmartSearchPage.relaxationUndo" />
              </button>
            </p>
          ) : null}

          {keptNotices.map(n => (
            <p key={n.params?.label} className={css.infoLine}>
              <FormattedMessage
                id="SmartSearchPage.noticeUserFilterKept"
                values={{ label: n.params?.label }}
              />
            </p>
          ))}

          {searchError ? (
            <div className={css.error} role="alert">
              <FormattedMessage
                id={ERROR_MESSAGE_IDS[searchError.code] || 'SmartSearchPage.errorUnavailable'}
              />
              {searchError.code === 'INVALID_REQUEST' ? (
                <>
                  {' '}
                  <NamedLink name="SmartSearchPage" className={css.textButton}>
                    <FormattedMessage id="SmartSearchPage.startOver" />
                  </NamedLink>
                </>
              ) : null}
            </div>
          ) : null}

          {!hasSearch ? (
            <div className={css.emptyState}>
              <h1 className={css.emptyTitle}>
                <FormattedMessage id="SmartSearchPage.emptyTitle" />
              </h1>
              <p className={css.emptyHint}>
                <FormattedMessage id="SmartSearchPage.emptyHint" />
              </p>
              <div className={css.examples}>
                {EXAMPLE_SEARCH_IDS.map(id => {
                  const example = intl.formatMessage({ id });
                  return (
                    <button
                      key={id}
                      type="button"
                      className={css.exampleChip}
                      onClick={() => search(example)}
                    >
                      {example}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {noResults && !searchInProgress ? (
            <p className={css.noResults}>
              <FormattedMessage id="SmartSearchPage.noticeNoResults" />
            </p>
          ) : null}

          <div
            className={classNames({ [css.loading]: searchInProgress })}
            aria-busy={searchInProgress}
          >
            <ResultSection
              titleId="SmartSearchPage.bestMatches"
              listings={bestListings}
              resultMeta={resultMeta}
            />
            <ResultSection
              titleId="SmartSearchPage.relatedMatches"
              listings={relatedListings}
              resultMeta={resultMeta}
            />
          </div>

          {totalPages > 1 && currentState ? (
            <nav
              className={css.pagination}
              aria-label={intl.formatMessage({ id: 'SmartSearchPage.pagination' })}
            >
              <button
                type="button"
                className={css.pageButton}
                disabled={page <= 1 || searchInProgress}
                onClick={() => goTo({ s: currentS, page: page - 1, sort: currentSort })}
              >
                <FormattedMessage id="SmartSearchPage.previousPage" />
              </button>
              <span className={css.pageInfo}>
                <FormattedMessage id="SmartSearchPage.pageInfo" values={{ page, totalPages }} />
              </span>
              <button
                type="button"
                className={css.pageButton}
                disabled={page >= totalPages || searchInProgress}
                onClick={() => goTo({ s: currentS, page: page + 1, sort: currentSort })}
              >
                <FormattedMessage id="SmartSearchPage.nextPage" />
              </button>
            </nav>
          ) : null}
        </div>
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={closeFilterDrawer}
          filters={drawerFilters}
          renderFilter={renderFilter}
          listingCategories={listingCategories}
          urlQueryParams={drawerParams}
          onChangeParams={handleDrawerChange}
          onResetAll={handleClearAll}
          resultsCount={resultsCount}
          searchInProgress={searchInProgress}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      </LayoutSingleColumn>
    </Page>
  );
};

export default SmartSearchPage;
