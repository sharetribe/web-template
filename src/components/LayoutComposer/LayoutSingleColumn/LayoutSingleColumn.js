import React from 'react';
import classNames from 'classnames';

import LayoutComposer from '../LayoutComposer';

import css from './LayoutSingleColumn.module.css';

/**
 * Commonly used layout: single column
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.mainColumnClassName add more style rules in addition to css.main
 * @param {ReactNode} props.children
 * @param {ReactNode} props.topbar
 * @param {ReactNode?} props.footer
 * @returns {JSX.Element} LayoutComposer that expects children to be a function.
 */
const LayoutSingleColumn = props => {
  const {
    className,
    rootClassName,
    mainColumnClassName,
    children,
    topbar: topbarContent,
    footer: footerContent,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const layoutAreas = `
    topbar
    main
    footer
  `;

  return (
    <LayoutComposer areas={layoutAreas} className={classes} {...rest}>
      {layoutProps => {
        const { Topbar, Main, Footer } = layoutProps;
        return (
          <>
            <Topbar as="header" className={css.topbar}>
              {topbarContent}
            </Topbar>
            <Main as="main" className={classNames(css.main, mainColumnClassName)}>
              {children}
            </Main>
            <Footer>{footerContent}</Footer>
          </>
        );
      }}
    </LayoutComposer>
  );
};

LayoutSingleColumn.displayName = 'LayoutSingleColumn';

export default LayoutSingleColumn;
