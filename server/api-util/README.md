# Utilities

This directory contains utility functions that support the server-side API endpoints and resources.

## Highlighted files

### lineItems.js

This is the main utility for generating transaction line items that drive pricing. Based on the
listing's unit type, it determines what order data is needed and generates the appropriate line
items for the transaction process engine. Check the documentation of line items from the
[action/privileged-set-line-items](https://www.sharetribe.com/docs/references/transaction-process-actions/#pricing).

**Main Function:**

- `transactionLineItems(listing, orderData, providerCommission, customerCommission)` - Generates an
  array of line items for a transaction

**Supported Unit Types:**

#### Day-based bookings (`unitType: 'day'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(10000, 'EUR'), // €100.00 per day
    publicData: {
      unitType: 'day',
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData
const orderData = {
  bookingStart: '2024-01-01T00:00:00.000Z',
  bookingEnd: '2024-01-03T00:00:00.000Z',
  seats: 3,
};

// Generated line items
[
  {
    code: 'line-item/day',
    unitPrice: new Money(10000, 'EUR'), // €100.00 per day
    units: 2, // 2 days
    seats: 3, // 3 seats
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(60000, 'EUR'), // Base amount (2 days × 3 seats × €100 = €600)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(60000, 'EUR'), // Base amount (2 days × 3 seats × €100 = €600)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

#### Night-based bookings (`unitType: 'night'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(15000, 'EUR'), // €150.00 per night
    publicData: {
      unitType: 'night',
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData
const orderData = {
  bookingStart: '2024-01-01T00:00:00.000Z',
  bookingEnd: '2024-01-04T00:00:00.000Z',
};

// Generated line items
[
  {
    code: 'line-item/night',
    unitPrice: new Money(15000, 'EUR'), // €150.00 per night
    quantity: 3, // 3 nights
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(45000, 'EUR'), // Base amount (3 nights × €150 = €450)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(45000, 'EUR'), // Base amount (3 nights × €150 = €450)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

#### Hour-based bookings (`unitType: 'hour'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(2500, 'EUR'), // €25.00 per hour
    publicData: {
      unitType: 'hour',
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData
const orderData = {
  bookingStart: '2024-01-01T09:00:00.000Z',
  bookingEnd: '2024-01-01T13:00:00.000Z',
  seats: 2,
};

// Generated line items
[
  {
    code: 'line-item/hour',
    unitPrice: new Money(2500, 'EUR'), // €25.00 per hour
    units: 4, // 4 hours
    seats: 2, // 2 seats
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(20000, 'EUR'), // Base amount (4 hours × 2 seats × €25 = €200)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(20000, 'EUR'), // Base amount (4 hours × 2 seats × €25 = €200)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

#### Fixed-duration bookings (`unitType: 'fixed'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(5000, 'EUR'), // €50.00 per session
    publicData: {
      unitType: 'fixed',
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData
const orderData = {
  bookingStart: '2024-01-01T10:00:00.000Z',
  bookingEnd: '2024-01-01T12:00:00.000Z',
  seats: 5,
};

// Generated line items
[
  {
    code: 'line-item/fixed',
    unitPrice: new Money(5000, 'EUR'), // €50.00 per session
    units: 1, // 1 session
    seats: 5, // 5 seats
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(25000, 'EUR'), // Base amount (1 session × 5 seats × €50 = €250)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(25000, 'EUR'), // Base amount (1 session × 5 seats × €50 = €250)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

#### Purchases (`unitType: 'item'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(2000, 'EUR'), // €20.00 per item
    publicData: {
      unitType: 'item',
      shippingPriceInSubunitsOneItem: 500, // €5.00 for first item
      shippingPriceInSubunitsAdditionalItems: 200, // €2.00 for each additional item
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData for pickup (no shipping)
const orderDataPickup = {
  stockReservationQuantity: 2,
  deliveryMethod: 'pickup',
  currency: 'EUR',
};

// Generated line items for pickup
[
  {
    code: 'line-item/item',
    unitPrice: new Money(2000, 'EUR'), // €20.00 per item
    quantity: 2, // 2 items
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(4000, 'EUR'), // Base amount (2 items × €20 = €40)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(4000, 'EUR'), // Base amount (2 items × €20 = €40)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];

// Example orderData for shipping
const orderDataShipping = {
  stockReservationQuantity: 3,
  deliveryMethod: 'shipping',
  currency: 'EUR',
};

// Generated line items for shipping (with shipping fee)
[
  {
    code: 'line-item/item',
    unitPrice: new Money(2000, 'EUR'), // €20.00 per item
    quantity: 3, // 3 items
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/shipping-fee',
    unitPrice: new Money(900, 'EUR'), // €9.00 shipping (€5 + €2×2)
    quantity: 1,
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(6000, 'EUR'), // Base amount (3 items × €20 = €60, shipping excluded)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(6000, 'EUR'), // Base amount (3 items × €20 = €60, shipping excluded)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

#### Price negotiation (`unitType: 'request'`)

```javascript
// Assumed data on listing entity
const listing = {
  attributes: {
    price: new Money(10000, 'EUR'), // €100.00 listing price
    publicData: {
      unitType: 'request',
    },
  },
};

// Assumed commission configuration
const providerCommission = {
  percentage: 10,
  minimum_amount: 500, // €5.00 minimum
};

const customerCommission = {
  percentage: 5,
  minimum_amount: 200, // €2.00 minimum
};

// Example orderData with offer
const orderDataWithOffer = {
  offer: new Money(15000, 'EUR'), // €150.00 offer amount
  currency: 'EUR',
};

// Generated line items with offer
[
  {
    code: 'line-item/request',
    unitPrice: new Money(15000, 'EUR'), // €150.00 offer amount
    quantity: 1,
    includeFor: ['customer', 'provider'],
  },
  {
    code: 'line-item/provider-commission',
    unitPrice: new Money(15000, 'EUR'), // Base amount (€150)
    percentage: -10, // -10% commission
    includeFor: ['provider'],
  },
  {
    code: 'line-item/customer-commission',
    unitPrice: new Money(15000, 'EUR'), // Base amount (€150)
    percentage: 5, // 5% commission
    includeFor: ['customer'],
  },
];
```

### negotiation.js

Utility functions for handling the negotiation process, including offer validation, metadata
management, and transition handling.

There are functions to check what the intention of the transition is: to make an initial offer, make
a counter offer, or revoke a counter offer.

In addition, it's also necessary to ensure data integrity by validating that offers correspond to
the correct transitions and maintain proper negotiation history in the transaction metadata.

### sdk.js

Core SDK utilities for interacting with the Sharetribe APIs.

**Main Functions:**

#### `getSdk(req, res)`

Creates an SDK instance that calls Sharetribe APIs (authentication API, Marketplace API and Content
Delivery API). If the authenticated user's session token is found in cookies, the SDK takes it into
account.

#### `getTrustedSdk(req)`

Creates a trusted SDK instance with elevated privileges by exchanging the user's token for a trusted
token using the client secret.

**Additional Utilities:**

- `fetchCommission(sdk)` - Retrieves commission configuration from Content Delivery API
- `fetchBranding(sdk)` - Retrieves branding configuration for server-side rendering
- `fetchAccessControlAsset(sdk)` - Retrieves access control configuration
- `serialize(data)` / `deserialize(str)` - Handle Transit serialization for API responses
- `handleError(res, error)` - Standardized error handling for API responses
