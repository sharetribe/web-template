# Working with transaction processes

This directory contains the different transaction processes that this client app can handle. You
should note that these client-app-related processes should match with actual transaction processes
that are visible in Sharetribe Console.

There's a bit of duplication involved with transaction processes. If you decide to customize
existing transaction processes or create a unique process, you need to define the process so that
the Sharetribe backend understands it. You can use Sharetribe CLI to push the process to your
marketplace environment.

Read more about transaction processes:  
https://www.sharetribe.com/docs/concepts/transaction-process/

> The default processes are referenced also in the directory: _../../ext/transaction-processes_.

In addition to the process that is saved to the Sharetribe platform, you also need to add the new or
modified process here. This directory guides how this web app renders different pages - and the app
needs to have knowledge about what happens after each transition in the process.

Read more about how to take new or modified transaction processes into use in this template.  
https://www.sharetribe.com/docs/how-to/change-transaction-process-in-ftw/

The starting point to take the new process into use in your client app is to define a new process
graph in this directory and take it into use in transaction.js. After that, you need to go through
all the files that import the transaction.js file and check if those components need to be
customized to work with your customized process graph.

If your new process involves Stripe payments, you should also update `server/api/delete-account.js`.
Add the relevant states to a new`stripeRelatedStatesFor\*` array, add a corresponding query
function, and include it in the `Promise.all` call. This prevents account deletion when the user has
transactions with incomplete payment processing.

## Payment methods and transaction processes

Checkout payment methods are owned by the transaction process, not by a global Stripe setting.

- The **process graph is the source of truth** for which Stripe methods the UI may offer:
  `process.supportedPayments.stripe`.
- [paymentMethods.js](paymentMethods.js) is the shared **catalog** (method id, currencies,
  save-payment-method support, default `paymentDirection`).
- Declaring a method in the client does **not** enable Stripe/Sharetribe support by itself. The
  backend process (Sharetribe CLI / Console) must include matching transitions and Stripe actions.

Built-in processes in this template declare **card only** (`paymentDirection: 'pull'`). Custom
processes can also declare **push** methods (for example iDEAL or MobilePay) when the matching
backend process uses `:action/stripe-create-payment-intent-push`.

### Pull vs push

**Pull** (default card) — `paymentDirection: 'pull'`

- Typical create action: `stripe-create-payment-intent`
- Checkout params: `cardToken` / saved payment method
- Confirm UX: in-page card confirm
- Capture later: common (e.g. when the provider accepts a booking)
- Saved payment methods: card is supported via Marketplace API

**Push** (e.g. iDEAL, MobilePay) — `paymentDirection: 'push'`

- Typical create action: `stripe-create-payment-intent-push`
- Checkout params: `paymentMethodTypes: ['ideal']` (no card token)
- Confirm UX: redirect / async (`confirmPayment` + return URL)
- Capture later: often unsupported — the graph may need accept-without-capture (or purchase-style
  capture-on-confirm)
- Saved payment methods: not supported for push through current default Stripe integration
- Webhooks: push payments are often async. If the customer finishes at the bank/app but never
  returns to checkout, the transaction can stay stuck in pending-payment. Plan to listen to
  Stripe webhooks (or equivalent reconciliation) so confirm/fail transitions can run without
  relying only on the browser return path.

### Process module contract

When you add a new process file, export:

1. **`supportedPayments`** — spread `stripePaymentMethodInfo(...)` for each method the matching
   backend process supports or manually configure them.
2. **`getCheckoutPaymentTransitions({ paymentProcessor, paymentMethod, state, ... })`** — return
   `{ requestPaymentTransition, confirmPaymentTransition }`. Branch on `paymentDirection` (and
   inquiry state) when the process has separate push request-payment transitions.
3. Include any privileged push request-payment transitions in **`isPrivileged`**.
4. Register the process in [transaction.js](transaction.js) (`PROCESSES`).

Built-in modules currently resolve only the classic card request-payment transitions.

Checkout already uses `getCheckoutPaymentOptions`, `getCheckoutPaymentTransitions`, and
`isStripePushPaymentMethod`. Correct process hooks are the main client integration surface.

