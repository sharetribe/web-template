import React from 'react';
import { oneOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import { ExternalLink, Logo, NamedLink } from '../../components';

import css from './LinkedLogo.module.css';

const LinkedLogo = props => {
  const {
    className,
    rootClassName,
    logoClassName,
    logoImageClassName,
    layout,
    linkToExternalSite,
    alt,
    ...rest
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  // Note: href might come as an empty string (falsy), in which case we default to 'LandingPage'.
  return linkToExternalSite?.href ? (
    <ExternalLink className={classes} href={linkToExternalSite.href} target="_self" {...rest}>
      <Logo
        layout={layout}
        className={logoClassName}
        logoImageClassName={logoImageClassName}
        alt={alt}
      />
    </ExternalLink>
  ) : (
    <NamedLink className={classes} name="LandingPage" {...rest}>
      <Logo
        layout={layout}
        className={logoClassName}
        logoImageClassName={logoImageClassName}
        alt={alt}
      />
    </NamedLink>
  );
};

LinkedLogo.defaultProps = {
  className: null,
  rootClassName: null,
  logoClassName: null,
  logoImageClassName: null,
  layout: 'desktop',
  linkToExternalSite: null,
};

LinkedLogo.propTypes = {
  className: string,
  rootClassName: string,
  logoClassName: string,
  logoImageClassName: string,
  layout: oneOf(['desktop', 'mobile']),
  linkToExternalSite: shape({
    href: string.isRequired,
  }),
};

export default LinkedLogo;
