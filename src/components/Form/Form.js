import React from 'react';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { findRouteByRouteName } from '../../util/routes';

const PlainForm = props => {
  const { children, contentRef, ...restProps } = props;

  const formProps = {
    // These are mainly default values for the server
    // rendering. Otherwise the form would submit potentially
    // sensitive data with the default GET method until the client
    // side code is loaded.
    method: 'post',
    action: '/',

    // allow content ref function to be passed to the form
    ref: contentRef,

    ...restProps,
  };

  return <form {...formProps}>{children}</form>;
};

const FormWithPagePreload = props => {
  const routeConfiguration = useRouteConfiguration();
  const { enforcePagePreloadFor, ...restProps } = props;

  const onOverFormFn = enforcePreloadOfPage => () => {
    // Enforce preloading of given page (loadable component)
    const { component: Page } = findRouteByRouteName(enforcePreloadOfPage, routeConfiguration);
    // Loadable Component has a "preload" function.
    if (Page.preload) {
      Page.preload();
    }
  };

  const onOverForm = onOverFormFn(enforcePagePreloadFor);
  const onOverFormProps = {
    onMouseOver: onOverForm,
    onTouchStart: onOverForm,
  };

  return <PlainForm {...restProps} {...onOverFormProps} />;
};

/**
 * This component returns a clickable logo.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.enforcePagePreloadFor Name of a route
 * @param {ReactNode} props.children
 * @param {Function} props.contentRef
 * @returns {JSX.Element} linked logo component
 */
const Form = props => {
  const { enforcePagePreloadFor, ...restProps } = props;
  return enforcePagePreloadFor ? <FormWithPagePreload {...props} /> : <PlainForm {...restProps} />;
};

export default Form;
