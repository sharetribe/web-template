import React from 'react';
import classNames from 'classnames';

import { Heading } from '../../components';

import css from './SectionAllSizes.module.css';

/**
 * SectionAllSizes renders selected size values as read-only chips.
 *
 * @param {Object} props component props
 * @returns {JSX.Element|null}
 */
const SectionAllSizes = props => {
  const {
    heading,
    options,
    selectedOptions,
    className,
    rootClassName,
    showUnselectedOptions = false,
  } = props;

  const hasContent = selectedOptions?.length > 0 || showUnselectedOptions;
  if (!heading || !options || !hasContent) {
    return null;
  }

  const optionLabelMap = options.reduce((map, option) => {
    map[option.key] = option.label;
    return map;
  }, {});

  const selectedItems = (selectedOptions || [])
    .map(optionKey => ({
      key: optionKey,
      label: optionLabelMap[optionKey] || optionKey,
    }))
    .filter(item => item.label);

  const classes = classNames(rootClassName || css.sectionAllSizes, className);

  return selectedItems.length > 0 ? (
    <section className={classes}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        {heading}
      </Heading>
      <ul className={css.list}>
        {selectedItems.map(item => (
          <li key={item.key} className={css.item}>
            <span className={css.chip} title={item.label}>
              <span className={css.label}>{item.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
};

export default SectionAllSizes;
