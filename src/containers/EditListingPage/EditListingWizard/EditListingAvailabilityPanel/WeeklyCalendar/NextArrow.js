import React from 'react';

import { isDateSameOrAfter } from '../../../../../util/dates';
import { IconArrowHead } from '../../../../../components';

// Component for the DatePicker calendar
const NextArrow = props => {
  const { showUntilDate, startOfNextRange, size = 'small', onClick, ...rest } = props;
  const canNavigateForward = isDateSameOrAfter(showUntilDate, startOfNextRange);

  return canNavigateForward && onClick ? (
    <button onClick={onClick} {...rest}>
      <IconArrowHead direction="right" size={size} />
    </button>
  ) : canNavigateForward ? (
    <IconArrowHead direction="right" size={size} />
  ) : null;
};

export default NextArrow;
