import React from 'react';
import PropTypes from 'prop-types';

import { useConfiguration } from '../../context/configurationContext';

const Logo = props => {
  const config = useConfiguration();
  const { className, format, ...rest } = props;
  // NOTE: logo images are set in src/config/brandingConfig.js
  const { logoImageDesktopURL, logoImageMobileURL } = config.branding;

  if (format === 'desktop') {
    return (
      <img className={className} src={logoImageDesktopURL} alt={config.marketplaceName} {...rest} />
    );
  }

  return (
    <img className={className} src={logoImageMobileURL} alt={config.marketplaceName} {...rest} />
  );
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
