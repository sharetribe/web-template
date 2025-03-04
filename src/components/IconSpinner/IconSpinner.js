import React, { useEffect, useState } from 'react';
import { number, string } from 'prop-types';
import classNames from 'classnames';

import css from './IconSpinner.module.css';

const IconSpinner = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      viewBox="0 0 30 30"
      preserveAspectRatio="xMidYMid"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="15" cy="15" r="12" fill="none" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          calcMode="linear"
          values="0 15 15;180 15 15;720 15 15"
          keyTimes="0;0.5;1"
          dur="0.9s"
          begin="0s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dasharray"
          calcMode="linear"
          values="9 56;46 14;9 56"
          keyTimes="0;0.5;1"
          dur="0.9s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

const DelayedSpinner = props => {
  const [showSpinner, setShowSpinner] = useState(false);
  const { delay = 600, ...restOfProps } = props;

  useEffect(() => {
    const timer = window?.setTimeout(() => setShowSpinner(true), delay);
    return () => window?.clearTimeout(timer);
  });

  return showSpinner ? <IconSpinner {...restOfProps} /> : null;
};

DelayedSpinner.propTypes = {
  delay: number.isRequired,
};

const Spinner = props => {
  const { delay, ...restOfProps } = props;

  return delay != null ? <DelayedSpinner {...props} /> : <IconSpinner {...restOfProps} />;
};

Spinner.defaultProps = {
  rootClassName: null,
  className: null,
  delay: null,
};

Spinner.propTypes = {
  rootClassName: string,
  className: string,
  delay: number,
};

export default Spinner;
