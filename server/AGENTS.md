# server/AGENTS.md - Backend & API Patterns

> **This file contains backend and API patterns for the Sharetribe Web Template.** Use this when working with Express, SSR, API endpoints, middleware, and server-side features.

**You are here:** `/server/AGENTS.md`
**Main guide:** [`/AGENTS.md`](../AGENTS.md) (includes Console Configuration)
**Frontend patterns:** [`/src/AGENTS.md`](../src/AGENTS.md)
**Component guide:** [`/src/components/AGENTS.md`](../src/components/AGENTS.md)
**Page patterns:** [`/src/containers/AGENTS.md`](../src/containers/AGENTS.md)

---

## Backend Structure - Composable Resource-Based API

**Organize custom endpoints by resource with composable `index.js` files:**

```
server/
├── index.js                      # Main Express server
├── apiRouter.js                  # Sharetribe API routes (don't modify)
├── api/                          # Sharetribe API handlers (don't modify)
│   ├── auth/                     # OAuth handlers (Sharetribe)
│   ├── transaction-line-items.js # Sharetribe
│   ├── initiate-privileged.js    # Sharetribe
│   └── transition-privileged.js  # Sharetribe
│
├── custom/                       # YOUR CUSTOM API CODE
│   ├── index.js                  # Composes all custom resource routers
│   │
│   ├── listings/                 # Listings resource
│   │   ├── index.js              # Listings router (composes controllers)
│   │   ├── create.js             # POST /api/listings
│   │   ├── getById.js            # GET /api/listings/:id
│   │   ├── update.js             # PUT /api/listings/:id
│   │   └── delete.js             # DELETE /api/listings/:id
│   │
│   ├── users/                    # Users resource
│   │   ├── index.js              # Users router (composes controllers)
│   │   ├── getProfile.js         # GET /api/users/:id/profile
│   │   ├── updateProfile.js      # PUT /api/users/:id/profile
│   │   └── getStats.js           # GET /api/users/:id/stats
│   │
│   ├── analytics/                # Analytics resource
│   │   ├── index.js              # Analytics router (composes controllers)
│   │   ├── trackEvent.js         # POST /api/analytics/events
│   │   └── getMetrics.js         # GET /api/analytics/metrics
│   │
│   └── middleware/               # Shared middleware
│       ├── auth.js               # Auth middleware
│       ├── validate.js           # Validation middleware
│       └── errorHandler.js       # Error handling
│
└── renderer.js                   # SSR renderer
```

**Key Principles:**

1. Each resource has its own `index.js` that exports a router
2. Resource routers are composed together in `custom/index.js`
3. Custom router is mounted in `apiRouter.js` at `/api` level
4. Keep custom code separate from Sharetribe code for easy upstream merges

---

## Creating Custom API - Step by Step

### Step 1: Create Resource Controllers

```javascript
// server/custom/listings/create.js
const { getSdk } = require('../../api-util/sdk');

/**
 * Create a new listing
 * POST /api/listings
 */
module.exports = async (req, res) => {
  try {
    const { body, user } = req;
    const sdk = getSdk(req, res);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'unauthorized',
          status: 401,
        },
      });
    }

    const { title, description, price } = body;

    const response = await sdk.ownListings.create({
      title,
      description,
      price,
      publicData: {
        // Custom fields
      },
    });

    return res.status(201).json({
      data: response.data.data,
    });
  } catch (error) {
    console.error('[Listings] Create error:', error);

    return res.status(500).json({
      error: {
        message: error.message || 'Failed to create listing',
        code: 'listing-create-failed',
        status: 500,
      },
    });
  }
};
```

```javascript
// server/custom/listings/getById.js
const { getSdk } = require('../../api-util/sdk');

/**
 * Get listing by ID
 * GET /api/listings/:id
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const sdk = getSdk(req, res);

    const response = await sdk.listings.show({
      id,
      include: ['author', 'images'],
    });

    return res.status(200).json({
      data: response.data.data,
    });
  } catch (error) {
    console.error('[Listings] Get by ID error:', error);

    return res.status(404).json({
      error: {
        message: 'Listing not found',
        code: 'listing-not-found',
        status: 404,
      },
    });
  }
};
```

