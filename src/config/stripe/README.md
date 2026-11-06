# Stripe config

Stripe Connect settings for payments and payouts: publishable key, how far ahead bookings can be
made, default merchant category code (MCC), and which countries/bank-account shapes are supported.

There is **no Console / hosted asset**. Values come from [`defaultStripe.js`](./defaultStripe.js)
(including `REACT_APP_STRIPE_PUBLISHABLE_KEY` from the environment). Validate is a no-op; resolve
filters `supportedCountries` against `settingsCurrency.subUnitDivisors`. The private Stripe key is
set in Sharetribe Console, not in this app config.

## `config.stripe` shape

```js
{
  publishableKey, // from REACT_APP_STRIPE_PUBLISHABLE_KEY
  dayCountAvailableForBooking, // booking horizon (Stripe fund-hold limits)
  defaultMCC, // default merchant category code for connected accounts
  supportedCountries, // [{ code, currency, accountConfig }, …]
}
```

Used for Stripe.js injection, Connect onboarding forms, checkout, and booking date-range limits.

## When something is wrong

A country whose `currency` is missing from `settingsCurrency.subUnitDivisors` is dropped (the client
cannot format that currency). Does not trigger MaintenanceMode.

Missing `REACT_APP_STRIPE_PUBLISHABLE_KEY` is an env/setup issue — set it in `.env` (and the private
key in Console) for payments to work.
