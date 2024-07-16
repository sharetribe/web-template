import loadable from "@loadable/component";

import { injectIntl } from "../../../util/reactIntl";
import { types as sdkTypes } from "../../../util/sdkLoader";

const ProductOrderForm = loadable(
	() => import(/* webpackChunkName: "ProductOrderForm" */ "./ProductOrderForm"),
);

const CURRENCY = "USD";
const marketplaceName = "MarketplaceX";
const { Money, UUID } = sdkTypes;

export const Form = {
	component: injectIntl(ProductOrderForm),
	props: {
		formId: "OrderPanelProductOrderFormExample",
		onSubmit: (values) => {
			console.log("Submit ProductOrderForm with values:", values);
		},
		price: new Money(1099, CURRENCY),
		currentStock: 14,
		pickupEnabled: true,
		shippingEnabled: true,
		listingId: new UUID("listing.id"),
		isOwnListing: false,
		onFetchTransactionLineItems: (params) =>
			console.log(
				"onFetchTransactionLineItems called with params:",
				JSON.stringify(params, null, 2),
			),
		onContactUser: () => console.log("onContactUser called"),
		lineItems: null,
		fetchLineItemsInProgress: false,
		fetchLineItemsError: null,
		marketplaceName,
	},
	group: "forms",
};
