import * as React from 'react';

const euroSign = ({ size = '24px', color = '#000000', ...props }) => (
  <svg
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <style type="text/css">{`\n\t.st0{stroke:${color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}\n`}</style>
    <g>
      <path
        className="st0"
        d="M16 8.94444C15.1834 7.76165 13.9037 7 12.4653 7C9.99917 7 8 9.23858 8 12C8 14.7614 9.99917 17 12.4653 17C13.9037 17 15.1834 16.2384 16 15.0556M7 10.5H11M7 13.5H11M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      />
    </g>
  </svg>
);

export default euroSign;



