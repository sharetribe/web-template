import React from "react";

import { IconArrowHead } from "../../../../components";
import { isDateSameOrAfter } from "../../../../util/dates";

// Component for the react-dates calendar
const PrevArrow = (props) => {
	const { showUntilDate, startOfPrevRange, size = "small", onClick, ...rest } = props;
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
