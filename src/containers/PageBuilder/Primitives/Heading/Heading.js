import React from 'react';
import classNames from 'classnames';

import css from './Heading.module.css';

// Make it possible to use styling of H1, while the actual element is `<h2>`
const Heading = props => {
  const { className, rootClassName, as, tagRef, ...otherProps } = props;
  const Tag = as || 'h2';
  const classes = classNames(rootClassName, className);

  return <Tag className={classes} ref={tagRef} {...otherProps} />;
};

/**
 * Render a h1 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h1'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H1 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h1} as={as || 'h1'} tagRef={ref} {...otherProps} />
  );
});
H1.displayName = 'H1';

/**
 * Render a h2 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h2'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H2 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h2} as={as || 'h2'} tagRef={ref} {...otherProps} />
  );
});
H2.displayName = 'H2';

/**
 * Render a h3 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h3'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H3 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h3} as={as || 'h3'} tagRef={ref} {...otherProps} />
  );
});
H3.displayName = 'H3';

/**
 * Render a h4 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h4'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H4 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h4} as={as || 'h4'} tagRef={ref} {...otherProps} />
  );
});
H4.displayName = 'H4';

/**
 * Render a h5 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h5'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H5 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h5} as={as || 'h5'} tagRef={ref} {...otherProps} />
  );
});
H5.displayName = 'H5';

/**
 * Render a h6 heading element
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element to be used. Default 'h6'
 * @param {ReactNode} props.children
 * @returns {JSX.Element} heading element
 */
export const H6 = React.forwardRef((props, ref) => {
  const { rootClassName: rootClass, as, ...otherProps } = props;
  return (
    <Heading rootClassName={rootClass || css.h6} as={as || 'h6'} tagRef={ref} {...otherProps} />
  );
});
H6.displayName = 'H6';
