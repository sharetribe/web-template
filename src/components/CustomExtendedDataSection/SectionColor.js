import React from 'react';
import classNames from 'classnames';

import { Heading } from '../../components';
import { swatchBg, swatchColors } from '../FieldSwatch/FieldSwatch';

import css from './SectionColor.module.css';

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

const SectionColor = props => {
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

  const classes = classNames(rootClassName || css.sectionColor, className);

  return selectedItems.length > 0 ? (
    <section className={classes}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        {heading}
      </Heading>
      <ul className={css.list}>
        {selectedItems.map(item => (
          <li key={item.key} className={css.item}>
            <span className={css.circle} style={getSwatchStyle(item.key)} title={item.label} />
            <span className={css.label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
};

export default SectionColor;
