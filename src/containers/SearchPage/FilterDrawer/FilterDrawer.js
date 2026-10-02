import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { isInSearchOfListingType } from '../../../util/inSearchOf';

import {
  BRAND_FIELD_KEY,
  COLOR_FIELD_KEY,
  POPULAR_BRAND_COUNT,
  SIZE_GROUPS,
  SIZE_FIELD_KEYS,
  formatEnumValues,
  getColorSwatch,
  getFilterLabel,
  getParamNames,
  getVisibleCategories,
  isEnumFilter,
  parseEnumValues,
} from './FilterDrawer.helpers';
import css from './FilterDrawer.module.css';

const DRAWER_ID = 'SearchFilterDrawer';
const FOCUSABLE_ELEMENTS = 'button, [href], input, select, textarea, [tabindex]';

// Order of the enum sections after Size; the rest follow in Console order
const ENUM_SECTION_ORDER = ['condition', BRAND_FIELD_KEY];
const ENUM_SECTIONS_AFTER_PRICE = [COLOR_FIELD_KEY];
// Filter types without a custom section; FilterComponent renders nothing for other types
const RENDERABLE_OTHER_SCHEMA_TYPES = ['long', 'dates', 'seats'];

const CloseIcon = () => (
  <svg className={css.closeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className={css.inputIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Section = ({ title, aside, children }) => (
  <section className={css.section}>
    {title ? (
      <div className={css.sectionHeader}>
        <h3 className={css.sectionTitle}>{title}</h3>
        {aside}
      </div>
    ) : null}
    {children}
  </section>
);

/**
 * Selling / In search of switch.
 */
const ListingTypeToggle = props => {
  const { inSearchOfType, selectedListingType, onChangeParams } = props;
  const isInSearchOf = isInSearchOfListingType(selectedListingType);
  const options = [
    { id: 'selling', isOn: !isInSearchOf, params: { pub_listingType: null } },
    { id: 'inSearchOf', isOn: isInSearchOf, params: { pub_listingType: inSearchOfType } },
  ];
  return (
    <section className={css.section}>
      <div className={css.segmented} role="group">
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            className={classNames(css.segment, { [css.segmentOn]: o.isOn })}
            aria-pressed={o.isOn}
            onClick={() => (o.isOn ? null : onChangeParams(o.params))}
          >
            <FormattedMessage id={`FilterDrawer.listingType.${o.id}`} />
          </button>
        ))}
      </div>
    </section>
  );
};

/**
 * Category tree: "All categories", top-level categories and, under the chosen one,
 * its subcategories.
 */
const CategorySection = props => {
  const { categoryFilter, categories, urlQueryParams, onChangeParams } = props;
  const paramNames = getParamNames(categoryFilter);
  const [level1Param, level2Param] = paramNames;
  const level1 = urlQueryParams[level1Param];
  const level2 = urlQueryParams[level2Param];

  const setCategory = (l1, l2) => {
    const cleared = paramNames.reduce((acc, p) => ({ ...acc, [p]: null }), {});
    onChangeParams({
      ...cleared,
      ...(l1 ? { [level1Param]: l1 } : {}),
      ...(l1 && l2 && level2Param ? { [level2Param]: l2 } : {}),
    });
  };

  const row = ({ id, label, isOn, isBold, isSub, onClick }) => (
    <li key={id}>
      <button
        type="button"
        className={classNames(css.treeRow, {
          [css.treeRowOn]: isOn,
          [css.treeRowBold]: isBold,
          [css.treeRowSub]: isSub,
        })}
        aria-pressed={isOn}
        onClick={onClick}
      >
        <span>{label}</span>
        {isOn ? <CheckIcon className={css.treeCheck} /> : null}
      </button>
    </li>
  );

  return (
    <Section title={<FormattedMessage id="FilterComponent.categoryLabel" />}>
      <ul className={css.tree}>
        {row({
          id: 'all',
          label: <FormattedMessage id="FilterDrawer.allCategories" />,
          isOn: !level1,
          isBold: !level1,
          onClick: () => setCategory(null, null),
        })}
        {categories.map(cat => {
          const isChosen = level1 === cat.id;
          return (
            <React.Fragment key={cat.id}>
              {row({
                id: cat.id,
                label: cat.name,
                isOn: isChosen && !level2,
                isBold: isChosen,
                onClick: () => setCategory(cat.id, null),
              })}
              {isChosen
                ? (cat.subcategories || []).map(sub => {
                    const isSubOn = level2 === sub.id;
                    return row({
                      id: `${cat.id}.${sub.id}`,
                      label: sub.name,
                      isOn: isSubOn,
                      isBold: isSubOn,
                      isSub: true,
                      onClick: () => setCategory(cat.id, isSubOn ? null : sub.id),
                    });
                  })
                : null}
            </React.Fragment>
          );
        })}
      </ul>
    </Section>
  );
};

/**
 * Size buttons, grouped by size field (clothing, shoes, kids).
 */
