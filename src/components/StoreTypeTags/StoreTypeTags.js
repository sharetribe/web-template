import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getStoreTypeTags } from '../../config/configAV';

import css from './StoreTypeTags.module.css';

const PALETTE_SIZE = 4;
const DEFAULT_MAX = 3;

/**
 * StoreTypeTags
 *
 * Renders the listing author's `tipoTienda` values as colored chips, rotating
 * through a fixed palette by index. Renders nothing unless the author is a
 * store seller (see getStoreTypeTags). The consumer positions the group via
 * `className` (e.g. an absolute overlay on the listing image).
 *
 * @param {Object} props
 * @param {Object} props.author listing author (user entity)
 * @param {string?} props.className positioning/layout class from the consumer
 * @param {number?} props.max maximum chips to render (default 3)
 */
const StoreTypeTags = props => {
  const { author, className, max = DEFAULT_MAX } = props;
  const config = useConfiguration();
  const tags = getStoreTypeTags(author, config);

  if (!tags.length) {
    return null;
  }

  const visible = max > 0 ? tags.slice(0, max) : tags;

  return (
    <div className={classNames(css.root, className)}>
      {visible.map((tag, index) => (
        <span key={tag.key} className={classNames(css.tag, css[`tag${index % PALETTE_SIZE}`])}>
          {tag.label}
        </span>
      ))}
    </div>
  );
};

export default React.memo(StoreTypeTags);
