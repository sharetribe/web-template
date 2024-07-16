/**
 * Import reducers from shared ducks modules (default export)
 * We are following Ducks module proposition:
 * https://github.com/erikras/ducks-modular-redux
 */

import auth from "./auth.duck";
import emailVerification from "./emailVerification.duck";
import hostedAssets from "./hostedAssets.duck";
import marketplaceData from "./marketplaceData.duck";
import paymentMethods from "./paymentMethods.duck";
import routing from "./routing.duck";
import stripe from "./stripe.duck";
import stripeConnectAccount from "./stripeConnectAccount.duck";
import ui from "./ui.duck";
import user from "./user.duck";

export {
	auth,
	emailVerification,
	hostedAssets,
	marketplaceData,
	paymentMethods,
	routing,
	stripe,
	stripeConnectAccount,
	ui,
	user,
};
