# Client app's own API

This directory contains the client app's own API endpoints. The web app uses these endpoints when it
needs to perform actions in a secure environment. For example, setting line-items for custom pricing
can't be done in the browser.

## API endpoints

The server exposes these endpoints under the prefix `/api/*`.

### transaction-line-items.js

The web app (located in the `../../src` directory) calls this endpoint to get the line-items for the
order breakdown on pages where a transaction has not yet been created (e.g. on `ListingPage`) or
where pricing information has not yet been saved for the transaction (e.g. inquiry state in the
default-booking process).

This endpoint fetches the listing entity from the Marketplace API and the commission asset from the
Content Delivery API.

The following parameters are required in the request body:

- `isOwnListing` – boolean, whether the listing is owned by the current user
- `listingId` – string, the ID of the listing
  - The listing is fetched from the Marketplace API
- `orderData` – object, the order data  
  The required properties vary depending on the `unitType` of the listing.

  - unitType: `item` – product order
    - `stockReservationQuantity`
    - `deliveryMethod`
  - unitType: `day` or `night` – bookable listings with a date range
    - `bookingStart`
    - `bookingEnd`
    - `seats` (optional)
  - unitType: `hour` – bookable listings with an hourly range
    - `bookingStart`
    - `bookingEnd`
    - `seats` (optional)
  - unitType: `fixed` – bookable listings with fixed-length sessions
    - `bookingStart`
    - `bookingEnd`
    - `seats` (optional)

The endpoint returns the line-items for the order breakdown. It is mainly called from the listing
page for bookable listings or product orders (`unitType: item`).

### initiate-privileged.js

The web app calls this endpoint to initiate a **privileged transition**. This often happens on the
checkout page (for bookable listings and product orders). For the negotiation process, it may also
be called from the `InitiateNegotiationPage` (`transition/make-offer`).

This endpoint fetches the listing entity from the Marketplace API and the commission asset from the
Content Delivery API.

The following parameters are required in the request body:

- `isSpeculative` – boolean, whether the transition is speculative or a real transition
- `bodyParams` – object containing data for the transition:
  [processAlias, transition, params](https://www.sharetribe.com/api-reference/marketplace.html#initiate-transaction)
- `queryParams` – object, the
  [query parameters](https://www.sharetribe.com/api-reference/#common-query-parameters)
- `orderData` – object, used to pass extra info to the server (e.g. to calculate the line-items)  
  It can contain similar properties as the `orderData` in the `transaction-line-items` endpoint, but
  additionally there can be properties related to default-negotiation process:

  - unitType: `request` – listings created by the customer with the negotiation process
    - `offerInSubunits` - number, representing the current negotiation offer for the "project"
    - `currency` - needed if no price attribute is set for the listing entity
    - `actor` - string, the actor of the transition (e.g. "provider")
  - unitType: `offer` – listings created by the provider with the negotiation process
    - `offerInSubunits` - number, representing the current negotiation offer for the "project"
    - `currency` - needed if no price attribute is set for the listing entity
    - `actor` - string, the actor of the transition (e.g. "provider")

### transition-privileged.js

This endpoint is similar to the `initiate-privileged` endpoint, but it is called when the
transaction has already been initiated and the next transition in the process is marked as
**privileged**. The main difference is that this endpoint fetches the transaction entity and related
listing as a relationship - instead of fetching the listing directly.

Check the mandatory body parameters in the
[Marketplace API endpoint](https://www.sharetribe.com/api-reference/marketplace.html#transition-transaction)
and additional **params** in the transaction process visualizer on the Marketplace Console.

Since this endpoint also handles transitions in the negotiation process, it might need the offer
data (`offerInSubunits` etc.) to calculate the line-items. In addition, it needs to save all offers
to the **metadata** of the transaction entity. The parameter requirements of this endpoint are
similar to the `initiate-privileged` endpoint and `transaction-line-items` endpoint.

> Note: because the Sharetribe Web Template mainly uses privileged transitions for adding line-items
> to the transaction entity, there has been little need for implementing transition-specific
> features. The negotiation-related transitions are now the only ones that have deviated from the
> plain line-item generation. If there's more need for transition-specific behaviour, this setup
> might need to be revisited.

### initiate-login-as.js

This endpoint is used to initiate a "login-as" transition. Operators use this to log in as a
different user on the marketplace. For example, an operator might help a provider refine a listing
description or try to replicate an error a user has encountered.

### login-as.js

This endpoint represents the second phase of the authentication process for the "login-as" feature.

### delete-account.js

This endpoint is used to allow users to delete their accounts from a marketplace - done from the
account management tab in user settings. It does not allow deletion if certain conditions are not
met: the user cannot have transactions that are in payment processing states.