### Step 2: Create Resource Router (Composable)

```javascript
// server/custom/listings/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const create = require('./create');
const getById = require('./getById');
const update = require('./update');
const deleteController = require('./delete');

// Import middleware
const { requireAuth } = require('../middleware/auth');
const { validateListing } = require('../middleware/validate');

// Define routes
router.post('/', requireAuth, validateListing, create);
router.get('/:id', getById);
router.put('/:id', requireAuth, validateListing, update);
router.delete('/:id', requireAuth, deleteController);

module.exports = router;
```

```javascript
// server/custom/users/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const getProfile = require('./getProfile');
const updateProfile = require('./updateProfile');
const getStats = require('./getStats');

// Import middleware
const { requireAuth } = require('../middleware/auth');

// Define routes
router.get('/:id/profile', getProfile);
router.put('/:id/profile', requireAuth, updateProfile);
router.get('/:id/stats', requireAuth, getStats);

module.exports = router;
```

```javascript
// server/custom/analytics/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const trackEvent = require('./trackEvent');
const getMetrics = require('./getMetrics');

// Import middleware
const { requireAuth } = require('../middleware/auth');

// Define routes
router.post('/events', trackEvent);
router.get('/metrics', requireAuth, getMetrics);

module.exports = router;
```

### Step 3: Compose Resources Together

```javascript
// server/custom/index.js
const express = require('express');
const router = express.Router();

// Import resource routers
const listingsRouter = require('./listings');
const usersRouter = require('./users');
const analyticsRouter = require('./analytics');

// Mount resource routers
router.use('/listings', listingsRouter);
router.use('/users', usersRouter);
router.use('/analytics', analyticsRouter);

module.exports = router;
```

### Step 4: Register in Main API Router

```javascript
// server/apiRouter.js
const router = require('express').Router();

// Existing Sharetribe routes (don't modify)
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');

router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);
// ... other Sharetribe routes

// Mount custom API (all resource routers at /api level)
const customRouter = require('./custom');
router.use(customRouter);

module.exports = router;
```

**Result:** Clean REST API structure at `/api` level:

```
POST   /api/listings
GET    /api/listings/:id
PUT    /api/listings/:id
DELETE /api/listings/:id

GET    /api/users/:id/profile
PUT    /api/users/:id/profile
GET    /api/users/:id/stats

POST   /api/analytics/events
GET    /api/analytics/metrics
```

---

## Middleware Patterns

### Authentication Middleware

```javascript
// server/custom/middleware/auth.js

/**
 * Require authenticated user
 */
const requireAuth = (req, res, next) => {
  const { user } = req;

  if (!user || !user.id) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'unauthorized',
        status: 401,
      },
    });
  }

  next();
};

/**
 * Require specific user role
 */
const requireRole = (role) => {
  return (req, res, next) => {
    const { user } = req;

    if (!user?.publicData?.role || user.publicData.role !== role) {
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'forbidden',
          status: 403,
        },
      });
    }

    next();
  };
};

module.exports = { requireAuth, requireRole };
```

### Validation Middleware

```javascript
// server/custom/middleware/validate.js

/**
 * Validate listing data
 */
const validateListing = (req, res, next) => {
  const { title, price } = req.body;

  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
    });
  }

  if (!price || price.amount <= 0) {
    errors.push({
      field: 'price',
      message: 'Price must be greater than 0',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'validation-error',
        status: 400,
        details: errors,
      },
    });
  }

  next();
};

/**
 * Validate user profile data
 */
const validateUserProfile = (req, res, next) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({
      error: {
        message: 'First and last name are required',
        code: 'validation-error',
        status: 400,
      },
    });
  }

  next();
};

module.exports = { validateListing, validateUserProfile };
```

---

## REST API Design Principles

### URL Structure

