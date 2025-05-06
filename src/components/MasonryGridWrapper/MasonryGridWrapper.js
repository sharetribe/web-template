import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import React from 'react';

const MasonryGridWrapper = ({ children }) => {
  if (!children) {
    return null;
  }

  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
      gutterBreakpoints={{ 350: '12px', 750: '16px', 900: '24px' }}
    >
      <Masonry gutter="12px">{children}</Masonry>
    </ResponsiveMasonry>
  );
};

export default MasonryGridWrapper;