const SizeSection = props => {
  const { sizeFilters, urlQueryParams, onToggle } = props;
  const [showMore, setShowMore] = useState(false);

  const groups = SIZE_GROUPS.map(group => {
    const filter = sizeFilters.find(f => f.key === group.key);
    if (!filter) {
      return null;
    }
    const selected = parseEnumValues(urlQueryParams[getParamNames(filter)[0]]);
    const options = filter.enumOptions || [];
    const visible = showMore
      ? options
      : options.filter((o, i) => i < group.collapsed || selected.includes(`${o.option}`));
    return { group, filter, selected, visible, hasHidden: visible.length < options.length };
  }).filter(Boolean);

  if (groups.length === 0) {
    return null;
  }
  const hasMore = groups.some(g => g.hasHidden);

  return (
    <Section title={<FormattedMessage id="FilterDrawer.size" />}>
      {groups
        .filter(g => g.visible.length > 0)
        .map(({ group, filter, selected, visible }) => (
          <div key={group.key} className={css.sizeGroup}>
            <span className={css.groupLabel}>{getFilterLabel(filter)}</span>
            <div className={css.sizeGrid}>
              {visible.map(o => {
                const isOn = selected.includes(`${o.option}`);
                return (
                  <button
                    key={o.option}
                    type="button"
                    className={classNames(css.sizeButton, { [css.sizeButtonOn]: isOn })}
                    aria-pressed={isOn}
                    onClick={() => onToggle(filter, `${o.option}`)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      {hasMore || showMore ? (
        <button
          type="button"
          className={css.moreButton}
          aria-expanded={showMore}
          onClick={() => setShowMore(!showMore)}
        >
          <FormattedMessage id={showMore ? 'FilterDrawer.fewerSizes' : 'FilterDrawer.moreSizes'} />
        </button>
      ) : null}
    </Section>
  );
};

const CheckboxRow = ({ label, isOn, swatch, onClick }) => (
  <button type="button" className={css.checkRow} aria-pressed={isOn} onClick={onClick}>
    <span className={classNames(css.checkBox, { [css.checkBoxOn]: isOn })}>
      {isOn ? <CheckIcon className={css.checkMark} /> : null}
    </span>
    {swatch ? <span className={css.swatch} style={{ background: swatch }} /> : null}
    <span className={css.checkLabel}>{label}</span>
  </button>
);

/**
 * Checkbox list for an enum field. Colour gets swatches, brand gets a search box.
 */
const EnumSection = props => {
  const { filter, urlQueryParams, onToggle } = props;
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const isColor = filter.key === COLOR_FIELD_KEY;
  const isBrand = filter.key === BRAND_FIELD_KEY;
  const selected = parseEnumValues(urlQueryParams[getParamNames(filter)[0]]);
  const options = filter.enumOptions || [];

  const q = query.trim().toLowerCase();
  const visible = !isBrand
    ? options
    : q
    ? options.filter(o => `${o.label}`.toLowerCase().includes(q))
    : [
        ...options.filter((o, i) => i >= POPULAR_BRAND_COUNT && selected.includes(`${o.option}`)),
        ...options.slice(0, POPULAR_BRAND_COUNT),
      ];

  const inputId = `${DRAWER_ID}.${filter.key}.search`;

  return (
    <Section title={getFilterLabel(filter)}>
      {isBrand ? (
        <label htmlFor={inputId} className={css.searchField}>
          <SearchIcon />
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            className={css.searchInput}
            placeholder={intl.formatMessage({ id: 'FilterDrawer.brandSearchPlaceholder' })}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
      ) : null}
      <div className={classNames(css.checkList, { [css.checkListTwoColumns]: isColor })}>
        {visible.map(o => (
          <CheckboxRow
            key={o.option}
            label={o.label}
            isOn={selected.includes(`${o.option}`)}
            swatch={isColor ? getColorSwatch(o.option) : null}
            onClick={() => onToggle(filter, `${o.option}`)}
          />
        ))}
      </div>
      {isBrand && q && visible.length === 0 ? (
        <p className={css.hint}>
          <FormattedMessage id="FilterDrawer.noBrandMatch" values={{ query }} />
        </p>
      ) : null}
      {isBrand && !q && options.length > POPULAR_BRAND_COUNT ? (
        <p className={css.hint}>
          <FormattedMessage id="FilterDrawer.brandHint" />
        </p>
      ) : null}
    </Section>
  );
};

/**
 * Side drawer with all search filters in one scrollable list. Filters apply immediately
 * (live edit), so the footer button only closes the drawer and shows the result count.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Array<Object>} props.filters filter configs to show (see getDrawerFilters)
 * @param {Function} props.renderFilter renders the existing FilterComponent for a filter config
 * @param {Array<Object>} props.listingCategories category tree from config
 * @param {string?} props.inSearchOfType "In search of" listing type id, if configured
 * @param {Object} props.urlQueryParams current valid search params
 * @param {Function} props.onChangeParams called with changed URL params
 * @param {Function} props.onResetAll
 * @param {number} props.resultsCount
 * @param {boolean} props.searchInProgress
 * @param {Function} props.onManageDisableScrolling
 * @returns {JSX.Element} filter drawer
 */
const FilterDrawer = props => {
  const intl = useIntl();
  const {
    isOpen,
    onClose,
    filters,
    renderFilter,
    listingCategories = [],
    inSearchOfType,
    urlQueryParams,
    onChangeParams,
    onResetAll,
    resultsCount,
    searchInProgress,
    onManageDisableScrolling,
  } = props;
  const panelRef = useRef(null);
  // Element that had focus before the drawer opened (e.g. the "Filters" button)
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (onManageDisableScrolling) {
      onManageDisableScrolling(DRAWER_ID, isOpen);
    }
    if (isOpen) {
      returnFocusRef.current = document.activeElement;
      panelRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus?.();
      returnFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Keep keyboard focus inside the drawer while it is open
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)).filter(
          el => !el.disabled && el.tabIndex >= 0
        );
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const isInside = panelRef.current.contains(active);
        if (e.shiftKey && (active === first || !isInside || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !isInside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleEnumValue = (filter, value) => {
    const paramName = getParamNames(filter)[0];
    const current = parseEnumValues(urlQueryParams[paramName]);
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChangeParams({ [paramName]: formatEnumValues(filter, next) });
  };

  const categoryFilter = filters.find(f => f.schemaType === 'category');
  const priceFilter = filters.find(f => f.schemaType === 'price');
  const listingTypeFilter = filters.find(f => f.schemaType === 'listingType');
  const sizeFilters = filters.filter(f => SIZE_FIELD_KEYS.includes(f.key));
  const enumFilters = filters.filter(f => isEnumFilter(f) && !SIZE_FIELD_KEYS.includes(f.key));
  const byKeys = keys => keys.map(k => enumFilters.find(f => f.key === k)).filter(Boolean);
  const enumBeforePrice = byKeys(ENUM_SECTION_ORDER);
  const enumAfterPrice = byKeys(ENUM_SECTIONS_AFTER_PRICE);
  const orderedKeys = [...ENUM_SECTION_ORDER, ...ENUM_SECTIONS_AFTER_PRICE];
  const otherEnums = enumFilters.filter(f => !orderedKeys.includes(f.key));
  // Other filter types that the template's own filter components can render
  const otherFilters = filters.filter(
    f => RENDERABLE_OTHER_SCHEMA_TYPES.includes(f.schemaType) && !SIZE_FIELD_KEYS.includes(f.key)
  );

  const renderEnum = f => (
    <EnumSection
      key={f.key}
      filter={f}
      urlQueryParams={urlQueryParams}
      onToggle={toggleEnumValue}
    />
  );

  return (
    <div className={classNames(css.root, { [css.isOpen]: isOpen })} aria-hidden={!isOpen}>
      <div className={css.overlay} onClick={onClose} />
      <div
        id={DRAWER_ID}
        ref={panelRef}
        className={css.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${DRAWER_ID}.title`}
        tabIndex={-1}
        {...(isOpen ? {} : { inert: '' })}
      >
        <div className={css.header}>
          <div className={css.headerText}>
            <h2 id={`${DRAWER_ID}.title`} className={css.title}>
              <FormattedMessage id="FilterDrawer.title" />
            </h2>
            <span className={css.subtitle}>
              <FormattedMessage id="FilterDrawer.subtitle" />
            </span>
          </div>
          <button
            type="button"
            className={css.closeButton}
            onClick={onClose}
            aria-label={intl.formatMessage({ id: 'FilterDrawer.close' })}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={css.body}>
          {inSearchOfType ? (
            <ListingTypeToggle
              inSearchOfType={inSearchOfType}
              selectedListingType={urlQueryParams.pub_listingType}
              onChangeParams={onChangeParams}
            />
          ) : listingTypeFilter ? (
            <Section>{renderFilter(listingTypeFilter)}</Section>
          ) : null}

          {categoryFilter ? (
            <CategorySection
              categoryFilter={categoryFilter}
              categories={getVisibleCategories(listingCategories)}
              urlQueryParams={urlQueryParams}
              onChangeParams={onChangeParams}
            />
          ) : null}

          <SizeSection
            sizeFilters={sizeFilters}
            urlQueryParams={urlQueryParams}
            onToggle={toggleEnumValue}
          />

          {enumBeforePrice.map(renderEnum)}

          {priceFilter ? <Section>{renderFilter(priceFilter)}</Section> : null}

          {enumAfterPrice.map(renderEnum)}
          {otherEnums.map(renderEnum)}
          {otherFilters.map(f => (
            <Section key={f.key}>{renderFilter(f)}</Section>
          ))}
        </div>

        <div className={css.footer}>
          <button type="button" className={css.resetButton} onClick={onResetAll}>
            <FormattedMessage id="FilterDrawer.resetAll" />
          </button>
          <button type="button" className={css.showResultsButton} onClick={onClose}>
            {searchInProgress ? (
              <FormattedMessage id="FilterDrawer.loadingResults" />
            ) : (
              <FormattedMessage id="FilterDrawer.showResults" values={{ count: resultsCount }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