```
/api/{resource}                   # Collection
/api/{resource}/:id               # Single item
/api/{resource}/:id/{sub}         # Sub-resource
/api/{resource}/{action}          # Action on collection
/api/{resource}/:id/{action}      # Action on item
```

### HTTP Methods

```
GET    /api/listings              # List all listings
POST   /api/listings              # Create listing
GET    /api/listings/:id          # Get single listing
PUT    /api/listings/:id          # Update listing (full)
PATCH  /api/listings/:id          # Update listing (partial)
DELETE /api/listings/:id          # Delete listing

GET    /api/users/:id/listings    # Get user's listings
POST   /api/listings/:id/publish  # Action on resource
```

### Response Format

**Success (200-299):**

```javascript
{
  data: {
    id: 'resource-id',
    type: 'listing',
    attributes: { /* ... */ },
  },
  meta: {
    total: 100,
    page: 1,
    perPage: 20,
  }
}
```

**Error (400-599):**

```javascript
{
  error: {
    message: 'Resource not found',
    code: 'resource-not-found',
    status: 404,
    details: [
      { field: 'id', message: 'Invalid ID format' }
    ]
  }
}
```

### Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Calling Custom API from Frontend

### Create API Utility

```javascript
// src/util/api.js (create this file)
import { types as sdkTypes } from './sdkLoader';

/**
 * Call custom API endpoint
 */
export const callApi = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Include cookies for auth
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`/api${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API call failed');
  }

  return data;
};

