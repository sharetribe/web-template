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
