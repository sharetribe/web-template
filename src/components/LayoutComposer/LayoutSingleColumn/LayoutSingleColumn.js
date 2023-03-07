import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import LayoutComposer from '../LayoutComposer';

import css from './LayoutSingleColumn.module.css';

// Commonly used layout
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

LayoutSingleColumn.defaultProps = {
  className: null,
  rootClassName: null,
  footer: null,
};

LayoutSingleColumn.propTypes = {
  className: string,
  rootClassName: string,
  children: node.isRequired,
  topbar: node.isRequired,
  footer: node,
};

export default LayoutSingleColumn;
