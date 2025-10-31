# MakeOfferPage

The provider is navigated to this page when they are about to make an offer for a listing. The main
purpose of this page is to add an offer, which is then used to set the line items for the
transaction. This offer constitutes the initial offer in the negotiation.

In addition, the offer is saved to the transaction metadata as an entry in the offers array. The
"offers" array is used to track the history of offers made during the negotiation loop.

## Metadata

The metadata is saved to the transaction as an entry in the "offers" array. This array contains
objects with the following properties:

- **offerInSubunits**: the offer amount in subunits
- **by**: the actor who made the offer (either "provider" or "customer").
  - Currently, the actor is always "provider".
- **transition**: the transition that was triggered to initiate the negotiation:
  - `transition/make-offer`
  - `transition/make-offer-after-inquiry`
  - `transition/make-offer-from-request`

All of these transitions are only possible for the provider in the default-negotiation process.

> Note: the rest of the negotiation loop with counter offers happens on the TransactionPage.

## Line-items

Line items are added to the transaction using the `:action/privileged-set-line-items` action, which
is configured on the transition (on process that's visible on Console). These items define the price
of the listing, including any commissions and similar costs.
