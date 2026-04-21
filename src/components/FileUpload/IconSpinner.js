import React from 'react';
import css from './FileUpload.module.css';

export const IconSpinner = () => (
  <svg
    className={css.iconSpinner}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <circle
      cx="10"
      cy="10"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        calcMode="linear"
        values="0 10 10;180 10 10;720 10 10"
        keyTimes="0;0.5;1"
        dur="0.9s"
        begin="0s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="stroke-dasharray"
        calcMode="linear"
        values="6 44;31 13;6 44"
        keyTimes="0;0.5;1"
        dur="0.9s"
        begin="0s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);
