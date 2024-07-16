import React from "react";

import { IconArrowHead } from "../../../../components";
import { isDateSameOrAfter } from "../../../../util/dates";

// Component for the react-dates calendar
const NextArrow = (props) => {
	const { showUntilDate, startOfNextRange, size = "small", onClick, ...rest } = props;
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
