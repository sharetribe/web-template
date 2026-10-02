import React from 'react';
import classNames from 'classnames';

import { NamedLink } from '../../../components';

import css from './CategoryButtons.module.css';

// Category search param used on the search page
const CATEGORY_PARAM = 'pub_categoryLevel1';

// `id` = category ID in Console. `color` = background of the icon circle.
const CATEGORIES = [
  { id: 'women', label: 'Women', icon: '👗', color: '#e3d0c7' },
  { id: 'men', label: 'Men', icon: '👕', color: '#ccd5cf' },
  { id: 'kids', label: 'Kids', icon: '🧸', color: '#ede2bd' },
];

const VARIANTS = {
  pills: css.pills,
};

/**
 * Category shortcut buttons on the landing page.
 * Each category links to the search page filtered by category; "Discover" links to all items.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {'pills'} [props.variant] visual style of the buttons
 * @returns {JSX.Element} list of category links
 */
const CategoryButtons = props => {
  const { className, variant = 'pills' } = props;
  const classes = classNames(css.root, VARIANTS[variant] || css.pills, className);

  return (
    <ul className={classes}>
      {CATEGORIES.map(category => (
        <li key={category.id}>
          <NamedLink
            name="SearchPage"
            to={{ search: `?${CATEGORY_PARAM}=${category.id}` }}
            className={css.pill}
          >
            <span
              className={css.icon}
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            >
              {category.icon}
            </span>
            <span className={css.label}>{category.label}</span>
          </NamedLink>
        </li>
      ))}
      <li>
        <NamedLink name="SearchPage" className={classNames(css.pill, css.discover)}>
          <span className={classNames(css.icon, css.discoverIcon)} aria-hidden="true">
            ✨
          </span>
          <span className={css.label}>Discover</span>
        </NamedLink>
      </li>
    </ul>
  );
};

export default CategoryButtons;
