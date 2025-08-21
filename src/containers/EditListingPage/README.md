# EditListingPage

This page is used for creating new listings or editing existings ones. New listings are first
creates as drafts until the full listing is created. Existing listings are updated when saving the
for in each tab.

## Structure

Listing creation and editing is structured in several layers described below.

### EditListingWizard

The wizard sets up listing creation and editing into multiple tabs and panels. If you need to add,
remove, or reorder the different phases of the listing creation process, the wizard is the place to
look at.

The wizard also keeps track if a tab is completed and which tabs should be accessible. Therefore it
is important to update the logic in the `tabCompleted` function when changing the form contenst of a
tab.

### EditListingWizardTab

The tab defines which panel to render for a given tab. It also defines how to route to the next
panel in order.

### PayoutDetails

The wizard prompts the user to connect their payout details before allowing publishing a listing.
This is only done if the user has not connected the Stripe account and payout details are required
for the listing type.

Note: If payout details are not required for a process that uses Stripe payments, a customer can't
purchase the listing as the default Stripe integration requires destination account (Stripe Connect
Account) with payout details to be set for the receiver of the payment.

### Panels

A panel is the content for a single wizard tab. It renders the correct form and handles the data
flow to and from the form.

Note: each process has their own set of panels. Check the
[EditListingWizard](./EditListingWizard/EditListingWizard.js#L65) for more information.

### Forms

Panels contain forms that collect input from the user and submit the tab data.

## Data gathered and updated

Each panel has a `onSubmit` function that is called when the form is submitted. The function is
responsible for updating the listing data.

### Panel Data Collection and Storage

The EditListingWizard uses different tab configurations based on the transaction process type.
Here's what data each panel collects and where it's stored:

#### **Details Panel** (`DETAILS`)

- **Data collected**: Title, description, listing type, transaction process alias, unit type,
  categories, and custom listing fields
- **Stored in**:
  - `listing.attributes.title` - Listing title
  - `listing.attributes.description` - Listing description
  - `listing.attributes.publicData.listingType` - Type of listing (e.g., 'product-selling',
    'rental')
  - `listing.attributes.publicData.transactionProcessAlias` - Transaction process identifier
  - `listing.attributes.publicData.unitType` - Unit for pricing (e.g., 'day', 'night', 'hour',
    'fixed')
  - `listing.attributes.publicData.categoryLevel1` - Main category (if categories are in use)
  - `listing.attributes.publicData.categoryLevel2` - Subcategory (nested under main category)
  - `listing.attributes.publicData.categoryLevel3` - Subcategory (nested under subcategory)
  - `listing.attributes.publicData.{fieldId}` - Custom listing fields (public scope)
  - `listing.attributes.privateData.{fieldId}` - Custom listing fields (private scope)

#### **Pricing Panel** (`PRICING`)

- **Data collected**: Price (and optionally price variations for booking processes)
- **Stored in**:
  - `listing.attributes.price` - Base price (Money object)
  - `listing.attributes.publicData.priceVariationsEnabled` - Whether price variations are enabled
    (only for booking processes)
  - `listing.attributes.publicData.priceVariants` - Array of price variants for different times
    (only when price variations enabled)
  - `listing.attributes.publicData.startTimeInterval` - Time interval for pricing (only for
    fixed-length bookings)

#### **Pricing and Stock Panel** (`PRICING_AND_STOCK`)

- **Data collected**: Price and stock quantity
- **Stored in**:
  - `listing.attributes.price` - Unit price (Money object)
  - **Stock is managed separately**: Stock quantity is stored in a separate `currentStock`
    relationship entity, not in `publicData`
  - Stock updates are handled via `sdk.stock.compareAndSet()` API calls

#### **Delivery Panel** (`DELIVERY`)

- **Data collected**: Delivery options (shipping/pickup), shipping prices, pickup location
- **Stored in**:
  - `listing.attributes.publicData.shippingEnabled` - Whether shipping is enabled
  - `listing.attributes.publicData.pickupEnabled` - Whether pickup is enabled
  - `listing.attributes.publicData.shippingPriceInSubunitsOneItem` - Shipping cost for first item
  - `listing.attributes.publicData.shippingPriceInSubunitsAdditionalItems` - Shipping cost for
    additional items
  - `listing.attributes.publicData.location.address` - Pickup address
  - `listing.attributes.publicData.location.building` - Building information
  - `listing.attributes.geolocation` - Geographic coordinates for pickup

#### **Location Panel** (`LOCATION`)

- **Data collected**: Location address, building information
- **Stored in**:
  - `listing.attributes.geolocation` - Geographic coordinates (latitude/longitude)
  - `listing.attributes.publicData.location.address` - Full address string. This is a string that is
    used to display the address to the user.
  - `listing.attributes.publicData.location.building` - Building or unit information

#### **Availability Panel** (`AVAILABILITY`)

- **Data collected**: Weekly availability schedule, timezone, availability exceptions
- **Stored in**:
  - `listing.attributes.availabilityPlan` - Availability plan object with:
    - `type`: 'availability-plan/time'
    - `timezone`: Timezone for availability
    - `entries`: Array of weekly schedule entries with dayOfWeek, startTime, endTime, seats
  - **Availability Exceptions**: Users can add specific date/time exceptions to override regular
    availability:
    - Date range or specific date/time exceptions
    - Different seat availability for exception periods
    - Exceptions can make periods unavailable (0 seats) or adjust capacity
    - Exceptions are stored separately from the regular weekly schedule

#### **Photos Panel** (`PHOTOS`)

- **Data collected**: Listing images
- **Stored in**:
  - `listing.images` - Array of image objects with URLs and metadata
- **Usage**: Alternative final tab for listings that require images

#### **Style Panel** (`STYLE`)

- **Data collected**: Card style/color scheme for listing display
- **Stored in**:
  - `listing.attributes.publicData.cardStyle` - Color scheme identifier for listing cards
- **Usage**: Alternative final tab for listings without images

### Transaction Process Tab Configurations

The wizard shows different tabs based on the transaction process. Note that PHOTOS and STYLE are
alternative final tabs - only one is shown based on configuration:

- **Purchase process** (`TABS_PRODUCT`): [DETAILS, PRICING_AND_STOCK, DELIVERY, PHOTOS|STYLE]
- **Booking process** (`TABS_BOOKING`): [DETAILS, LOCATION, PRICING, AVAILABILITY, PHOTOS|STYLE]
- **Inquiry process** (`TABS_INQUIRY`): [DETAILS, LOCATION, PRICING, PHOTOS|STYLE]
- **Details Only** (`TABS_DETAILS_ONLY`): [DETAILS] - Used for draft listings when user has not
  selected a listing type.

**Note**: The choice between PHOTOS and STYLE as the final tab depends on the
`defaultListingFields.images` boolean on listing type configuration. If images are required, PHOTOS
is shown; otherwise, STYLE is shown.

### Tab Completion Logic

The `tabCompleted` function in EditListingWizard determines when a tab is considered complete:

- **DETAILS**: Requires title, description, listingType, transactionProcessAlias, unitType, and
  valid custom fields
- **PRICING/PRICING_AND_STOCK**: Requires price to be set
- **DELIVERY**: Requires at least one delivery option (shipping or pickup) to be enabled
- **LOCATION**: Requires geolocation and address
- **AVAILABILITY**: Requires availabilityPlan to be set
- **PHOTOS**: Requires at least one image
- **STYLE**: Requires cardStyle to be selected

## Adding a new field to a form

To add a new input to a tab, edit the corresponding form to add the field. Then update the
`initialValues` and `onSubmit` in the corresponding panel to update how listing data goes into and
out of the form.

Remember to also update the logic in the `tabCompleted` function in the wizard.

## Removing a panel

If you don't need a specific panel, just remove the panel from the `TABS` variable in the
`EditListingWizard` component.

## Adding a new panel

When adding a new panel, it helps to copy an existing panel/form as the starting point.

1.  Add a form
1.  Add a panel that renders the form and handles the data
1.  Add the panel to the `EditListingWizardTab` component
1.  Add the tab to the `EditListingWizard` in the `TABS` variable
1.  Check the `tabCompleted` function logic within the wizard
