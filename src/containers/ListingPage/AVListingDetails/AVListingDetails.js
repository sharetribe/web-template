import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';
import { swatchBg, swatchColors } from '../../../components/FieldSwatch/FieldSwatch';

import css from './AVListingDetails.module.css';

const DESCRIPTION_EXCERPT_LENGTH = 100;

// Resolve the human-readable label for an enum value from the field config.
const enumLabel = (fieldConfig, value) => {
  const opt = fieldConfig?.enumOptions?.find(o => `${o.option}` === `${value}`);
  return opt?.label || value;
};

// Resolve the swatch background for a color enum value (solid color or pattern image).
const getSwatchStyle = colorKey => {
  if (swatchColors[colorKey]) {
    return { backgroundColor: swatchColors[colorKey] };
  }
  if (swatchBg[colorKey]) {
    return {
      backgroundImage: `url(${swatchBg[colorKey]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: '#ccc' };
};

// Walk the nested category tree to find a category node's display name by id.
const findCategoryName = (categories, id) => {
  for (const cat of categories || []) {
    if (cat.id === id) return cat.name;
    const nested = findCategoryName(cat.subcategories, id);
    if (nested) return nested;
  }
  return null;
};

// A single value rendered as a link to the search page filtered by that field.
const SearchLink = ({ paramKey, value, children, className }) => (
  <NamedLink className={className} name="SearchPage" to={{ search: `?pub_${paramKey}=${value}` }}>
    {children}
  </NamedLink>
);

/**
 * AV listing details: a curated, divider-less stack of listing fields rendered
 * as search links, in a fixed order. Used by the redesigned listing page.
 *
 * @param {Object} props
 * @param {Object} props.publicData - listing publicData
 * @param {Array<Object>} props.listingFieldConfigs - hosted listing-field configs (key, enumOptions, showConfig)
 * @param {Object} props.categoryConfiguration - { key, categories } from config
 * @param {string} props.description - listing description
 * @param {string} [props.className]
 */
const AVListingDetails = props => {
  const {
    publicData = {},
    listingFieldConfigs = [],
    categoryConfiguration,
    description = '',
    className,
  } = props;
  const [expanded, setExpanded] = useState(false);

  const cfg = key => listingFieldConfigs.find(c => c.key === key);
  const labelFor = key => cfg(key)?.showConfig?.label;

  // brand — value only (no field label), styled in AV purple/bold/larger
  const brand = publicData.brand;

  // all_sizes (multi-enum)
  const sizes = Array.isArray(publicData.all_sizes) ? publicData.all_sizes : [];

  // estado (enum)
  const estado = publicData.estado;

  // categories — categoryLevel1/2/3
  const categoryKey = categoryConfiguration?.key || 'categoryLevel';
  const categoryTree = categoryConfiguration?.categories || [];
  const categoryLevels = [1, 2, 3]
    .map(level => {
      const paramKey = `${categoryKey}${level}`;
      const value = publicData[paramKey];
      return value
        ? { paramKey, value, name: findCategoryName(categoryTree, value) || value }
        : null;
    })
    .filter(Boolean);

  // color (multi-enum)
  const colors = Array.isArray(publicData.color) ? publicData.color : [];

  // genero (enum)
  const genero = publicData.genero;

  const isLongDescription = description.length > DESCRIPTION_EXCERPT_LENGTH;
  const descriptionShown =
    expanded || !isLongDescription
      ? description
      : `${description.slice(0, DESCRIPTION_EXCERPT_LENGTH).trimEnd()}…`;

  return (
    <div className={classNames(css.root, className)}>
      {brand ? (
        <div className={css.brandRow}>
          <SearchLink paramKey="brand" value={brand} className={css.brandLink}>
            {enumLabel(cfg('brand'), brand)}
          </SearchLink>
        </div>
      ) : null}

      {sizes.length ? (
        <div className={css.sizesRow}>
          {labelFor('all_sizes') ? (
            <span className={css.label}>{labelFor('all_sizes')}: </span>
          ) : null}
          <ul className={css.chipList}>
            {sizes.map(s => (
              <li key={s} className={css.chipItem}>
                <SearchLink paramKey="all_sizes" value={s} className={css.chip}>
                  {enumLabel(cfg('all_sizes'), s)}
                </SearchLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {description ? (
        <div className={css.descriptionRow}>
          <span className={css.descriptionText}>{descriptionShown}</span>
          {isLongDescription ? (
            <button
              type="button"
              className={css.toggleButton}
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? (
                <FormattedMessage id="AVListingDetails.showLess" />
              ) : (
                <FormattedMessage id="AVListingDetails.showMore" />
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      {estado ? (
        <div className={css.row}>
          {labelFor('estado') ? <span className={css.label}>{labelFor('estado')}: </span> : null}
          <SearchLink paramKey="estado" value={estado} className={css.link}>
            {enumLabel(cfg('estado'), estado)}
          </SearchLink>
        </div>
      ) : null}

      {colors.length ? (
        <div className={css.colorRow}>
          {labelFor('color') ? <span className={css.label}>{labelFor('color')}: </span> : null}
          <ul className={css.swatchList}>
            {colors.map(c => (
              <li key={c} className={css.swatchItem}>
                <SearchLink paramKey="color" value={c} className={css.swatchLink}>
                  <span className={css.swatch} style={getSwatchStyle(c)} />
                  <span className={css.swatchLabel}>{enumLabel(cfg('color'), c)}</span>
                </SearchLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {categoryLevels.length ? (
        <div className={css.row}>
          <span className={css.label}>
            <FormattedMessage id="AVListingDetails.categoryLabel" />:{' '}
          </span>
          {categoryLevels.map((c, i) => (
            <React.Fragment key={c.paramKey}>
              {i > 0 ? ', ' : ''}
              <SearchLink paramKey={c.paramKey} value={c.value} className={css.link}>
                {c.name}
              </SearchLink>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {genero ? (
        <div className={css.row}>
          {labelFor('genero') ? <span className={css.label}>{labelFor('genero')}: </span> : null}
          <SearchLink paramKey="genero" value={genero} className={css.link}>
            {enumLabel(cfg('genero'), genero)}
          </SearchLink>
        </div>
      ) : null}
    </div>
  );
};

export default AVListingDetails;
