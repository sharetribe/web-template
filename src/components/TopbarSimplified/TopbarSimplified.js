import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { LinkedLogo } from '../../components';

import css from './TopbarSimplified.module.css';

/**
 * A component that renders a simplified top bar. This is used on situations,
 * where we don't want the user to be distacted by the multiple links in the Topbar component.
 * This is used in CheckoutPage, MakeOfferPage, and RequestQuotePage.
 *
 * Note: the real Topbar component can be found from src/containers/TopbarContainer/
 *
 * @component
 * @param {Object} props
 * @param {string} props.className - The class name for the topbar
 * @param {string} props.rootClassName - The root class name for the topbar
 * @param {Object} props.intl - The intl object
 * @param {boolean} props.linkToExternalSite - Whether to link to the external site
 * @returns {JSX.Element}
 */
const TopbarSimplified = props => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const intl = useIntl();
  const config = useConfiguration();

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

  const { className, rootClassName } = props;
  const linkToExternalSite = config?.topbar?.logoLink;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <nav className={classes}>
      <LinkedLogo
        layout={isMobile ? 'mobile' : 'desktop'}
        alt={intl.formatMessage({ id: 'TopbarSimplified.goToLandingPage' })}
        linkToExternalSite={linkToExternalSite}
      />
    </nav>
  );
};

export default TopbarSimplified;
