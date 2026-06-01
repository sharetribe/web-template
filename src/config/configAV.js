// AV-owned configuration. Keep AV-specific defaults here so they do not
// leak into upstream Sharetribe config files (which makes future merges noisy).

// ISO 3166-1 alpha-2 country code used as the default for:
//   - Stripe payment / recipient country on CheckoutPage
//   - Stripe Connect payout country on EditListingWizard
// Overridable via env so deployments outside MX don't need a code change.
export const defaultCountry = process.env.REACT_APP_AV_DEFAULT_COUNTRY || 'MX';

// User-type values (set in `currentUser.attributes.profile.publicData.userType`)
// that may set an `originalPrice` on a listing — i.e. show the strike-through
// "was" price input in the pricing panels.
export const sellerUserTypes = ['vendedor', 'vendedor-stock'];

export const canShowOriginalPrice = currentUser => {
  const userType = currentUser?.attributes?.profile?.publicData?.userType;
  return sellerUserTypes.includes(userType);
};
