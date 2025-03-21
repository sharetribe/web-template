import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import css from './Heading.module.css';

// Make it possible to use custom styling of H1, while the rendered HTML element is `<h2>`
export const Heading = props => {
  const { className, rootClassName, as, styledAs, tagRef, ...otherProps } = props;
  const Tag = as || 'h2';
  const rootClass = rootClassName
    ? rootClassName
    : styledAs === 'h1'
    ? css.h1
    : styledAs === 'h2'
    ? css.h2
    : styledAs === 'h3'
    ? css.h3
    : styledAs === 'h4'
    ? css.h4
    : styledAs === 'h5'
    ? css.h5
    : styledAs === 'h6'
    ? css.h6
    : null;
  const classes = classNames(rootClass, className);

  return <Tag className={classes} ref={tagRef} {...otherProps} />;
};

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h1'.
 * @returns {JSX.Element} heading component
 */
export const H1 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h1} as={as || 'h1'} tagRef={ref} {...otherProps} />
  );
});
H1.displayName = 'H1';

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h2'.
 * @returns {JSX.Element} heading component
 */
export const H2 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h2} as={as || 'h2'} tagRef={ref} {...otherProps} />
  );
});
H2.displayName = 'H2';

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h3'.
 * @returns {JSX.Element} heading component
 */
export const H3 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h3} as={as || 'h3'} tagRef={ref} {...otherProps} />
  );
});
H3.displayName = 'H3';

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h4'.
 * @returns {JSX.Element} heading component
 */
export const H4 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h4} as={as || 'h4'} tagRef={ref} {...otherProps} />
  );
});
H4.displayName = 'H4';

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h5'.
 * @returns {JSX.Element} heading component
 */
export const H5 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h5} as={as || 'h5'} tagRef={ref} {...otherProps} />
  );
});
H5.displayName = 'H5';

/**
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {string?} props.as alternative tag. Defaults to 'h6'.
 * @returns {JSX.Element} heading component
 */
export const H6 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h6} as={as || 'h6'} tagRef={ref} {...otherProps} />
  );
});
H6.displayName = 'H6';
