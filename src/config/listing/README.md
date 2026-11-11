# Listing config

Listing types and custom listing fields. Hosted assets `/listings/listing-types.json` and
`/listings/listing-fields.json` map to `config.listing`.

By default, hosted data replaces built-ins in [`defaultListing.js`](./defaultListing.js). Those
built-ins are only mixed in when debugging merge is on (`mergeDefaultTypesAndFieldsForDebugging`).
Category config must be resolved first so field category limits can be checked.

## `config.listing` shape

```js
{
  listingTypes: [
    {
      listingType, // hosted id
      label,
      transactionType: { process, alias, unitType },
      // always allowed when present:
      defaultListingFields?,
      messagingOptions?,
      transactionFields?, // [{ key, label, schemaType, scope: 'protected', showConfig, saveConfig, ... }]
      // process-specific (others are stripped):
      availabilityType?,   // booking
      priceVariations?,    // booking
      stockType?,          // purchase
      negotiationOptions?, // negotiation
    },
    // ...
  ],
  listingFields: [
    {
      key,
      label,
      scope, // 'public' | 'private' | 'metadata'
      schemaType,
      enumOptions?,
      numberConfig?,
      filterConfig,
      showConfig,
      saveConfig, // required → isRequired
      categoryConfig?,
      listingTypeConfig?,
      // ...
    },
    // ...
  ],
  enforceValidListingType, // from built-ins
}
```

Field `categoryConfig` is checked against `categoryConfiguration.categories`. If categories are
empty or missing, `limitToCategoryIds` is cleared and the field is kept.

## When something is wrong

**MaintenanceMode** is shown if:

- No listing types (at least one is required).
- The listing-fields asset is missing (an empty `[]` is fine).
- A listing field key clashes with a built-in / reserved public data key (or a `priceVariant*`
  prefix). Fields are not namespaced in public data, so a clash makes the property ambiguous.

**Otherwise** invalid listing types and fields are dropped (missing label, bad id/key, duplicates,
unsupported process/alias/unitType, bad schemaType, and similar). `unitType` must belong to the
**current** process. Process-specific leftovers from a prior process are stripped (e.g. booking-only
`availabilityType` / `priceVariations`, purchase-only `stockType`, negotiation-only
`negotiationOptions`).
