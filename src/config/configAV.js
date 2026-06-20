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

// User-type values that should see the AV onboarding "welcome" popup
// (rendered by TopbarContainer). Intentionally separate from `sellerUserTypes`
// (the originalPrice gate) — the popup audience and the price-field audience
// are unrelated.
export const welcomePopupUserTypes = ['vendedor', 'vendedor-tienda'];

// Whether the welcome popup is eligible to show for this user: a matching
// seller userType that has not yet completed onboarding. The caller still
// combines this with any per-session dismissal state and route suppression
// (e.g. it is hidden on the signup page, where it would otherwise cover the
// "check your email" confirmation message).
export const canShowWelcomePopup = currentUser => {
  const publicData = currentUser?.attributes?.profile?.publicData;
  return welcomePopupUserTypes.includes(publicData?.userType) && !publicData?.onboardingCompleted;
};

// Route pathnames where the welcome popup is suppressed even when the user is
// otherwise eligible. The signup page shows a "check your email" confirmation
// right after registration that the popup would cover.
export const welcomePopupSuppressedPaths = ['/signup'];

// Note: this gate is intentionally separate from `sellerUserTypes` (the
// originalPrice gate above) — store-type tags and originalPrice are unrelated.
// Store sellers (userType === storeSellerUserType) can tag listings with one or
// more `tipoTienda` values, rendered as colored tags over the listing image.
export const storeSellerUserType = 'vendedor-tienda';
export const storeTypeFieldKey = 'tipoTienda';

// Returns [{ key, label }] of store-type tags for the listing author, or [] when
// the author is not a store seller or has no tipoTienda set. Labels resolve from
// the hosted `tipoTienda` user-field enumOptions, falling back to the raw value.
export const getStoreTypeTags = (author, config = {}) => {
  const publicData = author?.attributes?.profile?.publicData;
  if (publicData?.userType !== storeSellerUserType) {
    return [];
  }

  const raw = publicData?.[storeTypeFieldKey];
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (values.length === 0) {
    return [];
  }

  const fieldConfig = (config?.user?.userFields || []).find(f => f.key === storeTypeFieldKey);
  const options = fieldConfig?.enumOptions || [];
  return values.map(value => {
    const match = options.find(o => o.option === value);
    return { key: value, label: match?.label || value };
  });
};

// AV shipping config lives in a CommonJS sibling (configAVShipping.js) so the
// server can require the same source. Re-export for ergonomic client imports.
const avShipping = require('./configAVShipping');
export const {
  packageSizes: shippingPackageSizes,
  deliveryTypes: shippingDeliveryTypes,
  priceGrid: shippingPriceGrid,
  defaultPackageSize: defaultPackageSize,
  getPackageSizeForCategory,
  isEspecialSize,
  getShippingPrice,
  getAvailableDeliveryTypes,
} = avShipping;
