import React, { useState, useEffect } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';

import { LinkedLogo } from '../../components';

import css from './CheckoutPage.module.css';

const CustomTopbar = props => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // set initial value
    const mediaQueryList = window.matchMedia('(max-width: 767px)');
    setIsMobile(mediaQueryList.matches);

    //watch for updates
    function updateIsMobile(e) {
      setIsMobile(e.matches);
    }
    mediaQueryList.addEventListener('change', updateIsMobile);

    // clean up after ourselves
    return function cleanup() {
      mediaQueryList.removeEventListener('change', updateIsMobile);
    };
  });

  const { className, rootClassName, intl } = props;
  const classes = classNames(rootClassName || css.topbar, className);

  return (
    <div className={classes}>
      <LinkedLogo
        layout={isMobile ? 'mobile' : 'desktop'}
        alt={intl.formatMessage({ id: 'CheckoutPage.goToLandingPage' })}
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
