/*
 * Renders a set of options with selected and non-selected values.
 *
 * The corresponding component when selecting the values is
 * FieldCheckboxGroup.
 *
 */

import React from 'react';
import classNames from 'classnames';
import includes from 'lodash/includes';

import css from './PropertyGroup.module.css';

const checkSelected = (options, selectedOptions) => {
  return options.map(option => ({
    key: option.key,
    label: option.label,
    isSelected: includes(selectedOptions, option.key),
  }));
};

const IconCheck = props => {
  const isVisible = props.isVisible;
  const classes = isVisible ? css.checkIcon : classNames(css.checkIcon, css.hidden);

  return (
    <svg width="9" height="9" xmlns="http://www.w3.org/2000/svg" className={classes}>
      <path
        className={css.marketplaceFill}
        d="M2.636621 7.7824771L.3573694 5.6447948c-.4764924-.4739011-.4764924-1.2418639 0-1.7181952.4777142-.473901 1.251098-.473901 1.7288122 0l1.260291 1.1254783L6.1721653.505847C6.565577-.0373166 7.326743-.1636902 7.8777637.227582c.5473554.3912721.6731983 1.150729.2797866 1.6951076L4.4924979 7.631801c-.2199195.306213-.5803433.5067096-.9920816.5067096-.3225487 0-.6328797-.1263736-.8637952-.3560334z"
        fillRule="evenodd"
      />
    </svg>
  );
};

const Item = props => {
  const { label, isSelected } = props;
  const labelClass = isSelected ? css.selectedLabel : css.notSelectedLabel;
  return (
    <li className={css.item}>
      <span className={css.iconWrapper}>
        <IconCheck isVisible={isSelected} />
      </span>
      <div className={css.labelWrapper}>
        <span className={labelClass}>{label}</span>
      </div>
    </li>
  );
};

/**
 * @typedef {Object} Option
 * @property {string} key - The key of the option
 * @property {string} label - The label of the option
 */
/**
 * A component that renders a set of options with selected and non-selected values.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id of the property group
 * @param {Array<Option>} props.options - The options to render
 * @param {Array<string>} props.selectedOptions - The selected options
 * @param {boolean} props.twoColumns - Whether to render the options in two columns
 * @param {boolean} props.showUnselectedOptions - Whether to show the unselected options
 * @returns {JSX.Element}
 */
const PropertyGroup = props => {
  const {
    rootClassName,
    className,
    id,
    options,
    selectedOptions = [],
    twoColumns,
    showUnselectedOptions,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const listClasses = twoColumns ? classNames(classes, css.twoColumns) : classes;

  const checked = showUnselectedOptions
    ? checkSelected(options, selectedOptions)
    : checkSelected(options, selectedOptions).filter(o => o.isSelected);

  return (
    <ul className={listClasses}>
      {checked.map(option => (
        <Item key={`${id}.${option.key}`} label={option.label} isSelected={option.isSelected} />
      ))}
    </ul>
  );
};

export default PropertyGroup;
