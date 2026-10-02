import React from 'react';

/**
 * Heart icon used for saved listings.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {boolean?} props.filled show a filled heart
 * @returns {JSX.Element} SVG icon
 */
const IconHeart = props => {
  const { className, filled = false } = props;
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.4 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconHeart;