### Checklist for a new process with payments

1. **Backend process (Sharetribe CLI)** — Mirror the graph also in these client-side processes.
2. **Client process module** — Graph, `supportedPayments`, and `getCheckoutPaymentTransitions` as
   above; register in `transaction.js`.
3. **Payment method catalog** — If the method is new, add it to `PAYMENT_METHOD_DEFINITIONS` in
   [paymentMethods.js](paymentMethods.js) (`paymentDirection: 'push'`, currency allowlist,
   `supportsSavePaymentMethod: false`).
4. **Server allowlist** — Add the Stripe type string to `STRIPE_PUSH_PAYMENT_METHOD_TYPES` in
   `server/api-util/pushPaymentMethodValidation.js`.
5. **Marketplace texts** — Add `StripePaymentForm.paymentMethod.{id}` (and optional `.hint`) in
   translations.
6. **Account deletion** — Update `server/api/delete-account.js` for Stripe-related states (see
   above).
7. **Multi-method checkout** — When more than one method is offered, checkout persists
   `protectedData.checkoutPaymentMethod`. Provider/operator UI that chooses accept vs
   accept-without-capture should read that value.

## [transaction.js](transaction.js)

This file is the main file and it works as a utility module imported on different presentational and
container components as well as with those \*.duck.js files that fetch data from Marketplace API.

As a summary: this file defines what unit types are expected in different processes and it exports
the different transaction processes and some functions that can be used in those containers and
components that need to make decisions based on the currently used transaction process.

## [paymentMethods.js](paymentMethods.js)

Checkout payment method ids, metadata (e.g. `supportsSavePaymentMethod`, `supportedCurrencies`), and
validation helpers (`isPaymentMethodSupportedForCurrency`, `isCheckoutPaymentMethodAvailable`,
`getCheckoutPaymentOptions`).

`getCheckoutPaymentOptions` derives available method ids (`{ value }`) from
`process.supportedPayments.stripe` plus currency rules — the process graph is the source of truth
for which methods the UI may offer (see
[Payment methods and transaction processes](#payment-methods-and-transaction-processes)). Selector
labels/hints live in StripePaymentForm.

Import this module **before** [transaction.js](transaction.js) when a file needs both. Process
definitions (`transactionProcess*.js`) depend on `paymentMethods.js`, and `transaction.js` loads
those process modules — importing `transaction.js` first can make circular dependency issues more
likely if `paymentMethods.js` ever needs symbols from `transaction.js`.

## [transactionProcessBooking.js](transactionProcessBooking.js)

This file defines the process graph of _default-booking_ for the web app (bookable services and
rentals).

## [transactionProcessPurchase.js](transactionProcessPurchase.js)

This file defines the process graph of _default-purchase_ for the web app (product purchases).

## [transactionProcessDownload.js](transactionProcessDownload.js)

This file defines the process graph of _default-download_ for the web app (digital file purchases).

## [transactionProcessInquiry.js](transactionProcessInquiry.js)

This file defines the process graph of _default-inquiry_ for the web app. The default-inquiry
process is a very simple transaction process without payments. Its job is to make it possible for
customers to contact and start messaging with providers. Since Stripe is not available for every
country, this process could be used instead.

Note: you need to figure out the monetization model separately as payments (and commissions) don't
happen through the platform with this process.

## [transactionProcessNegotiation.js](transactionProcessNegotiation.js)

This file defines the process graph for default-negotiation in the web app. It describes the price
negotiation between the customer and the provider. There are separate initial transitions for both
roles. The client app selects the appropriate transition based on the listing type configuration.

The unit type of the listing is used to determine which initial transition is used. If the unit type
is "offer", the transaction process follows the regular flow: the provider has created the listing.
However, if the unit type is "request", the listing is created by the customer, and the transaction
is initiated when the provider responds to the request by making an offer.

## [../../ext/transaction-processes](../../ext/transaction-processes/README.md)

These files reference the actual transaction processes that are available by default on each
marketplace.

> Note: changing these files or email templates doesn't change the actual processes in your
> marketplace environments unless you use Sharetribe CLI to actually update the processes listed in
> the Console.
