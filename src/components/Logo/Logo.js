import React from 'react';
import PropTypes from 'prop-types';

import { useConfiguration } from '../../context/configurationContext';
import { ResponsiveImage } from '../../components/';

const Logo = props => {
  const config = useConfiguration();
  const { className, format, ...rest } = props;
  // NOTE: logo images are set in src/config/brandingConfig.js
  const { logoImageDesktop, logoImageMobile } = config.branding;
  const isImageAsset = logo => logo?.type === 'imageAsset';

  if (isImageAsset(logoImageDesktop) && format === 'desktop') {
    const { width, height } = logoImageDesktop.attributes.variants.scaled || {};
    return (
      <ResponsiveImage
        className={className}
        alt={config.marketplaceName}
        image={logoImageDesktop}
        variants={['scaled', 'scaled2x']}
        sizes={`${width}px`}
      />
    );
  } else if (isImageAsset(logoImageMobile) && format === 'mobile') {
    const { width, height } = logoImageMobile.attributes.variants.scaled || {};
    return (
      <ResponsiveImage
        className={className}
        alt={config.marketplaceName}
        image={logoImageMobile}
        variants={['scaled', 'scaled2x']}
        sizes={`${width}px`}
      />
    );
  } else if (format === 'desktop') {
    return (
      <img className={className} src={logoImageDesktop} alt={config.marketplaceName} {...rest} />
    );
  }

  return <img className={className} src={logoImageMobile} alt={config.marketplaceName} {...rest} />;
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