// Resource-specific API calls
export const listingsApi = {
  create: (data) => callApi('/listings', { method: 'POST', body: data }),
  getById: (id) => callApi(`/listings/${id}`),
  update: (id, data) => callApi(`/listings/${id}`, { method: 'PUT', body: data }),
  delete: (id) => callApi(`/listings/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  getProfile: (id) => callApi(`/users/${id}/profile`),
  updateProfile: (id, data) => callApi(`/users/${id}/profile`, { method: 'PUT', body: data }),
  getStats: (id) => callApi(`/users/${id}/stats`),
};

export const analyticsApi = {
  trackEvent: (eventName, properties) =>
    callApi('/analytics/events', {
      method: 'POST',
      body: { eventName, properties },
    }),
  getMetrics: () => callApi('/analytics/metrics'),
};
```

### Use in React Components

```javascript
// Use in React component
import { listingsApi, analyticsApi } from '../../util/api';

const MyComponent = () => {
  const handleCreate = async () => {
    try {
      const result = await listingsApi.create({
        title: 'New Listing',
        price: { amount: 5000, currency: 'USD' },
      });

      await analyticsApi.trackEvent('listing_created', {
        listingId: result.data.id.uuid,
      });

      console.log('Created:', result.data);
    } catch (error) {
      console.error('Failed:', error.message);
    }
  };

  return <button onClick={handleCreate}>Create Listing</button>;
};
```

---

## Environment Variables

Required in `.env` (copy from `.env-template`):

```bash
REACT_APP_SHARETRIBE_SDK_CLIENT_ID=your-client-id
REACT_APP_SHARETRIBE_SDK_BASE_URL=https://flex-api.sharetribe.com
REACT_APP_MARKETPLACE_ROOT_URL=http://localhost:3000

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Maps (Mapbox OR Google Maps)
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.ey...
```

**Important:**
- All frontend-accessible vars must be prefixed with `REACT_APP_`
- Server-only vars (like `STRIPE_SECRET_KEY`) do NOT have the prefix
- Never commit `.env` file to version control
- Always use `.env-template` as the template for new developers

---

## Server-Side Rendering (SSR)

The Express server handles SSR for all pages.

### How SSR Works

1. **User requests page** (e.g., `/listing/123`)
2. **Express server** receives request
3. **Route matcher** finds matching route and `loadData` function
4. **loadData executes** on server, fetches data from Sharetribe API
5. **Renderer** renders React component to HTML string with prefetched data
6. **Server sends HTML** with embedded data to browser
7. **Client hydrates** React app on top of server-rendered HTML
8. **App is interactive** - React takes over

### Benefits

- **SEO**: Search engines see full HTML
- **Performance**: First paint is faster
- **Social sharing**: Meta tags work for previews

### Key Files

- [server/index.js](./index.js) - Main Express server
- [server/renderer.js](./renderer.js) - SSR renderer
- [server/dataLoader.js](./dataLoader.js) - Data loading orchestration

---

## Security Considerations

### API Security Checklist

1. **Authentication**: Use `requireAuth` middleware for protected routes
2. **Authorization**: Check user owns resource before allowing modifications
3. **Input Validation**: Validate all user inputs with middleware
4. **Output Sanitization**: Sanitize user data before rendering (see [src/util/sanitize.js](../src/util/sanitize.js))
5. **CORS**: Configure CORS properly for production
6. **Rate Limiting**: Add rate limiting for public endpoints
7. **Secrets**: Never expose secret keys to frontend

### Example: Ownership Check

```javascript
// server/custom/listings/update.js
const { getSdk } = require('../../api-util/sdk');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const sdk = getSdk(req, res);

    // Fetch listing to check ownership
    const listingResponse = await sdk.listings.show({ id });
    const listing = listingResponse.data.data;

    // Check if user owns listing
    if (listing.relationships.author.data.id.uuid !== user.id.uuid) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to update this listing',
          code: 'forbidden',
          status: 403,
        },
      });
    }

    // Proceed with update
    const updateResponse = await sdk.ownListings.update({
      id,
      ...req.body,
    });

    return res.status(200).json({
      data: updateResponse.data.data,
    });
  } catch (error) {
    console.error('[Listings] Update error:', error);

    return res.status(500).json({
      error: {
        message: 'Failed to update listing',
        code: 'listing-update-failed',
        status: 500,
      },
    });
  }
};
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
yarn install

# Configure environment
yarn run config

# Start dev server (with hot reload)
yarn run dev

# Production build
yarn run build

# Start production server
yarn start
```

### Testing API Endpoints

```bash
# Using curl
curl http://localhost:3000/api/listings

# Using httpie
http GET localhost:3000/api/listings

# Using Postman
# Import API collection and test endpoints
```

---

## Sharetribe SDK

The Sharetribe SDK is available in API handlers via `getSdk()`.

### Common SDK Methods

```javascript
const { getSdk } = require('../api-util/sdk');

const sdk = getSdk(req, res);

// Listings
await sdk.listings.query({ perPage: 20 });
await sdk.listings.show({ id: 'listing-uuid', include: ['author', 'images'] });
await sdk.ownListings.create({ title, description, price });
await sdk.ownListings.update({ id, title });
await sdk.ownListings.close({ id });

// Users
await sdk.users.show({ id: 'user-uuid' });
await sdk.currentUser.show();
await sdk.currentUser.updateProfile({ publicData: { ... } });

// Transactions
await sdk.transactions.query({ perPage: 20 });
await sdk.transactions.show({ id: 'tx-uuid', include: ['listing', 'provider', 'customer'] });
await sdk.transactions.initiate({ ... });
await sdk.transactions.transition({ id, transition: 'accept', ... });

// Images
await sdk.images.upload({ image: fileBlob });
```

### SDK Documentation

- **JS SDK Reference**: https://www.sharetribe.com/docs/references/js-sdk/
- **Marketplace API**: https://www.sharetribe.com/api-reference

---

## Getting Help

- **Sharetribe Docs**: https://www.sharetribe.com/docs
- **Help Center**: https://www.sharetribe.com/help/en/
- **API Reference**: https://www.sharetribe.com/api-reference
- **Transaction Engine**: https://www.sharetribe.com/docs/concepts/transaction-process/

---

**Remember**: For frontend patterns (React, Redux, styling), see [src/AGENTS.md](../src/AGENTS.md). For page patterns, see [src/containers/AGENTS.md](../src/containers/AGENTS.md).
