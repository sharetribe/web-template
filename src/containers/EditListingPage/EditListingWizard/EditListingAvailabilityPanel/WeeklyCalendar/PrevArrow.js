import React from 'react';

import { isDateSameOrAfter } from '../../../../../util/dates';
import { IconArrowHead } from '../../../../../components';

// Component for the DatePicker calendar
const PrevArrow = props => {
  const { showUntilDate, startOfPrevRange, size = 'small', onClick, ...rest } = props;
  const canNavigateBack = isDateSameOrAfter(startOfPrevRange, showUntilDate);

  return canNavigateBack && onClick ? (
    <button onClick={onClick} {...rest}>
      <IconArrowHead direction="left" size={size} />
    </button>
  ) : canNavigateBack ? (
    <IconArrowHead direction="left" size={size} />
  ) : null;
};

export default PrevArrow;
