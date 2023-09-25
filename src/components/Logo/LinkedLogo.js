import React from 'react';
import { oneOf, string } from 'prop-types';
import classNames from 'classnames';

import { NamedLink, Logo } from '../../components';

import css from './LinkedLogo.module.css';

const LinkedLogo = props => {
  const {
    className,
    rootClassName,
    logoClassName,
    logoImageClassName,
    layout,
    alt,
    ...rest
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
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
};

LinkedLogo.propTypes = {
  className: string,
  rootClassName: string,
  logoClassName: string,
  logoImageClassName: string,
  layout: oneOf(['desktop', 'mobile']),
};

export default LinkedLogo;
