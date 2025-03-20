import React from 'react';
import classNames from 'classnames';

import { ExternalLink, Logo, NamedLink } from '../../components';

import css from './LinkedLogo.module.css';

/**
 * This component returns a clickable logo.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.logoClassName andd more style rules in addtion to css.logo
 * @param {string?} props.logoImageClassName overwrite components own css.root
 * @param {('desktop' | 'mobile')} props.layout
 * @param {Object} props.linkToExternalSite
 * @param {string} props.linkToExternalSite.href
 * @param {string?} props.alt alt text for logo image
 * @returns {JSX.Element} linked logo component
 */
const LinkedLogo = props => {
  const {
    className,
    rootClassName,
    logoClassName,
    logoImageClassName,
    layout = 'desktop',
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

export default LinkedLogo;
