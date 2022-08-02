import React from 'react';
import { func, node, string } from 'prop-types';

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

const Form = props => {
  const { enforcePagePreloadFor, ...restProps } = props;
  return enforcePagePreloadFor ? <FormWithPagePreload {...props} /> : <PlainForm {...restProps} />;
};

Form.defaultProps = {
  children: null,
  contentRef: null,
  enforcePagePreloadFor: null,
};

Form.propTypes = {
  children: node,
  contentRef: func,
  enforcePagePreloadFor: string,
};

export default Form;
