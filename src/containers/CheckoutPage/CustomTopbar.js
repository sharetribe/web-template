import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { LinkedLogo } from '../../components';

import css from './CheckoutPage.module.css';

/**
 * A component that renders the custom topbar for the checkout page.
 * We don't want to use the default topbar because there are too many
 * links leading away from the checkout page.
 *
 * @component
 * @param {Object} props
 * @param {string} props.className - The class name for the topbar
 * @param {string} props.rootClassName - The root class name for the topbar
 * @param {Object} props.intl - The intl object
 * @param {boolean} props.linkToExternalSite - Whether to link to the external site
 * @returns {JSX.Element}
 */
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

export default CustomTopbar;
