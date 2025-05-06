import React from 'react';

const IconMasonryGrid = props => {
  const { className, height = 16, width = 16 } = props;
  return (
    <svg
      className={className}
      style={{ width, height }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M15 1H9V9H15V1Z" fill="currentColor" />
      <path d="M7 7H1V15H7V7Z" fill="currentColor" />
      <path d="M1 1H7V5H1V1Z" fill="currentColor" />
      <path d="M15 11H9V15H15V11Z" fill="currentColor" />
    </svg>
  );
};

export default IconMasonryGrid;
