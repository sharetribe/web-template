import React from 'react';
import { connect } from 'react-redux';

import { isScrollingDisabled } from '../../ducks/ui.duck.js';
import { Page } from '../../components/index.js';

/**
 * This component returns a Page component which is connected to Redux store.
 *
 * @component
 * @param {Object} props
 * @param {JSX.Element} props.children
 * @returns {JSX.Element} Page component with scrollingDisabled info from Redux state.
 */
const StaticPageComponent = props => {
  const { children, ...pageProps } = props;
  return <Page {...pageProps}>{children}</Page>;
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const StaticPage = connect(mapStateToProps)(StaticPageComponent);

export default StaticPage;
