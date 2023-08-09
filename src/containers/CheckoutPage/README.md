# CheckoutPage

This page handles transaction initialization with payments, if payments are used. In addition, the
default-inquiry process (which doesn't include payments) creates a new transaction when the form is
submitted.

## Different processes

This Sharetribe Web Template supports 3 processes:

- **_default-booking_**
- **_default-purchase_**
- **_default-inquiry_**

The first 2 transaction processes include Stripe payments, but the last one (**_default-inquiry_**)
does not.

## How customers navigate to CheckoutPage

There are 2 ways how customers can navigate to the checkout page:

- ListingPage
- TransactionPage

On both of those pages, there's a component called OrderPanel, which shows a correct form to collect
order data. The order data and listing entity are then passed to the CheckoutPage as initial data
for the page.

In addition, _default-booking_ and _default-purchase_ processes have a separate inquiry state at the
beginning of the process graph (to enable discussion between customer and provider). If the
transaction entity has been created with inquire transition, the transaction exists already and it
is also passed along with order data and listing entity for the CheckoutPage. In this scenario, the
customer navigates to CheckoutPage from TransactionPage.

## Order data and session storage

The order data, listing, and transaction are together considered essential data for the page, and
they are also saved to the **sessionStorage** for 1 day. This means that the page data is not lost
if the customer makes a full page load on the checkout page. Relevant files for sessionStorage
handling:

- [CheckoutPageSessionHelpers.js](./CheckoutPageSessionHelpers.js)
- [CheckoutPage.js](https://github.com/sharetribe/web-template/blob/inquiry-process/src/containers/CheckoutPage/CheckoutPage.js)

### Transactions with payments

When page data contains a listing with a listing type that uses _default-booking_ and
_default-purchase_ processes, the page uses a sub-component called **CheckoutPageWithPayment**.

First, the checkout page calls `loadInitialDataForStripePayments` for these Stripe-related
processes, which calls `fetchSpeculatedTransaction` if the transaction has not made any transition
that creates _line items_ for pricing and Stripe PaymentIntent. The "speculative transaction" has 2
purposes:

- it checks if Marketplace API can execute the transition without errors
- it gets **_line items_** from the client app's server - so that the order breakdown can be shown
  correctly.

With the speculative transaction, the job of the _CheckoutPageWithPayment_ component is to show the
order breakdown and _StripePaymentForm_, which then asks for billing details and a potential
shipping address.

After the form is submitted, the checkout flow is a rather complex one. First, `getOrderParams` is
called (it's also called with _fetchSpeculatedTransaction_). You might need to customize those order
params if you customize the _OrderPanel_, _checkout form_, or _transaction process_ itself.

In addition, there's actually a sequence of XHR calls that the app needs to make:

1. First step is to kickstart the payment process through Marketplace API.  
   This call is proxied through the client app's server, where custom pricing is done by creating
   line items for the transaction.
2. Then there's potentially 3D security verification that Stripe might show.  
   It's shown if the card issuer enforces it for the current payment intent.
3. If the Stripe verification succeeded, the payment needs to be confirmed against Marketplace API
4. If the initial message was added, that needs to be
   [sent separately](https://www.sharetribe.com/api-reference/marketplace.html#send-message)
5. If payment card details need to be saved as the default payment method, the last step is to do
   that.

Read more:

- [getOrderParams](./CheckoutPageWithPayment.js#L69)
- **processCheckoutWithPayment** function in
  [CheckoutPageTransactionHelpers.js](./CheckoutPageTransactionHelpers.js)
- [The aforementioned call sequence explained in the Docs](https://www.sharetribe.com/docs/how-to/enable-payment-intents/#3-checkoutpage-add-new-api-calls-and-call-them-in-sequence)  
  (This article is for devs who don't use Sharetribe Web Template - since the steps are already
  implemented in this codebase.)

After those API calls have been made, customer is redirected to TransactionPage, where customer can
continue messaging and view the order.

### Inquiry transactions

The transaction flow for inquiry transaction is much simpler. It just creates new transactions by
directly calling Marketplace API. In this process, the initial message is actually saved to the
transaction's protected data instead of sent as a
[Message entity](https://www.sharetribe.com/api-reference/marketplace.html#send-message).
