# Stripe config

Stripe Connect settings for payments and payouts: publishable key, how far ahead bookings can be
made, default merchant category code (MCC), and which countries/bank-account shapes are supported.

There is **no hosted asset**. Values come from built-ins in
[`defaultStripe.js`](./defaultStripe.js), including the publishable key from
`REACT_APP_STRIPE_PUBLISHABLE_KEY`. Resolve filters `supportedCountries` against
`settingsCurrency.subUnitDivisors`.

Besides that publishable key in `.env`, payments also need Stripe's secret key. Set the secret key
in Marketplace Console so Sharetribe's API can use it — it is not part of this app config.

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

Stripe needs two keys for payments: the publishable key (`REACT_APP_STRIPE_PUBLISHABLE_KEY` in
`.env`) and the secret key (set in Marketplace Console for Sharetribe API access). A missing
publishable key is an env/setup issue — both must be set for payments to work.
