import React from 'react';

export const IconSpinnerSmall = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <circle
      cx="8"
      cy="8"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        calcMode="linear"
        values="0 8 8;180 8 8;720 8 8"
        keyTimes="0;0.5;1"
        dur="0.9s"
        begin="0s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="stroke-dasharray"
        calcMode="linear"
        values="5 28;23 7;5 28"
        keyTimes="0;0.5;1"
        dur="0.9s"
        begin="0s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);
