import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { parse } from '../../util/urlHelpers';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { LayoutSingleColumn, ListingCard, NamedLink, Page } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import SaveListingButton from '../SaveListingButton/SaveListingButton';

import {
  SORT_OPTIONS,
  addFilter,
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
import css from './SmartSearchPage.module.css';

const RENDER_SIZES = [
  '(max-width: 549px) 100vw',
  '(max-width: 767px) 50vw',
  '(max-width: 1023px) 33vw',
  '25vw',
].join(', ');

const EXAMPLE_SEARCHES = [
  'vintage jacket for autumn, size L, under 60€',
  'black nike shoes size 42',
  'pet free sweater for women',
];

// Listing fields that can be added with "+ Add filter" (the rest come from the search text)
const ADDABLE_FIELD_KEYS = ['size', 'shoeSize', 'kidsSize', 'color', 'brand', 'condition'];
const CATEGORY_FILTER_KEY = 'categoryLevel1';

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

/**
 * Options for the "+ Add filter" menu: main categories and selected listing fields.
 */
const getAddableFields = (config, intl) => {
  const categories = (config.categoryConfiguration?.categories || [])
    .filter(c => c.id !== 'accessories')
    .map(c => ({ option: c.id, label: c.name }));
  const categoryField = categories.length
    ? [
        {
          key: CATEGORY_FILTER_KEY,
          label: intl.formatMessage({ id: 'FilterComponent.categoryLabel' }),
          options: categories,
        },
      ]
    : [];
  const fields = (config.listing?.listingFields || [])
    .filter(f => ADDABLE_FIELD_KEYS.includes(f.key) && (f.enumOptions || []).length > 0)
    .map(f => ({
      key: f.key,
      label: f.filterConfig?.label || f.showConfig?.label || f.key,
      options: f.enumOptions,
    }));
  return [...categoryField, ...fields];
};

const chipLabelFor = (fieldKey, optionLabel) =>
  fieldKey === 'size'
    ? `Size ${optionLabel}`
    : fieldKey === 'shoeSize'
    ? `EU ${optionLabel}`
    : optionLabel;

/**
 * "+ Add filter" menu: pick a field, then a value.
 */
const AddFilterMenu = props => {
  const { fields, onAdd } = props;
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState('');
  const [option, setOption] = useState('');
  const field = fields.find(f => f.key === fieldKey);

  if (fields.length === 0) {
    return null;
  }

  const close = () => {
    setIsOpen(false);
    setFieldKey('');
    setOption('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    const picked = field?.options.find(o => `${o.option}` === option);
    if (field && picked) {
      onAdd({ key: field.key, value: picked.option, label: chipLabelFor(field.key, picked.label) });
      close();
    }
  };

  return isOpen ? (
    <form className={css.addFilterForm} onSubmit={handleSubmit}>
      <label className={css.visuallyHidden} htmlFor="SmartSearchPage.addFilterField">
        <FormattedMessage id="SmartSearchPage.addFilterField" />
      </label>
      <select
        id="SmartSearchPage.addFilterField"
        className={css.select}
        value={fieldKey}
        onChange={e => {
          setFieldKey(e.target.value);
          setOption('');
        }}
      >
        <option value="">{intl.formatMessage({ id: 'SmartSearchPage.addFilterField' })}</option>
        {fields.map(f => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      {field ? (
        <>
          <label className={css.visuallyHidden} htmlFor="SmartSearchPage.addFilterValue">
            <FormattedMessage id="SmartSearchPage.addFilterValue" />
          </label>
          <select
            id="SmartSearchPage.addFilterValue"
            className={css.select}
            value={option}
            onChange={e => setOption(e.target.value)}
          >
            <option value="">{intl.formatMessage({ id: 'SmartSearchPage.addFilterValue' })}</option>
            {field.options.map(o => (
              <option key={o.option} value={o.option}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <button type="submit" className={css.smallPrimaryButton} disabled={!field || !option}>
        <FormattedMessage id="SmartSearchPage.addFilterSubmit" />
      </button>
      <button type="button" className={css.textButton} onClick={close}>
        <FormattedMessage id="SmartSearchPage.addFilterCancel" />
      </button>
    </form>
  ) : (
    <button type="button" className={css.addFilterButton} onClick={() => setIsOpen(true)}>
      <FormattedMessage id="SmartSearchPage.addFilter" />
    </button>
  );
};

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

  const search = q => {
    const trimmed = (q || '').trim();
    if (trimmed) {
      goTo({ q: trimmed, s: currentS, page: 1, sort: currentSort });
    }
  };
  const updateState = nextState => goTo({ s: encodeState(nextState), page: 1, sort: currentSort });

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

          {currentState ? (
            <div className={css.chipsRow}>
              {currentState.filters.map(f => (
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
                    onClick={() => updateState(toggleLockFilter(currentState, f))}
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
                    onClick={() => updateState(removeFilter(currentState, f))}
                    aria-label={intl.formatMessage(
                      { id: 'SmartSearchPage.removeFilter' },
                      { label: f.label }
                    )}
                  >
                    <CloseIcon />
                  </button>
                </span>
              ))}
              <AddFilterMenu
                fields={getAddableFields(config, intl)}
                onAdd={filter => updateState(addFilter(currentState, filter))}
              />
            </div>
          ) : null}

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

          {hasSearch ? (
            <div className={css.resultsHeader}>
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
            </div>
          ) : null}

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
                {EXAMPLE_SEARCHES.map(example => (
                  <button
                    key={example}
                    type="button"
                    className={css.exampleChip}
                    onClick={() => search(example)}
                  >
                    {example}
                  </button>
                ))}
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
      </LayoutSingleColumn>
    </Page>
  );
};

export default SmartSearchPage;
