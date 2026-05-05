import React from 'react';
import css from './FileUpload.module.css';

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress indicator driven by a 0–100 percentage value.
 * The arc grows clockwise from the top of the circle.
 *
 * @param {Object} props
 * @param {number} props.progress - Upload progress 0–100
 */
export const IconProgressCircle = ({ progress = 0 }) => {
  const filled = Math.min(100, Math.max(0, progress));
  const arcLength = (filled / 100) * CIRCUMFERENCE;

  return (
    <svg
      className={css.iconProgressCircle}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
    >
      {/* Background track */}
      <circle
        cx="10"
        cy="10"
        r={RADIUS}
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />
      {/* Progress arc — starts at 12 o'clock via rotate(-90) */}
      <circle
        cx="10"
        cy="10"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(-90 10 10)"
        strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
        fill="none"
      />
    </svg>
  );
};
