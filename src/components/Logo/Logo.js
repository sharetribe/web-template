import React from 'react';
import PropTypes from 'prop-types';

import { useConfiguration } from '../../context/configurationContext';
import LogoImageMobile from './sneakertime-logo-mobile.png';
import LogoImage from './sneakertime-logo.png';

const Logo = props => {
  const config = useConfiguration();
  const { className, format, ...rest } = props;

  if (format === 'desktop') {
    return <img className={className} src={LogoImage} alt={config.siteTitle} {...rest} />;
  }

  return <img className={className} src={LogoImageMobile} alt={config.siteTitle} {...rest} />;
};

const { oneOf, string } = PropTypes;

Logo.defaultProps = {
  className: null,
  format: 'desktop',
};

Logo.propTypes = {
  className: string,
  format: oneOf(['desktop', 'mobile']),
};

export default Logo;
