import React from 'react';
import classNames from 'classnames';

import { NamedLink } from '../../components';

import css from './CategoryBar.module.css';

// IDs must match Console → Listing categories
const CATEGORIES = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'baby', label: 'Baby' },
  { id: 'accessories', label: 'Accessories' },
];

const CATEGORY_PARAM = 'pub_categoryLevel1';

const CategoryBar = props => {
  const { className, currentSearch = '' } = props;
  const activeCategory = new URLSearchParams(currentSearch).get(CATEGORY_PARAM);

  return (
    <nav className={classNames(css.root, className)} aria-label="Categories">
      <ul className={css.list}>
        {CATEGORIES.map(category => {
          const isActive = activeCategory === category.id;
          return (
            <li key={category.id}>
              <NamedLink
                name="SearchPage"
                to={{ search: `?${CATEGORY_PARAM}=${category.id}` }}
                className={classNames(css.link, { [css.linkActive]: isActive })}
                aria-current={isActive ? 'page' : undefined}
              >
                {category.label}
              </NamedLink>
            </li>
          );
        })}
        <li>
          <NamedLink name="SearchPage" className={classNames(css.link, css.discover)}>
            Discover
          </NamedLink>
        </li>
      </ul>
    </nav>
  );
};

export default CategoryBar;
