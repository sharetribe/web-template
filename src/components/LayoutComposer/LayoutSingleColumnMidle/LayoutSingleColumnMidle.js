import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import LayoutComposer from '../LayoutComposer';

import css from './LayoutSingleColumnMidle.module.css';

// Commonly used layout
const LayoutSingleColumnMidle = props => {
  const {
    className,
    rootClassName,
    mainColumnClassName,
    children,
    topbar: topbarContent,
    footer: footerContent,
    containerClassName,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const containerClasses = containerClassName || css.container;

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
            <Main as="div" className={containerClasses}>
              <main className={classNames(css.main, mainColumnClassName)}>{children}</main>
            </Main>
            <Footer>{footerContent}</Footer>
          </>
        );
      }}
    </LayoutComposer>
  );
};

LayoutSingleColumnMidle.displayName = 'LayoutSingleColumnMidle';

LayoutSingleColumnMidle.defaultProps = {
  className: null,
  rootClassName: null,
  footer: null,
};

LayoutSingleColumnMidle.propTypes = {
  className: string,
  rootClassName: string,
  children: node.isRequired,
  topbar: node.isRequired,
  footer: node,
};

export default LayoutSingleColumnMidle;
