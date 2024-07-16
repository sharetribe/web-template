import React from "react";
import { bool } from "prop-types";

import { getProcess, resolveLatestProcessName } from "../../transactions/transaction";
import { formatMoney } from "../../util/currency";
import { FormattedMessage, intlShape } from "../../util/reactIntl";
import { propTypes } from "../../util/types";
import css from "./OrderBreakdown.module.css";

const LineItemTotalPrice = (props) => {
	const { transaction, isProvider, intl } = props;
	const processName = resolveLatestProcessName(transaction?.attributes?.processName);
	if (!processName) {
		return null;
	}
	const process = getProcess(processName);
	const isCompleted = process.isCompleted(transaction?.attributes?.lastTransition);
	const isRefunded = process.isRefunded(transaction?.attributes?.lastTransition);

	let providerTotalMessageId = "OrderBreakdown.providerTotalDefault";
	if (isCompleted) {
		providerTotalMessageId = "OrderBreakdown.providerTotalReceived";
	} else if (isRefunded) {
		providerTotalMessageId = "OrderBreakdown.providerTotalRefunded";
	}

	const totalLabel = isProvider ? (
		<FormattedMessage id={providerTotalMessageId} />
	) : (
		<FormattedMessage id="OrderBreakdown.total" />
	);

	const totalPrice = isProvider
		? transaction.attributes.payoutTotal
		: transaction.attributes.payinTotal;
	const formattedTotalPrice = formatMoney(intl, totalPrice);

	return (
		<>
			<hr className={css.totalDivider} />
			<div className={css.lineItemTotal}>
				<div className={css.totalLabel}>{totalLabel}</div>
				<div className={css.totalPrice}>{formattedTotalPrice}</div>
			</div>
		</>
	);
};

LineItemTotalPrice.propTypes = {
	transaction: propTypes.transaction.isRequired,
	isProvider: bool.isRequired,
	intl: intlShape.isRequired,
};

export default LineItemTotalPrice;
