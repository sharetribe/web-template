import React, { useState, useEffect } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';

import { LinkedLogo } from '../../components';

import css from './CheckoutPage.module.css';

const CustomTopbar = props => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let mediaQueryList = null;
    let updateIsMobile = null;

    if (mounted) {
      // set initial value
      mediaQueryList = window.matchMedia('(max-width: 767px)');
      setIsMobile(mediaQueryList.matches);

      //watch for updates
      updateIsMobile = e => {
        setIsMobile(e.matches);
      };
      mediaQueryList.addEventListener('change', updateIsMobile);
    }

    // clean up after ourselves
    return () => {
      if (mediaQueryList && updateIsMobile) {
        mediaQueryList.removeEventListener('change', updateIsMobile);
      }
    };
  }, [mounted]);

  const { className, rootClassName, intl, linkToExternalSite } = props;
  const classes = classNames(rootClassName || css.topbar, className);

  return (
    <div className={classes}>
      <LinkedLogo
        layout={isMobile ? 'mobile' : 'desktop'}
        alt={intl.formatMessage({ id: 'CheckoutPage.goToLandingPage' })}
        linkToExternalSite={linkToExternalSite}
      />
    </div>
  );
};

CustomTopbar.defaultProps = {
  className: null,
  rootClassName: null,
};

CustomTopbar.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
};

export default CustomTopbar;
